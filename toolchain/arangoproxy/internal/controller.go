package internal

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/aql"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/httpapi"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/js"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/openapi"
)

// Dependency Injection
var (
	CommonService  = common.Service{}
	JSService      = js.JSService{}
	HTTPService    = httpapi.HTTPService{}
	AQLService     = aql.AQLService{}
	OPENAPIService = openapi.OpenapiService{}

	CacheChannel         = make(chan map[string]interface{})
	OpenapiGlobalChannel = make(chan map[string]interface{})

	Versions = common.LoadVersions()
)

// Start and expose the webserver
func StartController(url string) {
	go CommonService.SaveCachedExampleResponse(CacheChannel)
	go OPENAPIService.AddSpecToGlobalSpec(OpenapiGlobalChannel)
	// Create routes
	http.HandleFunc("/health", HealthHandler)
	http.HandleFunc("/js", JSHandler)
	http.HandleFunc("/curl", HTTPExampleHandler)
	http.HandleFunc("/aql", AQLHandler)
	http.HandleFunc("/openapi", OpenapiHandler)
	http.HandleFunc("/openapi-validate", ValidateOpenapiHandler)
	http.HandleFunc("/go", TODOHandler)
	http.HandleFunc("/java", TODOHandler)

	log.Fatal(http.ListenAndServe(url, nil))
}

// Handler for the js codeblocks
func JSHandler(w http.ResponseWriter, r *http.Request) {
	request, err := common.ParseExample(r.Body, common.JS)
	if err != nil {
		common.Logger.Printf("[js/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	common.Logger.Printf("[js/CONTROLLER] Processing Example %s\n", request.Options.Name)

	resp := JSService.ExecuteExample(request, CacheChannel)
	response, err := json.Marshal(resp)
	if err != nil {
		fmt.Printf("[js/CONTROLLER] Error marshalling response: %s\n", err.Error())
		return
	}
	common.Logger.Printf("[js/CONTROLLER] END Example %s\n", request.Options.Name)

	w.Write(response)
}

// Handler for curl codeblocks
func HTTPExampleHandler(w http.ResponseWriter, r *http.Request) {
	request, err := common.ParseExample(r.Body, common.HTTP)
	if err != nil {
		common.Logger.Printf("[curl/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	common.Logger.Printf("[curl/CONTROLLER] Processing Example %s\n", request.Options.Name)

	resp, err := HTTPService.ExecuteHTTPExample(request, CacheChannel)
	if err != nil {
		common.Logger.Printf("[HTTP] Error caused by request\n%s", request.Code)
	}
	response, err := json.Marshal(resp)
	if err != nil {
		common.Logger.Printf("[curl/CONTROLLER] Error marshalling response: %s\n", err.Error())
		return
	}

	common.Logger.Printf("[curl/CONTROLLER] END Example %s\n", request.Options.Name)

	w.Write(response)
}

// Handler for aql codeblocks
func AQLHandler(w http.ResponseWriter, r *http.Request) {
	request, err := common.ParseExample(r.Body, common.AQL)
	if err != nil {
		common.Logger.Printf("[aql/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	common.Logger.Printf("[aql/CONTROLLER] Processing Example %s\n", request.Options.Name)

	resp := AQLService.Execute(request, CacheChannel)
	response, err := json.Marshal(resp)
	if err != nil {
		fmt.Printf("[aql/CONTROLLER] Error marshalling response: %s\n", err.Error())
		return
	}
	common.Logger.Printf("[aql/CONTROLLER] END Example %s\n", request.Options.Name)

	w.Write(response)
}

func OpenapiHandler(w http.ResponseWriter, r *http.Request) {
	openapiYaml, err := OPENAPIService.ParseOpenapiPayload(r.Body)
	if err != nil {
		return
	}

	err = OPENAPIService.ProcessOpenapiSpec(openapiYaml, r.Header, OpenapiGlobalChannel)
	w.WriteHeader(http.StatusOK)
}

func ValidateOpenapiHandler(w http.ResponseWriter, r *http.Request) {
	common.Logger.Printf("VALIDATE")

	OPENAPIService.ValidateOpenapiGlobalSpec()
	w.WriteHeader(http.StatusOK)
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	common.Logger.Printf("Health OK\n")
	w.WriteHeader(http.StatusOK)
}

// Empty handler
func TODOHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("TODO")
}
