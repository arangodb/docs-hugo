package models

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Version struct {
	Name                string   `yaml:"name,omitempty" json:"name,omitempty"`
	Version             string   `yaml:"version,omitempty" json:"version,omitempty"`
	Deprecated          bool     `yaml:"deprecated,omitempty" json:"deprecated,omitempty"`
	Alias               string   `yaml:"alias,omitempty" json:"alias,omitempty"`
	AllowedAPIVersions  []string `yaml:"allowedAPIVersions,omitempty" json:"allowedAPIVersions,omitempty"` // e.g. ["v0"], ["v0","v1","experimental"] for ArangoDB API version indices
}

func LoadVersions() map[string][]Version {
	versions := map[string][]Version{}
	yamlFile, _ := os.ReadFile("/home/site/data/versions.yaml")

	yaml.Unmarshal(yamlFile, &versions)

	return versions
}
