package internal

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

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
	models.BeforeExit = append(models.BeforeExit, FlushCache)
	handleStopSignals()
	go OPENAPIService.AddSpecToGlobalSpec(OpenapiGlobalChannel)
	arangosh.StartRoutine()
}

func createRoutes() {
	http.HandleFunc("/health", HealthHandler)
	http.HandleFunc("/page-done", PageDoneHandler)
	http.HandleFunc("/flush-cache", FlushCacheHandler)
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
	writeExampleResponse(w, "js", request.Options, resp)
}

func CurlExampleHandler(w http.ResponseWriter, r *http.Request) {
	request, err := models.ParseExample(r.Body, r.Header)
	if err != nil {
		models.Logger.Printf("[curl/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	models.Logger.Printf("[curl/CONTROLLER] Queued %s Example %s\n", request.Options.Version, request.Options.Name)

	resp, _ := CurlService.Execute(request, CacheChannel)
	writeExampleResponse(w, "curl", request.Options, resp)
}

func AQLHandler(w http.ResponseWriter, r *http.Request) {
	request, err := models.ParseExample(r.Body, r.Header)
	if err != nil {
		models.Logger.Printf("[aql/CONTROLLER] Error parsing request %s\n", err.Error())
		return
	}

	models.Logger.Printf("[aql/CONTROLLER] Queued %s Example %s\n", request.Options.Version, request.Options.Name)

	resp := AQLService.Execute(request, CacheChannel)
	writeExampleResponse(w, "aql", request.Options, resp)
}

// The run itself is logged by arangosh.Run ([EXEC] Running/Finished, errors
// with the example name), only failures after it are logged here.
func writeExampleResponse(w http.ResponseWriter, kind string, options models.ExampleOptions, resp interface{}) {
	response, err := json.Marshal(resp)
	if err != nil {
		models.Logger.Printf("[%s/CONTROLLER] [ERROR] %s Example %s: Encoding the response failed: %s", kind, options.Version, options.Name, err.Error())
		models.Logger.Error("Examples", options.Version, options.Name, options.Position, "Encoding the response for Hugo failed: "+err.Error())
		return
	}
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
	// An empty page would match the exemptions of the setup (no page), and
	// removing them would break all subsequent examples
	if page == "" {
		http.Error(w, "missing Page header", http.StatusBadRequest)
		return
	}
	for _, repository := range models.Repositories {
		if repository.Version == version {
			arangosh.PageDone(page, repository)
		}
	}
	w.Write([]byte("{}"))
}

// Writes the pending cache entries, called by the toolchain before it assembles
// the report (errors while writing are reported)
func FlushCacheHandler(w http.ResponseWriter, r *http.Request) {
	FlushCache()
	// End of the run: an override that matched nothing saved nothing, e.g. a
	// misspelled example name
	for _, pattern := range models.UnmatchedOverrides() {
		models.Logger.Printf("[OVERRIDE] [WARN] %s matched no example, no output was saved for it", pattern)
		models.Logger.Issue("warning", "Examples", "", "Override", "", "`"+pattern+"` matched no example, no output was saved for it")
	}
	w.Write([]byte("{}"))
}

// docker stop (SIGTERM), Ctrl+C (SIGINT): write the pending cache entries first
func handleStopSignals() {
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		sig := <-signals
		models.Logger.Printf("[STOP] Received %s, writing the pending cache entries", sig)
		models.Exit(0)
	}()
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	models.Logger.Printf("Health OK\n")
	w.WriteHeader(http.StatusOK)
}

// Empty handler
func TODOHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("TODO")
}
