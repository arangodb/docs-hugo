package utils

import (
	"os"
)

func GetCommonFunctions() (string, error) {
	file, err := os.ReadFile("../internal/utils/common.js")
	return string(file), err
}

func GetSetupFunctions() (string, error) {
	file, err := os.ReadFile("../internal/utils/setup.js")
	return string(file), err
}
