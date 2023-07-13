package models

import (
	"encoding/json"
	"io/ioutil"
)

type Dataset struct {
	Create string `json:"create"`
	Remove string `json:"remove"`
}

var Datasets = make(map[string]Dataset)

func LoadDatasets(datasetsFile string) error {

	fileStream, err := ioutil.ReadFile(datasetsFile)
	if err != nil {
		return err
	}

	err = json.Unmarshal(fileStream, &Datasets)
	return err
}
