package internal

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func SaveCachedExampleResponse(chnl chan map[string]interface{}) error {
	for {
		select {
		case cacheRequest := <-chnl:
			requestHash := cacheRequest["request"].(string)
			exampleResponse := cacheRequest["response"].(models.ExampleResponse)

			entryName := fmt.Sprintf("%s_%s_%s", exampleResponse.Options.Name, exampleResponse.Options.ServerName, exampleResponse.Options.Type)
			responseHash, err := utils.EncodeToBase64(exampleResponse)

			newCacheEntry := make(map[string]map[string]string)
			newCacheEntry[entryName] = make(map[string]string)
			newCacheEntry[entryName]["request"] = requestHash
			newCacheEntry[entryName]["response"] = responseHash

			cacheFilepath := fmt.Sprintf("%s/%s/cache.json", models.Conf.Cache, exampleResponse.Options.Version)
			cache, err := utils.ReadFileAsMap(cacheFilepath)
			if err != nil {
				models.Logger.Printf("Error %s\n", err.Error())
				os.Exit(1)
			}

			cache[entryName] = newCacheEntry[entryName]
			cacheJson, _ := json.MarshalIndent(cache, "", "\t")
			err = os.WriteFile(cacheFilepath, cacheJson, 0644)

		}
	}
}
