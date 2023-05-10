package common

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func (service Service) SaveCachedExampleResponse(chnl chan map[string]interface{}) error {
	for {
		select {
		case cacheRequest := <-chnl:
			exampleResponse := cacheRequest["response"].(ExampleResponse)

			hashName := fmt.Sprintf("%s_%s_%s", exampleResponse.Options.Name, exampleResponse.Options.ServerName, exampleResponse.Options.Type)
			requestHash := cacheRequest["request"].(string)
			responseHash, err := utils.EncodeToBase64(exampleResponse)
			//if hashName == "" {
			//	return errors.New("empty entry")
			//}

			newCacheEntry := make(map[string]map[string]string)
			newCacheEntry[hashName] = make(map[string]string)
			newCacheEntry[hashName]["request"] = requestHash
			newCacheEntry[hashName]["response"] = responseHash

			cacheFilepath := fmt.Sprintf("%s/%s/cache.json", config.Conf.Cache, exampleResponse.Options.Version)
			cache, err := utils.ReadFileAsMap(cacheFilepath)
			if err != nil {
				Logger.Printf("Error %s\n", err.Error())
				//	return err
			}

			cache[hashName] = newCacheEntry[hashName]
			cacheJson, _ := json.MarshalIndent(cache, "", "\t")
			err = os.WriteFile(cacheFilepath, cacheJson, 0644)

		}
	}

	return nil
}

/*
func (service Service) SaveCachedExampleResponse(exampleRequest Example, exampleResponse ExampleResponse) error {
	hashName := fmt.Sprintf("%s_%s_%s", exampleResponse.Options.Name, exampleResponse.Options.Release, exampleResponse.Options.Version)
	requestHash := exampleRequest.Base64Request
	responseHash, err := utils.EncodeToBase64(exampleResponse)
	if hashName == "" {
		return errors.New("empty entry")
	}

	mu.Lock()
	defer mu.Unlock()
	newCacheEntry := make(map[string]map[string]string)
	newCacheEntry[hashName] = make(map[string]string)
	newCacheEntry[hashName]["request"] = requestHash
	newCacheEntry[hashName]["response"] = responseHash

	cache, err := utils.ReadFileAsMap(config.Conf.Cache)
	if err != nil {
		Logger.Printf("Error %s\n", err.Error())
		return err
	}

	cache[hashName] = newCacheEntry[hashName]
	cacheJson, _ := json.MarshalIndent(cache, "", "\t")
	err = os.WriteFile(config.Conf.Cache, cacheJson, 0644)

	return err
}
*/
