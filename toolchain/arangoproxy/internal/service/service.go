package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/format"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"gopkg.in/yaml.v3"
)

type CommonService struct{}

var commonService = CommonService{}

func (service CommonService) arangosh(name, code string, repository models.Repository, exampleChannel chan map[string]interface{}) {
	exampleData := map[string]interface{}{
		"name":       name,
		"code":       code,
		"repository": repository,
	}
	exampleChannel <- exampleData
}

func (service CommonService) saveCache(request string, response models.ExampleResponse, cacheChannel chan map[string]interface{}) {
	if response.Options.SaveCache == "false" {
		return
	}

	cacheRequest := make(map[string]interface{})
	cacheRequest["request"] = request
	cacheRequest["response"] = response
	cacheChannel <- cacheRequest
}

type JSService struct{}

var JSFormatter = format.JSFormatter{}

func (service JSService) Execute(request models.Example, cacheChannel chan map[string]interface{}, exampleChannel chan map[string]interface{}, outputChannel chan string) (res models.ExampleResponse) {
	commands := JSFormatter.FormatRequestCode(request.Code)

	repository, err := models.GetRepository(request.Options.Type, request.Options.Version)
	if err != nil {
		responseMsg := fmt.Sprintf("A server for version %s has not been used during generation", request.Options.Version)
		res = *models.NewExampleResponse(request.Code, responseMsg, request.Options)
		return
	}

	commonService.arangosh(request.Options.Name, commands, repository, exampleChannel)

	cmdOutput := <-outputChannel
	res = *models.NewExampleResponse(request.Code, cmdOutput, request.Options)

	commonService.saveCache(request.Base64Request, res, cacheChannel)

	return
}

type CurlService struct{}

var curlFormatter = format.CurlFormatter{}

func (service CurlService) Execute(request models.Example, cacheChannel chan map[string]interface{}, exampleChannel chan map[string]interface{}, outputChannel chan string) (res models.ExampleResponse, err error) {
	commands := curlFormatter.FormatCommand(request.Code)
	repository, err := models.GetRepository(request.Options.Type, request.Options.Version)
	if err != nil {
		responseMsg := fmt.Sprintf("A server for version %s has not been used during generation", request.Options.Version)
		res = *models.NewExampleResponse(request.Code, responseMsg, request.Options)
		return
	}

	commonService.arangosh(request.Options.Name, commands, repository, exampleChannel)

	cmdOutput := <-outputChannel

	curlRequest, curlOutput, err := curlFormatter.FormatCurlOutput(cmdOutput, string(request.Options.Render))
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

	commonService.arangosh(request.Options.Name, commands, repository, exampleChannel)

	cmdOutput := <-outputChannel

	res.ExampleResponse.Input, res.ExampleResponse.Options = request.Code, request.Options

	if strings.Contains(string(request.Options.Render), "output") {
		res.ExampleResponse.Output = fmt.Sprintf("%s\n%s", res.Output, cmdOutput)
	}

	models.FormatResponse(&res.ExampleResponse)
	res.BindVars = request.Options.BindVars

	commonService.saveCache(request.Base64Request, res.ExampleResponse, cacheChannel)

	return
}

type OpenapiService struct{}

var OpenapiFormatter = format.OpenapiFormatter{}
var OpenapiGlobalMap map[string]interface{}
var Versions []models.Version

func init() {
	OpenapiGlobalMap = make(map[string]interface{})
	Versions = models.LoadVersions()

	for _, version := range Versions {
		tags := []map[string]string{}
		yamlFile, err := ioutil.ReadFile("/home/site/data/openapi_tags.yaml")
		if err != nil {
			models.Logger.Printf("[ERROR] Opening openapi_tags file: %s", err.Error())
			os.Exit(1)
		}

		yaml.Unmarshal(yamlFile, &tags)
		OpenapiGlobalMap[version.Name] = map[string]interface{}{
			"openapi": "3.1.0",
			"info": map[string]interface{}{
				"description": "ArangoDB REST API Interface",
				"version":     version.Version,
				"title":       "ArangoDB",
			},
			"paths": make(map[string]interface{}),
			"tags":  tags,
		}
	}
}

func (service OpenapiService) ProcessOpenapiSpec(spec map[string]interface{}, headers http.Header, globalOpenapiChannel chan map[string]interface{}) {
	summary := strings.TrimLeft(headers.Get("Endpoint-Title"), "# ")
	version := headers.Get("Page-Version")

	spec["version"] = version

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
	time.Sleep(time.Second * 4)
	var wg sync.WaitGroup
	models.Logger.Summary("<h2>OPENAPI</h2>")

	for _, version := range Versions {
		wg.Add(1)
		go service.ValidateFile(version.Name, &wg)
	}

	wg.Wait()
}

func (service OpenapiService) ValidateFile(version string, wg *sync.WaitGroup) error {
	defer wg.Done()

	file, _ := json.MarshalIndent(OpenapiGlobalMap[version], "", " ")
	ioutil.WriteFile("/home/site/data/"+version+"/api-docs.json", file, 0644)

	cmd := exec.Command("swagger-cli", "validate", "/home/site/data/"+version+"/api-docs.json")

	var out, er bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &er

	err := cmd.Run()
	models.Logger.Printf("%s\n\n\n%s", out.String(), er.String())

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			models.Logger.Summary("%s - <strong>Error %d</strong>:", version, exitError.ExitCode())
			models.Logger.Summary("%s", er.String())

			time.Sleep(time.Second * 2)
			os.Exit(exitError.ExitCode())
		}
	}

	models.Logger.Summary("%s &#x2713;", version)
	return nil
}
