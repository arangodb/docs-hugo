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

// ArangoDB API version indices and path prefixes for versioned API (0-openapi.json, 1-openapi.json, 2-openapi.json).
const (
	ArangoDBAPIVersionV0           = "v0"
	ArangoDBAPIVersionV1           = "v1"
	ArangoDBAPIVersionExperimental = "experimental"
)

var arangoDBAPIVersionToIndex = map[string]int{
	ArangoDBAPIVersionV0:           0,
	ArangoDBAPIVersionV1:           1,
	ArangoDBAPIVersionExperimental: 2,
}

var arangoDBAPIVersionPrefix = map[int]string{
	0: "",                          // v0: no prefix
	1: "/_arango/v1",               // v1
	2: "/_arango/experimental",     // experimental
}

// arangoDBVersionToAllowedIndices is populated from site/data/versions.yaml (allowedAPIVersions per version).
var arangoDBVersionToAllowedIndices map[string][]int

// arangoDBAllowedAPIVersionIndices returns which API version indices (0=v0, 1=v1, 2=experimental) are valid for a page version.
// Uses arangoDBVersionToAllowedIndices from versions.yaml when set; otherwise falls back to default (all indices).
func arangoDBAllowedAPIVersionIndices(pageVersion string) []int {
	if indices, ok := arangoDBVersionToAllowedIndices[pageVersion]; ok && len(indices) > 0 {
		return indices
	}
	return []int{0, 1, 2}
}

type OpenapiService struct{}

var OpenapiFormatter = format.OpenapiFormatter{}
var OpenapiGlobalMap map[string]interface{}      // key: "version_apiIndex" e.g. "3.12_0"
var OpenapiServiceMap map[string]interface{}     // key: service name (e.g. "cypher2aql")
var OpenapiGlobalMapMutex sync.RWMutex
var OpenapiServiceMapMutex sync.RWMutex
var OpenapiPendingSpecs sync.WaitGroup
var OpenapiSpecCounter map[string]int // key: "version_apiIndex" or "service_name"
var OpenapiSpecCounterMutex sync.Mutex
var OpenapiRejectedSpecs int
var OpenapiRejectedSpecsMutex sync.Mutex
var OpenapiSpecError error
var OpenapiSpecErrorMutex sync.Mutex
var OpenapiValidationError error
var OpenapiValidationErrorMutex sync.Mutex
var Versions map[string][]models.Version
var openapiServicesConfig map[string]interface{} // service name -> baseInfo from openapi_services.yaml
var arangoDBTagsByAPIIndex [3][]map[string]string            // tags for arangodb_0, arangodb_1, arangodb_2

func loadTagsFile(path string) ([]map[string]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var tags []map[string]string
	if err := yaml.Unmarshal(data, &tags); err != nil {
		return nil, err
	}
	return tags, nil
}

