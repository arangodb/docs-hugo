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
var OpenapiGlobalMapMutex sync.RWMutex
var OpenapiPendingSpecs sync.WaitGroup
var OpenapiSpecCounter map[string]int
var OpenapiSpecCounterMutex sync.Mutex
var OpenapiRejectedSpecs int
var OpenapiRejectedSpecsMutex sync.Mutex
var OpenapiSpecError error
var OpenapiSpecErrorMutex sync.Mutex
var OpenapiValidationError error
var OpenapiValidationErrorMutex sync.Mutex
var Versions map[string][]models.Version

func init() {
	OpenapiGlobalMap = make(map[string]interface{})
	OpenapiSpecCounter = make(map[string]int)
	Versions = models.LoadVersions()

	models.Logger.Debug("[OpenapiService.init] Initializing OpenAPI maps for versions...")

	for key, versionList := range Versions {
		if key != "/arangodb/" {
			continue
		}
		for _, version := range versionList {
			models.Logger.Debug("[OpenapiService.init] Creating OpenAPI map for version: %s", version.Name)
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
						"url":  "https://arango.ai",
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

	path := reflect.ValueOf(spec["paths"].(map[string]interface{})).MapKeys()[0].String()
	method := reflect.ValueOf(spec["paths"].(map[string]interface{})[path].(map[string]interface{})).MapKeys()[0].String()

	OpenapiSpecCounterMutex.Lock()
	if _, exists := OpenapiSpecCounter[version]; !exists {
		OpenapiSpecCounter[version] = 0
	}
	OpenapiSpecCounter[version]++
	specNum := OpenapiSpecCounter[version]
	OpenapiSpecCounterMutex.Unlock()

	models.Logger.Debug("[ProcessOpenapiSpec #%d] Received spec for version '%s': %s %s", specNum, version, method, path)

	spec["paths"].(map[string]interface{})[path].(map[string]interface{})[method].(map[string]interface{})["summary"] = summary

	OpenapiPendingSpecs.Add(1)
	globalOpenapiChannel <- spec
}

func (service OpenapiService) AddSpecToGlobalSpec(chnl chan map[string]interface{}) error {
	operationIdMap := make(map[string]bool)
	errorEncountered := false
	for openapiSpec := range chnl {
		versionStr := openapiSpec["version"].(string)
		specPaths := openapiSpec["paths"].(map[string]interface{})
		path := reflect.ValueOf(specPaths).MapKeys()[0].String()
		method := reflect.ValueOf(specPaths[path].(map[string]interface{})).MapKeys()[0].String()

		models.Logger.Debug("[AddSpecToGlobalSpec] Processing path %s %s for version '%s'", method, path, versionStr)

		OpenapiGlobalMapMutex.Lock()

		// Check if version exists in global map
		versionMap, versionExists := OpenapiGlobalMap[versionStr]
		if !versionExists {
			errorEncountered = true
			models.Logger.Printf("[ERROR] Version %s not found in OpenapiGlobalMap. Available versions: %v",
				versionStr, reflect.ValueOf(OpenapiGlobalMap).MapKeys())
			OpenapiRejectedSpecsMutex.Lock()
			OpenapiRejectedSpecs++
			OpenapiRejectedSpecsMutex.Unlock()
			OpenapiSpecErrorMutex.Lock()
			if OpenapiSpecError == nil {
				OpenapiSpecError = fmt.Errorf("version %s not found in OpenapiGlobalMap", versionStr)
			}
			OpenapiSpecErrorMutex.Unlock()
			OpenapiGlobalMapMutex.Unlock()
			OpenapiPendingSpecs.Done()
			continue
		}

		// Get paths map for this version
		versionMapTyped := versionMap.(map[string]interface{})
		pathsMap := versionMapTyped["paths"].(map[string]interface{})
		newMethodEntry := specPaths[path].(map[string]interface{})[method]

		// Check for duplicate operationId values across all endpoints
		// (excluding identical endpoint descriptions that due to Hugo caching)
		operationId := newMethodEntry.(map[string]interface{})["operationId"].(string)
		opAndVersion := fmt.Sprintf("%s (%s)", operationId, versionStr)
		if _, operationIdExists := operationIdMap[opAndVersion]; operationIdExists {
			errorEncountered = true
			models.Logger.Printf("[ERROR] Duplicate operationId %s", opAndVersion)
			OpenapiSpecErrorMutex.Lock()
			if OpenapiSpecError == nil {
				OpenapiSpecError = fmt.Errorf("duplicate operationId: %s", opAndVersion)
			}
			OpenapiSpecErrorMutex.Unlock()
		} else {
			operationIdMap[opAndVersion] = true
		}

		// Check if path already exists
		if existingPath, pathExists := pathsMap[path]; pathExists {
			// Path exists, add/update method
			existingPathMap := existingPath.(map[string]interface{})

			if methodEntry, methodExists := existingPathMap[method]; !methodExists {
				existingPathMap[method] = newMethodEntry
			} else {
				errorEncountered = true
				errorMsg := fmt.Sprintf("Method %s already exists for path '%s' in version %s (and the endpoint description is not identical)", strings.ToUpper(method), path, versionStr)
				models.Logger.Printf("[ERROR] %s", errorMsg)
				// Hugo caches resources.GetRemote, which means for identical endpoint descriptions,
				// arangoproxy is only called once (per version) and we can't count the duplicates here.

				methodJson, _ := json.MarshalIndent(methodEntry, "", "  ")
				newMethodJson, _ := json.MarshalIndent(newMethodEntry, "", "  ")

				models.Logger.Printf("--- Existing endpoint %s\n%s\n--- Conflicting endpoint %s\n%s\n%s",
					strings.Repeat("-", 58), string(methodJson),
					strings.Repeat("-", 55), string(newMethodJson),
					strings.Repeat("-", 80))

				OpenapiSpecErrorMutex.Lock()
				if OpenapiSpecError == nil {
					OpenapiSpecError = fmt.Errorf("%s", errorMsg)
				}
				OpenapiSpecErrorMutex.Unlock()
			}
		} else {
			// Path doesn't exist, add entire path
			pathsMap[path] = specPaths[path]
		}

		OpenapiGlobalMapMutex.Unlock()

		OpenapiPendingSpecs.Done()
	}
	if errorEncountered {
		models.Logger.Summary("<error code=2>%s</error>", "Conflict(s) in OpenAPI specifications")
		return fmt.Errorf("OpenAPI specification conflicts detected")
	}
	return nil
}

func (service OpenapiService) ValidateOpenapiGlobalSpec() error {
	// Reset error state from previous validation runs
	OpenapiSpecErrorMutex.Lock()
	OpenapiSpecError = nil
	OpenapiSpecErrorMutex.Unlock()

	OpenapiValidationErrorMutex.Lock()
	OpenapiValidationError = nil
	OpenapiValidationErrorMutex.Unlock()

	OpenapiSpecCounterMutex.Lock()
	totalSpecs := 0
	for _, count := range OpenapiSpecCounter {
		totalSpecs += count
	}
	OpenapiSpecCounterMutex.Unlock()

	models.Logger.Debug("[ValidateOpenapiGlobalSpec] Waiting for %d pending specs to be processed...", totalSpecs)
	OpenapiPendingSpecs.Wait()
	models.Logger.Debug("[ValidateOpenapiGlobalSpec] All specs processed. Starting validation...")

	var wg sync.WaitGroup
	models.Logger.Summary("<h2>OPENAPI</h2>")

	OpenapiGlobalMapMutex.RLock()
	totalEndpoints := 0
	for versionKey := range OpenapiGlobalMap {
		versionEndpoints := 0
		pathsMap := OpenapiGlobalMap[versionKey].(map[string]interface{})["paths"].(map[string]interface{})
		for _, pathValue := range pathsMap {
			pathMethods := pathValue.(map[string]interface{})
			versionEndpoints += len(pathMethods)
		}
		OpenapiSpecCounterMutex.Lock()
		receivedForVersion := OpenapiSpecCounter[versionKey]
		OpenapiSpecCounterMutex.Unlock()
		models.Logger.Debug("[ValidateOpenapiGlobalSpec] Version %s: received %d specs, added %d endpoints", versionKey, receivedForVersion, versionEndpoints)
		totalEndpoints += versionEndpoints
	}
	models.Logger.Debug("[ValidateOpenapiGlobalSpec] Total endpoints across all versions: %d (expected: %d, rejected: %d)", totalEndpoints, totalSpecs, OpenapiRejectedSpecs)
	OpenapiGlobalMapMutex.RUnlock()

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

	// Check for errors from spec processing
	OpenapiSpecErrorMutex.Lock()
	specError := OpenapiSpecError
	OpenapiSpecErrorMutex.Unlock()

	// Check for errors from swagger-cli validation
	OpenapiValidationErrorMutex.Lock()
	validationError := OpenapiValidationError
	OpenapiValidationErrorMutex.Unlock()

	// Return first error encountered
	if specError != nil {
		return specError
	}
	return validationError
}

func (service OpenapiService) ValidateFile(version string, wg *sync.WaitGroup) error {
	defer wg.Done()

	OpenapiGlobalMapMutex.RLock()
	file, _ := json.MarshalIndent(OpenapiGlobalMap[version], "", " ")
	OpenapiGlobalMapMutex.RUnlock()

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
			OpenapiValidationErrorMutex.Lock()
			if OpenapiValidationError == nil {
				OpenapiValidationError = fmt.Errorf("swagger-cli validation failed for version %s", version)
			}
			OpenapiValidationErrorMutex.Unlock()
		}
	} else {
		models.Logger.Summary("%s &#x2713;", version)
	}
	return err
}
