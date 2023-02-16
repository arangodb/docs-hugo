package internal

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

func Build() {
	err := filepath.WalkDir(config.Conf.BuildDir, visit)
	fmt.Printf("filepath.WalkDir() returned %v\n", err)
}

func visit(path string, di fs.DirEntry, err error) error {
	fmt.Printf("Visited: %s\n", path)
	if di.IsDir() {
		return nil
	}

	if !(strings.Contains(di.Name(), ".md")) {
		return nil
	}

	b, err := os.ReadFile(path) // just pass the file name
	if err != nil {
		return err
	}

	content := string(b) // convert content to a 'string'

	examplesRe := regexp2.MustCompile("(?ms)```(?:.*?)```", 0)
	examples := utils.Regexp2FindAllString(examplesRe, content)

	for _, example := range examples {
		if !(strings.Contains(example, "---")) {
			continue
		}

		fmt.Printf("TROVATO %s", example)
	}

	return nil
}
