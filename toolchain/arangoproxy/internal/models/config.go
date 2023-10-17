package models

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Repositories []Repository `yaml:"repositories"` // ArangoDB instances
	Cache        string       `yaml:"cache"`        // Cache configuration
	Datasets     string       `yaml:"datasetsFile"`
	Debug        bool         `yaml:"debug"`
	Override     string       `yaml:"-"`
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

func (c Config) String() string {
	return fmt.Sprintf("  Cache: %s\n  Datasets: %s\n  Debug: %t\n  Override: %s\n  Repositories: %s", c.Cache, c.Datasets, c.Debug, c.Override, c.Repositories)
}
