package main

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
)

var configFile string
var env, override string
var help, useServers bool

// Pre-Run Setup
func init() {
	flag.StringVar(&configFile, "config", "./configs/local.yaml", "path of config file")
	flag.StringVar(&override, "override", " ", "override examples")
	flag.BoolVar(&help, "help", false, "Display help usage")
	flag.BoolVar(&useServers, "use-servers", false, "Enable communication with arangodb servers")
	flag.Parse()

	err := models.LoadConfig(configFile)
	if err != nil {
		fmt.Printf("Error loading config: %s\n, aborting...", err.Error())
		os.Exit(1)
	}
	models.Conf.Override = strings.ReplaceAll(override, ",", "|")

	models.Logger.Printf(startupBanner)

	models.Logger.Printf("Configuration:\n%s\n", models.Conf.String())

}

func main() {
	if useServers {
		internal.InitRepositories()
		models.Logger.Printf("[INIT] Repositories Init Done")

		models.LoadDatasets(models.Conf.Datasets)
		models.Logger.Printf("[INIT] Datasets Loaded")
	}

	internal.StartController(":8080")
}

var startupBanner = `
      _             _   _   _   _   _         
 /\  |_)  /\  |\ | /__ / \ |_) |_) / \ \/ \_/ 
/--\ | \ /--\ | \| \_| \_/ |   | \ \_/ /\  |  
											 
`