func init() {
	OpenapiGlobalMap = make(map[string]interface{})
	OpenapiServiceMap = make(map[string]interface{})
	OpenapiSpecCounter = make(map[string]int)
	Versions = models.LoadVersions()

	// Build allowed API version indices per ArangoDB version from versions.yaml (allowedAPIVersions).
	arangoDBVersionToAllowedIndices = make(map[string][]int)
	if arangodbList, ok := Versions["/arangodb/"]; ok {
		for _, v := range arangodbList {
			if len(v.AllowedAPIVersions) == 0 {
				continue
			}
			indices := make([]int, 0, len(v.AllowedAPIVersions))
			for _, name := range v.AllowedAPIVersions {
				if idx, ok := arangoDBAPIVersionToIndex[name]; ok {
					indices = append(indices, idx)
				}
			}
			if len(indices) > 0 {
				arangoDBVersionToAllowedIndices[v.Name] = indices
			}
		}
	}

	// Load service base info from openapi_services.yaml
	servicesConfigPath := "/home/site/data/openapi_services.yaml"
	servicesConfigData, err := os.ReadFile(servicesConfigPath)
	if err != nil {
		models.Logger.Printf("[ERROR] Opening openapi_services.yaml: %s", err.Error())
		os.Exit(1)
	}
	if err := yaml.Unmarshal(servicesConfigData, &openapiServicesConfig); err != nil {
		models.Logger.Printf("[ERROR] Parsing openapi_services.yaml: %s", err.Error())
		os.Exit(1)
	}

	// Load ArangoDB OpenAPI tags per API version from site/data/openapi_tags/
	for apiIdx := 0; apiIdx <= 2; apiIdx++ {
		tagsPath := fmt.Sprintf("/home/site/data/openapi_tags/arangodb_%d.yaml", apiIdx)
		tags, err := loadTagsFile(tagsPath)
		if err != nil {
			models.Logger.Printf("[ERROR] Opening %s: %s", tagsPath, err.Error())
			os.Exit(1)
		}
		arangoDBTagsByAPIIndex[apiIdx] = tags
	}

	arangodbBase, _ := openapiServicesConfig["arangodb"].(map[string]interface{})
	if arangodbBase == nil {
		arangodbBase = make(map[string]interface{})
	}

	models.Logger.Debug("[OpenapiService.init] Initializing OpenAPI maps for ArangoDB versions and API versions...")

	apiVersionSuffix := map[int]string{
		0: " (API v0)",
		1: " (API v1)",
		2: " (API experimental)",
	}

	for key, versionList := range Versions {
		if key != "/arangodb/" {
			continue
		}
		for _, version := range versionList {
			license := map[string]interface{}{
				"name": "Business Source License 1.1",
				"url":  "https://github.com/arangodb/arangodb/blob/devel/LICENSE",
			}
			if version.Name == "3.10" || version.Name == "3.11" {
				license["name"] = "Apache 2.0"
				license["url"] = fmt.Sprintf("https://github.com/arangodb/arangodb/blob/%s/LICENSE", version.Name)
			}
			for _, apiIdx := range arangoDBAllowedAPIVersionIndices(version.Name) {
				mapKey := fmt.Sprintf("%s_%d", version.Name, apiIdx)
				models.Logger.Debug("[OpenapiService.init] Creating OpenAPI map for version: %s API index: %d", version.Name, apiIdx)
				infoVersion := version.Version + apiVersionSuffix[apiIdx]
				info := map[string]interface{}{
					"title":   arangodbBase["title"],
					"summary": arangodbBase["summary"],
					"version": infoVersion,
					"license": license,
					"contact": arangodbBase["contact"],
				}
				if info["title"] == nil {
					info["title"] = "ArangoDB Core API"
				}
				if info["summary"] == nil {
					info["summary"] = "The RESTful HTTP API of the ArangoDB Core Database System"
				}
				if info["contact"] == nil {
					info["contact"] = map[string]interface{}{"name": "ArangoDB Inc.", "url": "https://arango.ai"}
				}
				specCopy := map[string]interface{}{
					"openapi":      "3.1.0",
					"info":         info,
					"paths":        make(map[string]interface{}),
					"tags":         arangoDBTagsByAPIIndex[apiIdx],
					"externalDocs": arangodbBase["externalDocs"],
				}
				if specCopy["externalDocs"] == nil {
					specCopy["externalDocs"] = map[string]interface{}{
						"description": "Arango Documentation",
						"url":         "https://docs.arango.ai",
					}
				}
				OpenapiGlobalMap[mapKey] = specCopy
			}
		}
	}
}

