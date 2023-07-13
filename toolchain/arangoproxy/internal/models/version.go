package models

import (
	"io/ioutil"

	"gopkg.in/yaml.v3"
)

type Version struct {
	Name       string `yaml:"name,omitempty" json:"name,omitempty"`
	Version    string `yaml:"version,omitempty" json:"version,omitempty"`
	Deprecated bool   `yaml:"deprecated,omitempty" json:"deprecated,omitempty"`
	Alias      string `yaml:"alias,omitempty" json:"alias,omitempty"`
}

func LoadVersions() []Version {
	versions := []Version{}
	yamlFile, _ := ioutil.ReadFile("/home/site/data/versions.yaml")

	yaml.Unmarshal(yamlFile, &versions)

	return versions
}
