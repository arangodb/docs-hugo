package models

import (
	"errors"
	"fmt"
	"io"
)

type Repository struct {
	Type         string         `yaml:"type"`
	Version      string         `yaml:"version"`
	Url          string         `yaml:"url"`          // Instance URL+Port to connect to
	Container    string         `yaml:"container"`    // Docker container to run arangosh in (via docker exec)
	ArangoshArgs []string       `yaml:"arangoshArgs"` // Extra arangosh args, e.g. --config and --javascript.startup-directory
	StdoutPipe   io.ReadCloser  `yaml:"-"`
	StdinPipe    io.WriteCloser `yaml:"-"`
}

var Repositories map[string]Repository

func GetRepository(typ, version string) (Repository, error) {
	if repository, exists := Repositories[fmt.Sprintf("%s_%s", typ, version)]; exists {
		return repository, nil
	}

	return Repository{}, errors.New("repository " + version + " not found")
}
