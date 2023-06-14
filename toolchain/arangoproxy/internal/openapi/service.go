package openapi

import (
	"io"
	"io/ioutil"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"gopkg.in/yaml.v3"
)

type OpenapiService struct {
	common.Service
}

var OpenapiGlobalMap map[string]interface{}

func init() {
	OpenapiGlobalMap = make(map[string]interface{})
}

func (service OpenapiService) ParseOpenapiPayload(request io.Reader) (map[string]interface{}, error) {
	req, err := ioutil.ReadAll(request)
	if err != nil {
		common.Logger.Printf("Error reading Example body: %s\n", err.Error())
		return nil, err
	}

	optionsYaml := make(map[string]interface{})
	err = yaml.Unmarshal(req, &optionsYaml)
	if err != nil {
		common.Logger.Printf("Error PARSING Example body: %s\n", err.Error())
		return nil, err
	}

	return optionsYaml, nil
}

func (service OpenapiService) ProcessOpenapiSpec(spec map[string]interface{}, globalOpenapiChannel chan map[string]interface{}) error {
	common.Logger.Printf("Process")
	globalOpenapiChannel <- spec
	return nil
}

func (service OpenapiService) AddSpecToGlobalSpec(chnl chan map[string]interface{}) error {
	for {
		select {
		case openapiSpec := <-chnl:
			common.Logger.Printf("in channel")
			pathMap := openapiSpec["paths"].(map[string]interface{})
			for k, v := range pathMap {
				common.Logger.Printf("k %s", k)
				OpenapiGlobalMap[k] = v
				common.Logger.Printf("added %s", k)
				break
			}

			common.Logger.Printf("Global %s", OpenapiGlobalMap)

		}
	}
}
