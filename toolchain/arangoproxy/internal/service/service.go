package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"reflect"
	"strings"
	"sync"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/format"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"gopkg.in/yaml.v3"
)

type CommonService struct{}

var commonService = CommonService{}

func (service CommonService) arangosh(name, code, filepath string, repository models.Repository, exampleChannel chan map[string]interface{}) {
	exampleData := map[string]interface{}{
		"name":       name,
		"code":       code,
		"filepath":   filepath,
		"repository": repository,
	}
	exampleChannel <- exampleData
}

func (service CommonService) saveCache(request string, response models.ExampleResponse, cacheChannel chan map[string]interface{}) {
	if response.Options.SaveCache == "false" || strings.Contains(response.Output, "ERRORD") {
		return
	}

	cacheRequest := make(map[string]interface{})
	cacheRequest["request"] = request
	cacheRequest["response"] = response
	cacheChannel <- cacheRequest
}

type JSService struct{}

func (service JSService) Execute(request models.Example, cacheChannel chan map[string]interface{}, exampleChannel chan map[string]interface{}, outputChannel chan string) (res models.ExampleResponse) {
	repository, err := models.GetRepository(request.Options.Type, request.Options.Version)
	models.Logger.Debug("[%s] Chosen repository: %s", request.Options.Name, repository.Version)
	if err != nil {
		responseMsg := fmt.Sprintf("A server for version %s has not been used during generation", request.Options.Version)
		res = *models.NewExampleResponse(request.Code, responseMsg, request.Options)
		return
	}

	commonService.arangosh(request.Options.Name, request.Code, request.Options.Position, repository, exampleChannel)

	arangoshResult := <-outputChannel
	res = *models.NewExampleResponse(request.Code, arangoshResult, request.Options)

	commonService.saveCache(request.Base64Request, res, cacheChannel)

	return
}

type CurlService struct{}

var curlFormatter = format.CurlFormatter{}

func (service CurlService) Execute(request models.Example, cacheChannel chan map[string]interface{}, exampleChannel chan map[string]interface{}, outputChannel chan string) (res models.ExampleResponse, err error) {
	commands := curlFormatter.FormatCommand(request.Code)

	repository, err := models.GetRepository(request.Options.Type, request.Options.Version)
	models.Logger.Debug("[%s] Chosen repository: %s", request.Options.Name, repository.Version)
	if err != nil {
		responseMsg := fmt.Sprintf("A server for version %s has not been used during generation", request.Options.Version)
		res = *models.NewExampleResponse(request.Code, responseMsg, request.Options)
		return
	}

	commonService.arangosh(request.Options.Name, commands, request.Options.Position, repository, exampleChannel)

	arangoshResult := <-outputChannel

	curlRequest, curlOutput, err := curlFormatter.FormatCurlOutput(arangoshResult, string(request.Options.Render))
	if err != nil {
		return
	}

	res = *models.NewExampleResponse(curlRequest, curlOutput, request.Options)

	commonService.saveCache(request.Base64Request, res, cacheChannel)

	return
}

type AQLService struct{}

var AQLFormatter = format.AQLFormatter{}

func (service AQLService) Execute(request models.Example, cacheChannel chan map[string]interface{}, exampleChannel chan map[string]interface{}, outputChannel chan string) (res models.AQLResponse) {
	commands := AQLFormatter.FormatRequestCode(request.Code, request.Options.BindVars)

	repository, err := models.GetRepository(request.Options.Type, request.Options.Version)
	models.Logger.Debug("[%s] Chosen repository: %s", request.Options.Name, repository.Version)
	if err != nil {
		responseMsg := fmt.Sprintf("A server for version %s has not been used during generation", request.Options.Version)
		res.ExampleResponse.Input, res.ExampleResponse.Options, res.ExampleResponse.Output = request.Code, request.Options, responseMsg
		return
	}

	if request.Options.Dataset != "" {
		createDSCmd := models.Datasets[request.Options.Dataset].Create
		removeDSCmd := models.Datasets[request.Options.Dataset].Remove
		commands = removeDSCmd + "\n" + createDSCmd + "\n" + commands + "\n" + removeDSCmd
	}

	commonService.arangosh(request.Options.Name, commands, request.Options.Position, repository, exampleChannel)

	arangoshResult := <-outputChannel

	res.ExampleResponse.Input, res.ExampleResponse.Options = request.Code, request.Options

	if strings.Contains(string(request.Options.Render), "output") {
		res.ExampleResponse.Output = fmt.Sprintf("%s\n%s", res.Output, arangoshResult)
	}

	models.FormatResponse(&res.ExampleResponse)
	res.BindVars = request.Options.BindVars

	commonService.saveCache(request.Base64Request, res.ExampleResponse, cacheChannel)

	return
}

type OpenapiService struct{}

var OpenapiFormatter = format.OpenapiFormatter{}
var OpenapiGlobalMap map[string]interface{}
var Versions map[string][]models.Version

