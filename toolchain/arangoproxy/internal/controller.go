package internal

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/arangosh"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/service"
)

// Dependency Injection
var (
	JSService      = service.JSService{}
	CurlService    = service.CurlService{}
	AQLService     = service.AQLService{}
	OPENAPIService = service.OpenapiService{}

	CacheChannel         = make(chan map[string]interface{})
	OpenapiGlobalChannel = make(chan map[string]interface{})

	Versions = models.LoadVersions()
)

// Start and expose the webserver
func StartController(url string) {
	launchRoutines()
	createRoutes()
	log.Fatal(http.ListenAndServe(url, nil))
}

func launchRoutines() {
	go SaveCachedExampleResponse(CacheChannel)
	go OPENAPIService.AddSpecToGlobalSpec(OpenapiGlobalChannel)
	arangosh.StartRoutine()
}

func createRoutes() {
	http.HandleFunc("/health", HealthHandler)
	http.HandleFunc("/page-done", PageDoneHandler)
	http.HandleFunc("/js", JSHandler)
	http.HandleFunc("/curl", CurlExampleHandler)
	http.HandleFunc("/aql", AQLHandler)
	http.HandleFunc("/openapi", OpenapiHandler)
	http.HandleFunc("/openapi-validate", ValidateOpenapiHandler)
	http.HandleFunc("/go", TODOHandler)
	http.HandleFunc("/java", TODOHandler)
}

func JSHandler(w http.ResponseWriter, r *http.Request) {
	request, err := models.ParseExample(r.Body, r.Header)
	if err != nil {
		models.Logger.Printf("[js/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	models.Logger.Printf("[js/CONTROLLER] Queued %s Example %s\n", request.Options.Version, request.Options.Name)

	resp := JSService.Execute(request, CacheChannel)
	response, err := json.Marshal(resp)
	if err != nil {
		fmt.Printf("[js/CONTROLLER] Error marshalling response: %s\n", err.Error())
		return
	}

	models.Logger.Printf("[js/CONTROLLER] END %s Example %s\n", request.Options.Version, request.Options.Name)

	w.Write(response)
}

func CurlExampleHandler(w http.ResponseWriter, r *http.Request) {
	request, err := models.ParseExample(r.Body, r.Header)
	if err != nil {
		models.Logger.Printf("[curl/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	models.Logger.Printf("[curl/CONTROLLER] Queued %s Example %s\n", request.Options.Version, request.Options.Name)

	resp, err := CurlService.Execute(request, CacheChannel)
	response, err := json.Marshal(resp)
	if err != nil {
		models.Logger.Printf("[curl/CONTROLLER] Error marshalling response: %s\n", err.Error())
		return
	}

	models.Logger.Printf("[curl/CONTROLLER] END %s Example %s\n", request.Options.Version, request.Options.Name)

	w.Write(response)
}

func AQLHandler(w http.ResponseWriter, r *http.Request) {
	request, err := models.ParseExample(r.Body, r.Header)
	if err != nil {
		models.Logger.Printf("[aql/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	models.Logger.Printf("[aql/CONTROLLER] Queued %s Example %s\n", request.Options.Version, request.Options.Name)

	resp := AQLService.Execute(request, CacheChannel)
	response, err := json.Marshal(resp)
	if err != nil {
		fmt.Printf("[aql/CONTROLLER] Error marshalling response: %s\n", err.Error())
		return
	}
	models.Logger.Printf("[aql/CONTROLLER] END %s Example %s\n", request.Options.Version, request.Options.Name)

	w.Write(response)
}

func OpenapiHandler(w http.ResponseWriter, r *http.Request) {
	openapiYaml, err := models.ParseOpenapiPayload(r.Body)
	if err != nil {
		return
	}

	OPENAPIService.ProcessOpenapiSpec(openapiYaml, r.Header, OpenapiGlobalChannel)
	w.Header().Set("Content-Type", "text/plain") // Any allow-listed media type
	w.WriteHeader(http.StatusOK)
}

func ValidateOpenapiHandler(w http.ResponseWriter, r *http.Request) {
	models.Logger.Printf("Validate openapi specs")

	err := OPENAPIService.ValidateOpenapiGlobalSpec()
	w.Header().Set("Content-Type", "text/plain") // Any allow-listed media type
	if err != nil {
		models.Logger.Printf("[ValidateOpenapiHandler] Validation failed: %s", err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("OpenAPI validation failed: %s", err.Error())))
		return
	}
	w.WriteHeader(http.StatusOK)
}

// PageDoneHandler is requested by the page template after rendering a page with
// examples, to remove what the examples exempted but didn't remove (see
// arangosh.PageDone). Headers: Page (source file), Version.
func PageDoneHandler(w http.ResponseWriter, r *http.Request) {
	page, version := r.Header.Get("Page"), r.Header.Get("Version")
	for _, repository := range models.Repositories {
		if repository.Version == version {
			arangosh.PageDone(page, repository)
		}
	}
	w.Write([]byte("{}"))
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	models.Logger.Printf("Health OK\n")
	w.WriteHeader(http.StatusOK)
}

// Empty handler
func TODOHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("TODO")
}
