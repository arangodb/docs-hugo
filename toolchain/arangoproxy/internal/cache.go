package internal

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

// Writing the whole cache.json takes about 30 ms, so the entries are collected
// and written in batches instead of once per example
const cacheFlushInterval = 5 * time.Second

// Flush requests, answered when the pending entries are written
var cacheFlushChannel = make(chan chan struct{})

type pendingCacheEntry struct {
	entry    map[string]string
	response models.ExampleResponse
}

// FlushCache writes the pending entries to the cache files and waits for it
// (end of the run, shutdown)
func FlushCache() {
	done := make(chan struct{})
	cacheFlushChannel <- done
	<-done
}

func SaveCachedExampleResponse(chnl chan map[string]interface{}) {
	// Pending entries per cache file, written by the next flush
	pending := make(map[string]map[string]pendingCacheEntry)
	ticker := time.NewTicker(cacheFlushInterval)
	defer ticker.Stop()

	for {
		select {
		case cacheRequest := <-chnl:
			requestHash := cacheRequest["request"].(string)
			exampleResponse := cacheRequest["response"].(models.ExampleResponse)

			entryName := fmt.Sprintf("%s_%s", exampleResponse.Options.Name, exampleResponse.Options.Type)
			responseHash, _ := utils.EncodeToBase64(exampleResponse)

			models.Logger.Debug("[%s] Saving To Cache:\nInput Hash: %s\nOutput Hash:%s", entryName, requestHash, responseHash)

			cacheFilepath := fmt.Sprintf("%s/%s/cache.json", models.Conf.Cache, exampleResponse.Options.Version)
			if pending[cacheFilepath] == nil {
				pending[cacheFilepath] = make(map[string]pendingCacheEntry)
			}
			pending[cacheFilepath][entryName] = pendingCacheEntry{
				entry:    map[string]string{"request": requestHash, "response": responseHash},
				response: exampleResponse,
			}
		case <-ticker.C:
			flushCacheFiles(pending)
		case done := <-cacheFlushChannel:
			flushCacheFiles(pending)
			close(done)
		}
	}
}

// Re-reads each file before adding the entries, so that changes made to it in
// the meantime (e.g. git checkout during a watch session) are kept
func flushCacheFiles(pending map[string]map[string]pendingCacheEntry) {
	for cacheFilepath, entries := range pending {
		err := writeCacheFile(cacheFilepath, entries)
		if err != nil {
			for _, entry := range entries {
				options := entry.response.Options
				models.Logger.Printf("[%s %s] [ERROR] Error saving cache: %s", options.Version, options.Name, err.Error())
				models.Logger.Error("Examples", options.Version, options.Name, options.Position, "Saving the output to the cache failed: "+err.Error())
			}
		} else {
			models.Logger.Debug("[%s] Cache saved, %d entries", cacheFilepath, len(entries))
		}
		delete(pending, cacheFilepath)
	}
}

func writeCacheFile(cacheFilepath string, entries map[string]pendingCacheEntry) error {
	cache, err := utils.ReadFileAsMap(cacheFilepath)
	if err != nil {
		return err
	}
	for entryName, entry := range entries {
		cache[entryName] = entry.entry
	}
	cacheJson, err := json.MarshalIndent(cache, "", "\t")
	if err != nil {
		return err
	}
	return os.WriteFile(cacheFilepath, cacheJson, 0644)
}
