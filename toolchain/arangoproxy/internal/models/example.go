package models

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

type ExampleType string
type RenderType string

const (
	JS   ExampleType = "js"
	AQL  ExampleType = "aql"
	HTTP ExampleType = "http"

	INPUT        RenderType = "input"
	OUTPUT       RenderType = "output"
	INPUT_OUTPUT RenderType = "input/output"
)

// @Example represents an example request to be supplied to an arango instance
type Example struct {
	Type          ExampleType    `json:"type"`
	Options       ExampleOptions `json:"options"` // The codeblock yaml part
	Code          string         `json:"code"`
	Repository    Repository     `json:"-"`
	Base64Request string         `json:"-"`
}

// The yaml part in the codeblock
type ExampleOptions struct {
	ServerName  string                 `yaml:"server_name,omitempty" json:"server_name,omitempty"` // Arango instance to be used: nightly, release ...
	Description string                 `yaml:"description" json:"description"`                     // What appears on codeblock header
	Name        string                 `yaml:"name" json:"name"`                                   // Example Name
	Type        string                 `yaml:"type" json:"type"`                                   // Example Name
	Version     string                 `yaml:"version" json:"version"`                             // Arango instance version to launch the example against
	Render      RenderType             `yaml:"render" json:"render"`                               // Return the example code, the example output or both
	Explain     bool                   `yaml:"explain,omitempty" json:"explain,omitempty"`         // AQL @EXPLAIN flag
	BindVars    map[string]interface{} `yaml:"bindVars,omitempty" json:"bindVars,omitempty"`
	Dataset     string                 `yaml:"dataset,omitempty" json:"dataset,omitempty"`
	Filename    string                 `yaml:"-" json:"-"`
	Position    string                 `yaml:"-" json:"-"`
}

// Get an example code block, parse the yaml options and the code itself
func ParseExample(request io.Reader, headers http.Header) (Example, error) {
	req, err := ioutil.ReadAll(request)
	if err != nil {
		Logger.Printf("Error reading Example body: %s\n", err.Error())
		return Example{}, err
	}

	decodedRequest, err := base64.StdEncoding.DecodeString(string(req))
	if err != nil {
		return Example{}, fmt.Errorf("ParseExample error decoding request: %s", err.Error())
	}

	// Parse the yaml part
	r, err := regexp.Compile("---[\\w\\s\\W]*---")
	if err != nil {
		return Example{}, fmt.Errorf("ParseExample error compiling regex: %s", err.Error())
	}

	options := r.Find(decodedRequest)
	optionsYaml := ExampleOptions{}
	err = yaml.Unmarshal(options, &optionsYaml)
	if err != nil {
		return Example{}, fmt.Errorf("ParseExample error parsing options: %s\nBroken content: %s", err.Error(), string(options))
	}

	optionsYaml.Filename = headers.Get("Page")
	optionsYaml.Position = headers.Get("Codeblock-Start")

	code := strings.Replace(string(decodedRequest), string(options), "", -1)

	return Example{Type: "", Options: optionsYaml, Code: code, Base64Request: string(req)}, nil
}

func (r Example) String() string {
	j, err := json.Marshal(r)
	if err != nil {
		return ""
	}

	return string(j)
}

func (r ExampleOptions) String() string {
	j, err := json.Marshal(r)
	if err != nil {
		return ""
	}

	return string(j)
}

type ExampleResponse struct {
	Input   string         `json:"input"`
	Output  string         `json:"output"`
	Error   string         `json:"error"`
	Options ExampleOptions `json:"options"`
}

func NewExampleResponse(input, output string, options ExampleOptions) (res *ExampleResponse) {
	res = new(ExampleResponse)
	res.Input, res.Options = input, options

	if strings.Contains(string(options.Render), "output") {
		res.Output = output
	} else {
		res.Output = "Empty output"
	}

	FormatResponse(res)

	return
}

func (r ExampleResponse) String() string {
	j, err := json.Marshal(r)
	if err != nil {
		return ""
	}

	return string(j)
}

func FormatResponse(response *ExampleResponse) {
	codeComments := regexp.MustCompile(`(?m)~.*`) // Cut the ~... strings from the displayed input
	response.Input = codeComments.ReplaceAllString(response.Input, "")

	re := regexp.MustCompile(`(?m)^\s*$\r?\n`) // Cut all excessive spaces and newlines from output
	response.Input = re.ReplaceAllString(response.Input, "")
	if strings.Contains(string(response.Options.Render), "output") {
		response.Output = re.ReplaceAllString(response.Output, "")
		response.Output = strings.TrimPrefix(strings.TrimPrefix(response.Output, "\n"), "\r\n")
	}

	if response.Output == "" {
		response.Output = "Empty Output"
	}
}

type AQLResponse struct {
	ExampleResponse
	BindVars map[string]interface{} `json:"bindVars"`
}
