package openapi

import (
	"bytes"
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"gopkg.in/yaml.v3"
)

type OpenapiService struct {
	common.Service
}

var OpenapiGlobalMap map[string]interface{}
var Versions []common.Version

func init() {
	OpenapiGlobalMap = make(map[string]interface{})
	Versions = common.LoadVersions()

	for _, version := range Versions {
		OpenapiGlobalMap[version.Name] = map[string]interface{}{
			"openapi": "3.1.0",
			"info": map[string]interface{}{
				"description": "ArangoDB REST API Interface",
				"version":     version.Version,
				"title":       "ArangoDB",
			},
			"paths": make(map[string]interface{}),
		}
		tags := []map[string]string{}
		yamlFile, _ := ioutil.ReadFile("/home/site/data/openapi_tags.yaml")

		yaml.Unmarshal(yamlFile, &tags)
		OpenapiGlobalMap["tags"] = tags
	}
}

func (service OpenapiService) ParseOpenapiPayload(request io.Reader) (map[string]interface{}, error) {
	req, err := ioutil.ReadAll(request)
	if err != nil {
		common.Logger.Printf("Error reading Example body: %s\n", err.Error())
		return nil, err
	}

	// common.Logger.Summary(string(req))

	//req = editDescriptions(req)

	optionsYaml := make(map[string]interface{})
	err = yaml.Unmarshal(req, &optionsYaml)
	if err != nil {
		common.Logger.Printf("Error PARSING Example body: %s\n", err.Error())
		return nil, err
	}

	return optionsYaml, nil
}

func (service OpenapiService) ProcessOpenapiSpec(spec map[string]interface{}, headers http.Header, globalOpenapiChannel chan map[string]interface{}) error {
	summary := strings.Replace(headers.Get("Endpoint-Title"), "#", "", -1)
	version := headers.Get("Page-Version")

	spec["version"] = version

	path := reflect.ValueOf(spec["paths"].(map[string]interface{})).MapKeys()[0].String()
	method := reflect.ValueOf(spec["paths"].(map[string]interface{})[path].(map[string]interface{})).MapKeys()[0].String()
	spec["paths"].(map[string]interface{})[path].(map[string]interface{})[method].(map[string]interface{})["summary"] = summary
	common.Logger.Printf("Process %s %s %s", version, path, method)
	globalOpenapiChannel <- spec
	return nil
}

func (service OpenapiService) ValidateOpenapiGlobalSpec() error {
	time.Sleep(time.Second * 2)
	var wg sync.WaitGroup
	common.Logger.Summary("## OPENAPI<br>")
	for _, version := range Versions {
		wg.Add(1)
		go service.ValidateFile(version.Name, &wg)
	}

	wg.Wait()
	return nil
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

func (service OpenapiService) ValidateFile(version string, wg *sync.WaitGroup) error {
	defer wg.Done()

	file, _ := json.MarshalIndent(OpenapiGlobalMap[version], "", " ")
	ioutil.WriteFile("/home/site/data/"+version+"/api-docs.json", file, 0644)
	cmd := exec.Command("swagger-cli", "validate", "/home/site/data/"+version+"/api-docs.json")
	var out, er bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &er

	err := cmd.Run()
	common.Logger.Printf("%s\n\n\n%s", out.String(), er.String())
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			common.Logger.Summary("%s - **Error %d**:\n", version, exitError.ExitCode())
			common.Logger.Summary("%s", er.String())
			time.Sleep(time.Second * 2)
			os.Exit(exitError.ExitCode())
		}
	}
	common.Logger.Summary("%s &#x2713;", version)
	return nil
}

func editDescriptions(req []byte) []byte {
	payloadString := string(req)

	payloadString = strings.Replace(payloadString, "{{< warning >}}", "> **WARNING:**\n", -1)
	payloadString = strings.Replace(payloadString, "{{< info >}}", "> **INFO:**\n", -1)
	payloadString = strings.Replace(payloadString, "{{< danger >}}", "> **DANGER:**\n", -1)
	payloadString = strings.Replace(payloadString, "{{< success >}}", "> **SUCCESS:**\n", -1)
	payloadString = strings.Replace(payloadString, "{{< tip >}}", "> **TIP:**\n", -1)

	payloadString = strings.Replace(payloadString, "{{< /tip >}}", "", -1)
	payloadString = strings.Replace(payloadString, "{{< /warning >}}", "", -1)
	payloadString = strings.Replace(payloadString, "{{< /info >}}", "", -1)
	payloadString = strings.Replace(payloadString, "{{< /success >}}", "", -1)
	payloadString = strings.Replace(payloadString, "{{< /danger >}}", "", -1)

	return []byte(payloadString)
}