func init() {
	OpenapiGlobalMap = make(map[string]interface{})
	Versions = models.LoadVersions()

	for key, versionList := range Versions {
		if key != "/arangodb/" {
			continue
		}
		for _, version := range versionList {
			tags := []map[string]string{}
			yamlFile, err := os.ReadFile("/home/site/data/openapi_tags.yaml")
			if err != nil {
				models.Logger.Printf("[ERROR] Opening openapi_tags file: %s", err.Error())
				os.Exit(1)
			}

			yaml.Unmarshal(yamlFile, &tags)

			// License of the exposed API (but we assume it is the same as the source code)
			license := map[string]interface{}{
				"name": "Business Source License 1.1",
				"url":  "https://github.com/arangodb/arangodb/blob/devel/LICENSE",
			}
			if version.Name == "3.10" || version.Name == "3.11" {
				license["name"] = "Apache 2.0"
				license["url"] = fmt.Sprintf("https://github.com/arangodb/arangodb/blob/%s/LICENSE", version.Name)
			}

			OpenapiGlobalMap[version.Name] = map[string]interface{}{
				"openapi": "3.1.0",
				"info": map[string]interface{}{
					"title":   "ArangoDB Core API",
					"summary": "The RESTful HTTP API of the ArangoDB Core Database System",
					"version": version.Version,
					"license": license,
					"contact": map[string]interface{}{
						"name": "ArangoDB Inc.",
						"url":  "https://arangodb.com",
					},
				},
				"paths": make(map[string]interface{}),
				"tags":  tags,
				"externalDocs": map[string]interface{}{
					"description": "Arango Documentation",
					"url":         "https://docs.arango.ai",
				},
			}
		}
	}
}

func (service OpenapiService) ProcessOpenapiSpec(spec map[string]interface{}, headers http.Header, globalOpenapiChannel chan map[string]interface{}) {
	summary := strings.TrimLeft(headers.Get("Endpoint-Title"), "# ")
	version := headers.Get("Page-Version")

	spec["version"] = version

	specDebug, _ := json.Marshal(spec)
	models.Logger.Debug("[ProcessOpenapiSpec] Processing Spec %s", specDebug)

	path := reflect.ValueOf(spec["paths"].(map[string]interface{})).MapKeys()[0].String()
	method := reflect.ValueOf(spec["paths"].(map[string]interface{})[path].(map[string]interface{})).MapKeys()[0].String()
	spec["paths"].(map[string]interface{})[path].(map[string]interface{})[method].(map[string]interface{})["summary"] = summary

	globalOpenapiChannel <- spec
}

func (service OpenapiService) AddSpecToGlobalSpec(chnl chan map[string]interface{}) error {
	for {
		select {
		case openapiSpec := <-chnl:
			version := openapiSpec["version"]
			path := reflect.ValueOf(openapiSpec["paths"].(map[string]interface{})).MapKeys()[0].String()
			method := reflect.ValueOf(openapiSpec["paths"].(map[string]interface{})[path].(map[string]interface{})).MapKeys()[0].String()

			if _, ok := OpenapiGlobalMap[version.(string)].(map[string]interface{})["paths"].(map[string]interface{})[path]; ok {
				OpenapiGlobalMap[version.(string)].(map[string]interface{})["paths"].(map[string]interface{})[path].(map[string]interface{})[method] = openapiSpec["paths"].(map[string]interface{})[path].(map[string]interface{})[method]
			} else {
				OpenapiGlobalMap[version.(string)].(map[string]interface{})["paths"].(map[string]interface{})[path] = openapiSpec["paths"].(map[string]interface{})[path]
			}

		}
	}
}

func (service OpenapiService) ValidateOpenapiGlobalSpec() {
	//time.Sleep(time.Second * 4)
	var wg sync.WaitGroup
	models.Logger.Summary("<h2>OPENAPI</h2>")

	for key, versionList := range Versions {
		if key != "/arangodb/" {
			continue
		}
		for _, version := range versionList {
			wg.Add(1)
			go service.ValidateFile(version.Name, &wg)
		}

		wg.Wait()
	}
}

func (service OpenapiService) ValidateFile(version string, wg *sync.WaitGroup) error {
	defer wg.Done()

	file, _ := json.MarshalIndent(OpenapiGlobalMap[version], "", " ")
	os.WriteFile("/home/site/data/"+version+"/api-docs.json", file, 0644)

	cmd := exec.Command("swagger-cli", "validate", "/home/site/data/"+version+"/api-docs.json")

	var out, er bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &er

	err := cmd.Run()
	models.Logger.Printf("%s\n%s", out.String(), er.String())

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			models.Logger.Summary("<error code=2>%s - <strong>Error %d</strong>:", version, exitError.ExitCode())
			models.Logger.Summary("%s</error>", er.String())
		}
	} else {
		models.Logger.Summary("%s &#x2713;", version)
	}
	return nil
}