func (service OpenapiService) ProcessOpenapiSpec(spec map[string]interface{}, headers http.Header, globalOpenapiChannel chan map[string]interface{}) {
	summary := strings.TrimLeft(headers.Get("Endpoint-Title"), "# ")
	pageVersion := headers.Get("Page-Version")
	serviceName := headers.Get("Service-Name")
	apiVersionsRaw := headers.Get("API-Versions")

	var apiVersions []string
	if serviceName == "arangodb" || serviceName == "" {
		serviceName = "arangodb"
		if err := json.Unmarshal([]byte(apiVersionsRaw), &apiVersions); err != nil || len(apiVersions) == 0 {
			models.Logger.Printf("[ERROR] ArangoDB openapi spec missing or invalid API-Versions header (JSON array): %s", apiVersionsRaw)
			OpenapiSpecErrorMutex.Lock()
			if OpenapiSpecError == nil {
				OpenapiSpecError = fmt.Errorf("ArangoDB openapi spec missing or invalid API-Versions header")
			}
			OpenapiSpecErrorMutex.Unlock()
			return
		}
		if pageVersion == "" {
			models.Logger.Printf("[ERROR] ArangoDB openapi spec missing Page-Version header")
			OpenapiSpecErrorMutex.Lock()
			if OpenapiSpecError == nil {
				OpenapiSpecError = fmt.Errorf("ArangoDB openapi spec missing Page-Version header")
			}
			OpenapiSpecErrorMutex.Unlock()
			return
		}
	}

	specPaths := spec["paths"].(map[string]interface{})
	path := reflect.ValueOf(specPaths).MapKeys()[0].String()
	method := reflect.ValueOf(specPaths[path].(map[string]interface{})).MapKeys()[0].String()
	methodEntry := specPaths[path].(map[string]interface{})[method].(map[string]interface{})
	methodEntry["summary"] = summary

	if serviceName != "arangodb" {
		// Non-ArangoDB service: single spec per service
		OpenapiPendingSpecs.Add(1)
		globalOpenapiChannel <- map[string]interface{}{
			"_target":      "service",
			"serviceName":  serviceName,
			"spec":         spec,
		}
		models.Logger.Debug("[ProcessOpenapiSpec] Received spec for service '%s': %s %s", serviceName, method, path)
		return
	}

	// ArangoDB: one spec per (pageVersion, apiVersion) with path prefix for v1/experimental.
	// Only add to API versions that exist for this page version (e.g. 3.10 has no v1).
	allowedIndices := make(map[int]bool)
	for _, idx := range arangoDBAllowedAPIVersionIndices(pageVersion) {
		allowedIndices[idx] = true
	}
	for _, av := range apiVersions {
		apiIdx, ok := arangoDBAPIVersionToIndex[av]
		if !ok {
			models.Logger.Printf("[ERROR] Unknown ArangoDB API version %q (expected v0, v1, or experimental)", av)
			continue
		}
		if !allowedIndices[apiIdx] {
			models.Logger.Debug("[ProcessOpenapiSpec] Skipping API version %s for page version %s (not supported)", av, pageVersion)
			continue
		}
		prefix := arangoDBAPIVersionPrefix[apiIdx]
		prefixedPath := path
		if prefix != "" {
			prefixedPath = prefix + path
		}
		// Copy spec and set the single path (prefixed) for this API version
		specCopy := copySpecWithSinglePath(spec, prefixedPath)
		OpenapiSpecCounterMutex.Lock()
		mapKey := fmt.Sprintf("%s_%d", pageVersion, apiIdx)
		if _, exists := OpenapiSpecCounter[mapKey]; !exists {
			OpenapiSpecCounter[mapKey] = 0
		}
		OpenapiSpecCounter[mapKey]++
		specNum := OpenapiSpecCounter[mapKey]
		OpenapiSpecCounterMutex.Unlock()
		models.Logger.Debug("[ProcessOpenapiSpec #%s %d] Received spec for version '%s' API %s: %s %s", mapKey, specNum, pageVersion, av, method, prefixedPath)
		OpenapiPendingSpecs.Add(1)
		globalOpenapiChannel <- map[string]interface{}{
			"_target":         "arangodb",
			"version":         pageVersion,
			"apiVersionIndex": apiIdx,
			"spec":            specCopy,
		}
	}
}

// methodEntriesEqual reports whether two OpenAPI operation objects (method entries) describe the same endpoint.
// Used to treat repeated proxy calls for the same block as a no-op instead of a duplicate error.
func methodEntriesEqual(a, b map[string]interface{}) bool {
	ja, errA := json.Marshal(a)
	jb, errB := json.Marshal(b)
	if errA != nil || errB != nil {
		return false
	}
	return bytes.Equal(ja, jb)
}

// copySpecWithSinglePath returns a new spec map with paths containing only the given path (same method/operation as original).
func copySpecWithSinglePath(spec map[string]interface{}, singlePath string) map[string]interface{} {
	origPaths := spec["paths"].(map[string]interface{})
	origPath := reflect.ValueOf(origPaths).MapKeys()[0].String()
	newPaths := map[string]interface{}{
		singlePath: origPaths[origPath],
	}
	return map[string]interface{}{
		"openapi":      spec["openapi"],
		"info":         spec["info"],
		"paths":        newPaths,
		"tags":         spec["tags"],
		"externalDocs": spec["externalDocs"],
	}
}

