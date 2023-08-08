package models

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Repositories []Repository `yaml:"repositories"` // ArangoDB instances
	Cache        string       `yaml:"cache"`        // Cache configuration
	Datasets     string       `yaml:"datasetsFile"` // Logfile
}

var Conf Config

func LoadConfig(file string) error {
	fileStream, err := os.ReadFile(file)
	if err != nil {
		return err
	}

	err = yaml.Unmarshal(fileStream, &Conf)
	return err
}
