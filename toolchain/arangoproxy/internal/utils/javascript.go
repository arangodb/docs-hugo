package utils

import (
	"os"
)

// GetCommonFunctions returns common.js, preceded by the definition of the
// markers that its functions print (see markers.go)
func GetCommonFunctions() (string, error) {
	file, err := os.ReadFile("../internal/utils/common.js")
	return markersJS() + string(file), err
}

func GetSetupFunctions() (string, error) {
	file, err := os.ReadFile("../internal/utils/setup.js")
	return string(file), err
}
