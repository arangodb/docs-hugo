package models

import (
	"io"
	"strings"

	"gopkg.in/yaml.v3"
)

func ParseOpenapiPayload(request io.Reader) (map[string]interface{}, error) {
	req, err := io.ReadAll(request)
	if err != nil {
		Logger.Printf("Error reading Example body: %s\n", err.Error())
		return nil, err
	}

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
