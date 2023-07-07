package config

import (
	"io"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	WebServer    string       `yaml:"webserver"`    // Arangoproxy url+port
	Repositories []Repository `yaml:"repositories"` // ArangoDB instances
	Cache        string       `yaml:"cache"`        // Cache configuration
	Log          string       `yaml:"logFile"`      // Logfile
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

type Repository struct {
	Name       string         `yaml:"name"` // ArangoDB instance name
	Type       string         `yaml:"type"`
	Version    string         `yaml:"version"`
	Url        string         `yaml:"url"` // Instance URL+Port to connect to
	StdoutPipe io.ReadCloser  `yaml:"-"`
	StdinPipe  io.WriteCloser `yaml:"-"`
}
