package models

import (
	"io"
	"io/ioutil"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/format"
	"gopkg.in/yaml.v3"
)

var formatter = format.OpenapiFormatter{}

func ParseOpenapiPayload(request io.Reader) (map[string]interface{}, error) {
	req, err := ioutil.ReadAll(request)
	if err != nil {
		Logger.Printf("Error reading Example body: %s\n", err.Error())
		return nil, err
	}

	req = formatter.EditDescriptions(req)

	optionsYaml := make(map[string]interface{})
	err = yaml.Unmarshal(req, &optionsYaml)
	if err != nil {
		Logger.Printf("Error PARSING Example body: %s\n", err.Error())
		lines := strings.Split(string(req), "\n")
		for i, line := range lines {
			if i < 4 {
				Logger.Printf(line)
			} else {
				break
			}
		}

		return nil, err
	}

	return optionsYaml, nil
}
