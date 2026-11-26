package models

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Version struct {
	Name               string   `yaml:"name,omitempty" json:"name,omitempty"`
	Version            string   `yaml:"version,omitempty" json:"version,omitempty"`
	Deprecated         bool     `yaml:"deprecated,omitempty" json:"deprecated,omitempty"`
	Alias              string   `yaml:"alias,omitempty" json:"alias,omitempty"`
	AllowedAPIVersions []string `yaml:"allowedAPIVersions,omitempty" json:"allowedAPIVersions,omitempty"` // e.g. ["v0"], ["v0","v1","experimental"] for ArangoDB API version indices
}

func LoadVersions() map[string][]Version {
	versions := map[string][]Version{}
	yamlFile, _ := os.ReadFile("/home/site/data/versions.yaml")

	yaml.Unmarshal(yamlFile, &versions)

	return versions
}

// The arangodb/arangodb branch each docs version is based on (e.g. "devel" for
// the version in development), from the branch settings of .circleci/upstream.yaml
func LoadUpstreamBranches() map[string]string {
	branches := map[string]string{}
	yamlFile, err := os.ReadFile("/home/.circleci/upstream.yaml")
	if err != nil {
		Logger.Printf("[WARNING] Reading .circleci/upstream.yaml: %s", err.Error())
		return branches
	}
	settings := map[string]struct {
		Branch string `yaml:"branch"`
	}{}
	if err := yaml.Unmarshal(yamlFile, &settings); err != nil {
		Logger.Printf("[WARNING] Parsing .circleci/upstream.yaml: %s", err.Error())
		return branches
	}
	for version, s := range settings {
		if s.Branch != "" {
			branches[version] = s.Branch
		}
	}
	return branches
}