func (service OpenapiService) AddSpecToGlobalSpec(chnl chan map[string]interface{}) error {
	operationIdMap := make(map[string]bool)
	errorEncountered := false
	for payload := range chnl {
		target, _ := payload["_target"].(string)
		switch target {
		case "service":
			serviceName, _ := payload["serviceName"].(string)
			spec, _ := payload["spec"].(map[string]interface{})
			if serviceName == "" || spec == nil {
				OpenapiPendingSpecs.Done()
				continue
			}
			if err := service.addServiceSpec(serviceName, spec, &operationIdMap, &errorEncountered); err != nil {
				OpenapiSpecErrorMutex.Lock()
				if OpenapiSpecError == nil {
					OpenapiSpecError = err
				}
				OpenapiSpecErrorMutex.Unlock()
			}
			OpenapiPendingSpecs.Done()
			continue
		case "arangodb":
			// fall through to existing arangodb logic with composite key
		default:
			OpenapiPendingSpecs.Done()
			continue
		}

		versionStr, _ := payload["version"].(string)
		apiVersionIndex, _ := payload["apiVersionIndex"].(int)
		openapiSpec, _ := payload["spec"].(map[string]interface{})
		if openapiSpec == nil {
			OpenapiPendingSpecs.Done()
			continue
		}
		mapKey := fmt.Sprintf("%s_%d", versionStr, apiVersionIndex)
		specPaths := openapiSpec["paths"].(map[string]interface{})
		path := reflect.ValueOf(specPaths).MapKeys()[0].String()
		method := reflect.ValueOf(specPaths[path].(map[string]interface{})).MapKeys()[0].String()

		models.Logger.Debug("[AddSpecToGlobalSpec] Processing path %s %s for %s", method, path, mapKey)

		OpenapiGlobalMapMutex.Lock()

		versionMap, versionExists := OpenapiGlobalMap[mapKey]
		if !versionExists {
			errorEncountered = true
			models.Logger.Printf("[ERROR] Key %s not found in OpenapiGlobalMap. Available: %v",
				mapKey, reflect.ValueOf(OpenapiGlobalMap).MapKeys())
			OpenapiRejectedSpecsMutex.Lock()
			OpenapiRejectedSpecs++
			OpenapiRejectedSpecsMutex.Unlock()
			OpenapiSpecErrorMutex.Lock()
			if OpenapiSpecError == nil {
				OpenapiSpecError = fmt.Errorf("key %s not found in OpenapiGlobalMap", mapKey)
			}
			OpenapiSpecErrorMutex.Unlock()
			OpenapiGlobalMapMutex.Unlock()
			OpenapiPendingSpecs.Done()
			continue
		}

		versionMapTyped := versionMap.(map[string]interface{})
		pathsMap := versionMapTyped["paths"].(map[string]interface{})
		newMethodEntry := specPaths[path].(map[string]interface{})[method].(map[string]interface{})

		// If this path+method already exists, only error when the endpoint description differs.
		// Identical entries can occur when Hugo calls the proxy multiple times for the same block (e.g. cache key differs by context).
		if existingPath, pathExists := pathsMap[path]; pathExists {
			existingPathMap := existingPath.(map[string]interface{})
			if methodEntry, methodExists := existingPathMap[method]; methodExists {
				if methodEntriesEqual(methodEntry.(map[string]interface{}), newMethodEntry) {
					OpenapiGlobalMapMutex.Unlock()
					OpenapiPendingSpecs.Done()
					continue
				}
				errorEncountered = true
				errorMsg := fmt.Sprintf("Method %s already exists for path '%s' in %s (and the endpoint description is not identical)", strings.ToUpper(method), path, mapKey)
				models.Logger.Printf("[ERROR] %s", errorMsg)
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
				OpenapiGlobalMapMutex.Unlock()
				OpenapiPendingSpecs.Done()
				continue
			}
		}

		operationId, _ := newMethodEntry["operationId"].(string)
		opAndVersion := fmt.Sprintf("%s (%s)", operationId, mapKey)
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

		if existingPath, pathExists := pathsMap[path]; pathExists {
			existingPathMap := existingPath.(map[string]interface{})
			existingPathMap[method] = newMethodEntry
		} else {
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

func (service OpenapiService) addServiceSpec(serviceName string, spec map[string]interface{}, operationIdMap *map[string]bool, errorEncountered *bool) error {
	specPaths := spec["paths"].(map[string]interface{})
	path := reflect.ValueOf(specPaths).MapKeys()[0].String()
	method := reflect.ValueOf(specPaths[path].(map[string]interface{})).MapKeys()[0].String()
	newMethodEntry := specPaths[path].(map[string]interface{})[method]

	OpenapiServiceMapMutex.Lock()
	defer OpenapiServiceMapMutex.Unlock()

	existing, ok := OpenapiServiceMap[serviceName]
	if !ok {
		baseInfo, _ := openapiServicesConfig[serviceName].(map[string]interface{})
		info := map[string]interface{}{
			"title":   serviceName + " API",
			"version": "1.0.0",
		}
		if baseInfo != nil {
			if t := baseInfo["title"]; t != nil {
				info["title"] = t
			}
			if v := baseInfo["version"]; v != nil {
				info["version"] = v
			}
			if c := baseInfo["contact"]; c != nil {
				info["contact"] = c
			}
			if s := baseInfo["summary"]; s != nil {
				info["summary"] = s
			}
		}
		tags := []map[string]string{}
		tagsPath := fmt.Sprintf("/home/site/data/openapi_tags/%s.yaml", serviceName)
		if loaded, err := loadTagsFile(tagsPath); err == nil {
			tags = loaded
		}
		externalDocs := map[string]interface{}{}
		if baseInfo != nil && baseInfo["externalDocs"] != nil {
			if ed, ok := baseInfo["externalDocs"].(map[string]interface{}); ok {
				externalDocs = ed
			} else if ed, ok := baseInfo["externalDocs"].(map[interface{}]interface{}); ok {
				for k, v := range ed {
					if sk, ok := k.(string); ok {
						externalDocs[sk] = v
					}
				}
			}
		}
		OpenapiServiceMap[serviceName] = map[string]interface{}{
			"openapi":      "3.1.0",
			"info":         info,
			"paths":        make(map[string]interface{}),
			"tags":         tags,
			"externalDocs": externalDocs,
		}
		OpenapiSpecCounter[serviceName] = 0
		existing = OpenapiServiceMap[serviceName]
	}
	OpenapiSpecCounter[serviceName]++
	serviceSpec := existing.(map[string]interface{})
	pathsMap := serviceSpec["paths"].(map[string]interface{})

	operationId, _ := newMethodEntry.(map[string]interface{})["operationId"].(string)
	opKey := fmt.Sprintf("%s (%s)", operationId, serviceName)
	if _, exists := (*operationIdMap)[opKey]; exists {
		*errorEncountered = true
		OpenapiSpecErrorMutex.Lock()
		if OpenapiSpecError == nil {
			OpenapiSpecError = fmt.Errorf("duplicate operationId: %s", opKey)
		}
		OpenapiSpecErrorMutex.Unlock()
		return nil
	}
	(*operationIdMap)[opKey] = true

	if existingPath, pathExists := pathsMap[path]; pathExists {
		existingPathMap := existingPath.(map[string]interface{})
		if _, methodExists := existingPathMap[method]; methodExists {
			*errorEncountered = true
			return fmt.Errorf("method %s already exists for path %s in service %s", strings.ToUpper(method), path, serviceName)
		}
		existingPathMap[method] = newMethodEntry
	} else {
		pathsMap[path] = specPaths[path]
	}
	return nil
}

func (service OpenapiService) ValidateOpenapiGlobalSpec() error {
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
	for mapKey := range OpenapiGlobalMap {
		spec := OpenapiGlobalMap[mapKey].(map[string]interface{})
		pathsMap := spec["paths"].(map[string]interface{})
		versionEndpoints := 0
		for _, pathValue := range pathsMap {
			pathMethods := pathValue.(map[string]interface{})
			versionEndpoints += len(pathMethods)
		}
		OpenapiSpecCounterMutex.Lock()
		received := OpenapiSpecCounter[mapKey]
		OpenapiSpecCounterMutex.Unlock()
		models.Logger.Debug("[ValidateOpenapiGlobalSpec] %s: received %d specs, %d endpoints", mapKey, received, versionEndpoints)
		totalEndpoints += versionEndpoints
	}
	models.Logger.Debug("[ValidateOpenapiGlobalSpec] Total ArangoDB endpoints: %d (total specs: %d, rejected: %d)", totalEndpoints, totalSpecs, OpenapiRejectedSpecs)
	OpenapiGlobalMapMutex.RUnlock()

	// Validate ArangoDB: one file per (version, apiVersionIndex) -> 0-openapi.json, 1-openapi.json, 2-openapi.json
	for key, versionList := range Versions {
		if key != "/arangodb/" {
			continue
		}
		for _, version := range versionList {
			for _, apiIdx := range arangoDBAllowedAPIVersionIndices(version.Name) {
				mapKey := fmt.Sprintf("%s_%d", version.Name, apiIdx)
				wg.Add(1)
				go service.ValidateArangoDBFile(version.Name, apiIdx, mapKey, &wg)
			}
		}
		wg.Wait()
	}

	// Validate other services: one openapi.json per service in site/data/<Service-Name>/
	OpenapiServiceMapMutex.RLock()
	serviceNames := make([]string, 0, len(OpenapiServiceMap))
	for name := range OpenapiServiceMap {
		serviceNames = append(serviceNames, name)
	}
	OpenapiServiceMapMutex.RUnlock()
	for _, serviceName := range serviceNames {
		wg.Add(1)
		go service.ValidateServiceFile(serviceName, &wg)
	}
	wg.Wait()

	OpenapiSpecErrorMutex.Lock()
	specError := OpenapiSpecError
	OpenapiSpecErrorMutex.Unlock()

	OpenapiValidationErrorMutex.Lock()
	validationError := OpenapiValidationError
	OpenapiValidationErrorMutex.Unlock()

	if specError != nil {
		return specError
	}
	return validationError
}

func (service OpenapiService) ValidateArangoDBFile(version string, apiVersionIndex int, mapKey string, wg *sync.WaitGroup) error {
	defer wg.Done()

	fileName := fmt.Sprintf("%d-openapi.json", apiVersionIndex)
	dir := "/home/site/data/" + version
	path := dir + "/" + fileName

	OpenapiGlobalMapMutex.RLock()
	spec, exists := OpenapiGlobalMap[mapKey]
	OpenapiGlobalMapMutex.RUnlock()
	if !exists {
		return nil
	}
	specMap := spec.(map[string]interface{})
	file, _ := json.MarshalIndent(specMap, "", " ")

	if err := os.MkdirAll(dir, 0755); err != nil {
		OpenapiValidationErrorMutex.Lock()
		if OpenapiValidationError == nil {
			OpenapiValidationError = err
		}
		OpenapiValidationErrorMutex.Unlock()
		return err
	}
	os.WriteFile(path, file, 0644)

	cmd := exec.Command("swagger-cli", "validate", path)
	var out, er bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &er
	err := cmd.Run()
	models.Logger.Printf("%s\n%s", out.String(), er.String())

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			models.Logger.Summary("<error code=2>%s %s - <strong>Error %d</strong>:", version, fileName, exitError.ExitCode())
			models.Logger.Summary("%s</error>", er.String())
			OpenapiValidationErrorMutex.Lock()
			if OpenapiValidationError == nil {
				OpenapiValidationError = fmt.Errorf("swagger-cli validation failed for %s/%s", version, fileName)
			}
			OpenapiValidationErrorMutex.Unlock()
		}
	} else {
		models.Logger.Summary("%s %s &#x2713;", version, fileName)
	}
	return err
}

func (service OpenapiService) ValidateServiceFile(serviceName string, wg *sync.WaitGroup) error {
	defer wg.Done()

	dir := "/home/site/data/" + serviceName
	path := dir + "/openapi.json"

	OpenapiServiceMapMutex.RLock()
	spec, exists := OpenapiServiceMap[serviceName]
	OpenapiServiceMapMutex.RUnlock()
	if !exists {
		return nil
	}
	file, _ := json.MarshalIndent(spec.(map[string]interface{}), "", " ")

	if err := os.MkdirAll(dir, 0755); err != nil {
		OpenapiValidationErrorMutex.Lock()
		if OpenapiValidationError == nil {
			OpenapiValidationError = err
		}
		OpenapiValidationErrorMutex.Unlock()
		return err
	}
	os.WriteFile(path, file, 0644)

	cmd := exec.Command("swagger-cli", "validate", path)
	var out, er bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &er
	err := cmd.Run()
	models.Logger.Printf("%s\n%s", out.String(), er.String())

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			models.Logger.Summary("<error code=2>%s - <strong>Error %d</strong>:", serviceName, exitError.ExitCode())
			models.Logger.Summary("%s</error>", er.String())
			OpenapiValidationErrorMutex.Lock()
			if OpenapiValidationError == nil {
				OpenapiValidationError = fmt.Errorf("swagger-cli validation failed for service %s", serviceName)
			}
			OpenapiValidationErrorMutex.Unlock()
		}
	} else {
		models.Logger.Summary("%s &#x2713;", serviceName)
	}
	return err
}
