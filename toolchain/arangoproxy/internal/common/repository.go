package common

import (
	"errors"
	"fmt"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
)

var Repositories map[string]config.Repository

func GetRepository(name, typ, version string) (config.Repository, error) {
	Logger.Printf("GET REPO %s %s %s", name, typ, version)
	if repository, exists := Repositories[fmt.Sprintf("%s_%s_%s", name, typ, version)]; exists {
		return repository, nil
	}

	return config.Repository{}, errors.New("repository " + name + "_" + version + " not found")
}

/*
Command line to be used to invoke arangosh, taken from old toolchain
"${ARANGOSH}" \
    --configuration none \
    --server.endpoint tcp://127.0.0.1:${PORT} \
    --log.file ${LOGFILE} \
    --javascript.startup-directory js \
    --javascript.module-directory enterprise/js \
    --javascript.execute $SCRIPT \
    --javascript.allow-external-process-control true \
    --javascript.allow-port-testing true \
    --server.password "" \
    -- \
    "$@"
*/
