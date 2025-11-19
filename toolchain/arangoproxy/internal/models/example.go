package models

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
	"gopkg.in/yaml.v3"
)

type RenderType string

const (
	INPUT        RenderType = "input"
	OUTPUT       RenderType = "output"
	INPUT_OUTPUT RenderType = "input/output"
)

// @Example represents an example request to be supplied to an arango instance
type Example struct {
	Options       ExampleOptions `json:"options"` // The codeblock yaml part
	Code          string         `json:"code"`
	Repository    Repository     `json:"-"`
	Base64Request string         `json:"-"`
}

// The yaml part in the codeblock
type ExampleOptions struct {
	Description string                 `yaml:"description" json:"description"`             // What appears on codeblock header
	Name        string                 `yaml:"name" json:"name"`                           // Example Name
	Type        string                 `yaml:"type,omitempty" json:"type,omitempty"`       // Example Name
	Version     string                 `yaml:"-" json:"-"`                                 // Arango instance version to launch the example against
	Render      RenderType             `yaml:"render,omitempty" json:"render,omitempty"`   // Return the example code, the example output or both
	Explain     bool                   `yaml:"explain,omitempty" json:"explain,omitempty"` // AQL @EXPLAIN flag
	BindVars    map[string]interface{} `yaml:"bindVars,omitempty" json:"bindVars,omitempty"`
	Dataset     string                 `yaml:"dataset,omitempty" json:"dataset,omitempty"`
	SaveCache   string                 `yaml:"-" json:"-"`
	Filename    string                 `yaml:"-" json:"-"`
	Position    string                 `yaml:"-" json:"-"`
}

// Get an example code block, parse the yaml options and the code itself
func ParseExample(request io.Reader, headers http.Header) (Example, error) {
	req, err := io.ReadAll(request)
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

	if optionsYaml.Type == "" {
		optionsYaml.Type = "single"
	}

	if optionsYaml.Render == "" {
		optionsYaml.Render = "input/output"
	}

	optionsYaml.Filename = headers.Get("Page")
	optionsYaml.Position = headers.Get("Codeblock-Path")
	optionsYaml.SaveCache = headers.Get("Cache")
	optionsYaml.Version = headers.Get("Version")

	if Conf.Override != " " {
		overrideRE := regexp2.MustCompile(Conf.Override, 0)
		optionsYaml.SaveCache = strconv.FormatBool(utils.Regexp2StringHasMatch(overrideRE, optionsYaml.Name))
	}

	code := strings.Replace(string(decodedRequest), string(options), "", -1)

	Logger.Debug("[%s] Example Information:\n%s", optionsYaml.Name, optionsYaml.String())

	return Example{Options: optionsYaml, Code: code, Base64Request: string(req)}, nil
}

func (r Example) String() string {
	j, err := json.Marshal(r)
	if err != nil {
		return ""
	}

	return string(j)
}

func (r ExampleOptions) String() string {
	return fmt.Sprintf("Type: %s\nVersion: %s\nSaveCache: %s\nPosition: %s\n", r.Type, r.Version, r.SaveCache, r.Position)
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
	codeComments := regexp.MustCompile(`(?m) *~.*\n*`) // Cut the ~... strings from the displayed input
	response.Input = codeComments.ReplaceAllString(response.Input, "")
	newLines := regexp.MustCompile(`(?m)^ *\n^ *\n`)
	response.Input = newLines.ReplaceAllString(response.Input, "")
	xpError := regexp.MustCompile(`(?m)\/\/ xpError.*`)
	response.Input = xpError.ReplaceAllString(response.Input, "")

	response.Input = strings.TrimLeft(response.Input, "\r\n")
	response.Input = strings.TrimLeft(response.Input, "\n")
	response.Input = strings.TrimRight(response.Input, "\r\n")
	response.Input = strings.TrimRight(response.Input, "\n")

	response.Input = strings.ReplaceAll(response.Input, "\n\n\n", "\n")
	response.Input = strings.ReplaceAll(response.Input, "\r\n\r\n\r\n", "\r\n")

	if strings.Contains(string(response.Options.Render), "output") {
		response.Output = strings.TrimLeft(response.Output, "\r\n")
		response.Output = strings.TrimLeft(response.Output, "\n")
		response.Output = strings.TrimRight(response.Output, "\r\n")
		response.Output = strings.TrimRight(response.Output, "\n")

		response.Output = strings.ReplaceAll(response.Output, "\n\n\n", "\n")
		response.Output = strings.ReplaceAll(response.Output, "\r\n\r\n\r\n", "\r\n")
	}

	if response.Output == "" {
		response.Output = "Empty Output"
	}
}

type AQLResponse struct {
	ExampleResponse
	BindVars map[string]interface{} `json:"bindVars"`
}
