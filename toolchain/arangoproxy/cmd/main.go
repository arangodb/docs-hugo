package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

var configFile string
var env string
var help, cleanCache bool

// Pre-Run Setup
func init() {
	flag.StringVar(&configFile, "config", "./configs/local.yaml", "path of config file")
	flag.BoolVar(&help, "help", false, "Display help usage")
	flag.BoolVar(&cleanCache, "no-cache", false, "Reset cache")
	flag.Parse()

	err := config.LoadConfig(configFile)
	if err != nil {
		fmt.Printf("Error loading config: %s\n, aborting...", err.Error())
		os.Exit(1)
	}

	internal.InitRepositories()
	utils.LoadDatasets(config.Conf.Datasets)

	common.Logger.Printf(startupBanner)
	common.Logger.Printf("./arangoproxy -help for help usage\n\n")
	common.Logger.Printf("Init Setup\n")

	if help {
		common.Logger.Printf("Usage: ...\n")
		os.Exit(0)
	}

	if cleanCache {
		common.Logger.Printf("Deleting Cache\n")
		internal.CleanCache()
	}

	common.Logger.Printf("Setup Done\n---------\n")

}

func main() {
	common.Logger.Printf("Available endpoints:\n - /js\n - /aql\n - /curl\n")
	common.Logger.Printf("Starting Server at %s\n", config.Conf.WebServer)

	internal.StartController(config.Conf.WebServer)
}

var startupBanner = `
      _             _   _   _   _   _         
 /\  |_)  /\  |\ | /__ / \ |_) |_) / \ \/ \_/ 
/--\ | \ /--\ | \| \_| \_/ |   | \ \_/ /\  |  
											 
`
