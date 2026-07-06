package arangosh

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/format"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

func ExecRoutine(example chan map[string]interface{}, outChannel chan string) {
	for {
		select {
		case exampleData := <-example:
			name := exampleData["name"].(string)
			code := exampleData["code"].(string)
			filepath := exampleData["filepath"].(string)
			repository := exampleData["repository"].(models.Repository)

			out := Exec(name, code, filepath, repository)

			// A single long-lived arangosh serves every example for a version.
			// Some examples (e.g. RestBackupRestoreBackup) restart the arangod
			// process, which drops this shared connection. If we see "not
			// connected", reconnect once and retry the example. If the server
			// does not come back, it is gone for good (e.g. a restore that left
			// arangod unable to restart): every remaining example would block on
			// the reconnect timeout and then fail anyway, so abort the whole run
			// immediately instead of wasting CI time. See reconnectSession.
			if isNotConnected(out) {
				models.Logger.Printf("[%s] [WARN] arangosh lost its connection to arangod; reconnecting and retrying", name)
				if reconnectSession(name, repository) {
					out = Exec(name, code, filepath, repository)
				} else {
					models.Logger.Printf("[%s] [FATAL] arangod (%s) is unreachable and could not be recovered; aborting example generation to avoid a cascade of timeouts", name, repository.Url)
					models.Logger.Summary("<li><error code=3><strong>%s</strong> - %s <strong>FATAL: arangod unreachable, aborting generation %s</strong></error>", repository.Version, name, filepath)
					os.Exit(1)
				}
			}

			out = checkAssertionFailed(name, code, out, filepath, repository)
			out = checkArangoError(name, code, out, filepath, repository)

			outChannel <- out
		}
	}
}

// isNotConnected reports whether the arangosh output indicates the client lost
// its connection to arangod (ArangoError 2001). This is never an expected
// example error, so it always signals infrastructure trouble worth recovering.
func isNotConnected(out string) bool {
	return strings.Contains(out, "ArangoError: not connected") || strings.Contains(out, "ArangoError 2001: not connected")
}

// reconnectSession re-establishes the shared arangosh session's connection to
// arangod after the server was restarted (e.g. by a hot-backup restore). The
// arangosh process itself is still alive; only its socket to arangod is gone,
// so a reconnect() on the existing session is enough. It also clears the shared
// `output` global so no stale response leaks into the next example's rendering.
// Returns true once arangod answers again (polling up to 60s), false otherwise.
func reconnectSession(name string, repository models.Repository) bool {
	// arangosh auto-reconnects to its configured endpoint on the next request
	// (V8ClientConnection::acquireConnection re-creates a closed connection), so
	// polling /_api/version until it answers re-establishes the shared session
	// once the restarted arangod is back. No explicit reconnect() needed: there
	// is no auth to redo (ARANGO_NO_AUTH) and the endpoint is unchanged. Also
	// clear the shared `output` global so no stale response leaks into the next
	// example, and report the last error so a server that never returns is
	// distinguishable from a transient blip.
	recovery := `
var __deadline = require("internal").time() + 30;
var __ok = false;
var __lastErr = "no attempt made";
while (require("internal").time() < __deadline) {
  try {
    var __r = internal.arango.GET("/_api/version");
    if (__r && __r.error !== true) { __ok = true; break; }
    __lastErr = "GET /_api/version returned: " + JSON.stringify(__r);
  } catch (__e) {
    __lastErr = String(__e);
  }
  require("internal").wait(0.5);
}
output = "";
print(__ok ? "RECONNECTED" : ("RECONNECT_FAILED: " + __lastErr));
`
	out := Exec(name, recovery, "", repository)
	if strings.Contains(out, "RECONNECTED") {
		models.Logger.Printf("[%s] [INFO] arangosh reconnected to arangod", name)
		return true
	}
	models.Logger.Printf("[%s] [ERROR] arangosh could not reconnect to arangod within 30s (%s): %s", name, repository.Url, strings.TrimSpace(out))
	return false
}

func Exec(exampleName string, code, filepath string, repository models.Repository) (output string) {
	code = format.AdjustCodeForArangosh(code)
	models.Logger.Debug("[%s] [arangosh.Exec] Injecting Code:\n%s", exampleName, code)

	cmd := []byte(code)
	_, err := repository.StdinPipe.Write(cmd)
	if err != nil {
		models.Logger.Printf("WRITE STDINT ERROR %s", err.Error())
	}

	scanner := bufio.NewScanner(repository.StdoutPipe)
	buf := false
	inArangoError := false
	xpError := false
	hide := false

	if strings.Contains(code, "xpError") {
		xpError = true

	}
	for {
		if buf {
			break
		}

		for scanner.Scan() {
			if strings.Contains(scanner.Text(), "EOFD") {
				buf = true
				break
			}

			if scanner.Text() == "\n" {
				inArangoError = false
			}

			if strings.Contains(scanner.Text(), "HIDED-START") {
				hide = true
				continue
			}

			if strings.Contains(scanner.Text(), "HIDED-END") {
				hide = false
				continue
			}

			if hide {
				continue
			}

			if inArangoError {
				continue
			}

			if xpError {
				if strings.Contains(scanner.Text(), "ArangoError") && !inArangoError {
					inArangoError = true
					re := regexp.MustCompile(`(?m)ArangoError.*`)
					output = output + "[" + re.FindString(scanner.Text()) + "]"
					continue
				}
			}

			output = output + scanner.Text() + "\n"
		}
		if buf {
			break
		}
		if err := scanner.Err(); err != nil {
			models.Logger.Printf("[%s] [arangosh.Exec] stdout read error: %v", exampleName, err)
			break
		}
		// EOF or arangosh exited without printing EOFD (e.g. fatal error) — do not spin forever.
		break
	}
	return
}

func checkAssertionFailed(name, code, out, filepath string, repository models.Repository) string {
	if strings.Contains(out, "ASSERTD-FAIL") {
		models.Logger.Printf("[%s] [ERROR]: Assertion Failed", name)
		models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)

		re := regexp.MustCompile(`(?m)ASSERTD-FAIL.*`)
		models.Logger.Summary("<li><error code=3><strong>%s</strong>  - %s <strong> ERROR %s</strong></error>", repository.Version, name, filepath)
		for _, match := range re.FindAllString(out, -1) {
			assertCondition := strings.ReplaceAll(match, "ASSERTD-FAIL ", "")
			models.Logger.Summary("Assertion Failed for condition %s", assertCondition)
		}
		models.Logger.Summary("</li>")

		return "ERRORD"
	}
	return out
}

func checkArangoError(name, code, out, filepath string, repository models.Repository) string {
	if strings.Contains(out, "ERRORD") {
		return out
	}

	if strings.Contains(out, "JavaScript exception") && !strings.Contains(code, "xpError") {
		if strings.Contains(out, "ArangoError 1203") || strings.Contains(out, "ArangoError 1932") {
			return handleCollectionNotFound(name, code, out, filepath, repository)
		} else if strings.Contains(out, "ArangoError 1207") {
			var re = regexp.MustCompile(`(?m)JavaScript.*\n(.+\n)*`)
			out = re.ReplaceAllString(out, "")
			return out
		} else {
			models.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
			models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)

			re := regexp.MustCompile(`(?m)ArangoError.*`)
			if !re.MatchString(out) {
				re = regexp.MustCompile(`(?m)JavaScript exception.*`)
			}

			models.Logger.Summary("<li><error code=3><strong>%s</strong>  - %s <strong> ERROR %s</strong></error>", repository.Version, name, filepath)
			for _, match := range re.FindAllString(out, -1) {
				models.Logger.Summary(match)
			}
			models.Logger.Summary("</li>")

			return "ERRORD"
		}
	}

	return out
}

func handleCollectionNotFound(name, code, out, filepath string, repository models.Repository) string {
	code = notFoundFallbackCode(code, out)
	output := Exec(name, code, filepath, repository)
	if strings.Contains(output, "ArangoError") && !strings.Contains(code, "xpError") {
		models.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
		models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, output)

		re := regexp.MustCompile(`(?m)JavaScript exception.*|ArangoError.*`)
		models.Logger.Summary("<li><error code=3><strong>%s</strong>  - %s <strong> ERROR %s</strong></error>", repository.Version, name, filepath)
		for _, match := range re.FindAllString(out, -1) {
			models.Logger.Summary(match)
		}

		models.Logger.Summary("</li>")

		return "ERRORD"
	}

	return output
}

func notFoundFallbackCode(code, output string) string {
	output = strings.Replace(output, "name: ", "", -1)
	collNotFoundRE := regexp2.MustCompile(`(?m)(?<=collection or view not found: )\w+|(?<=ArangoError: collection )'?\w+`, 0)
	collections := utils.Regexp2FindAllString(collNotFoundRE, output)
	if len(collections) == 0 {
		return ""
	}

	var newCommand string

	for _, collection := range collections {
		collection = strings.Replace(collection, "'", "", -1)
		if strings.Contains(newCommand, fmt.Sprintf("db._create('%s')", collection)) {
			continue
		}

		newCommand = fmt.Sprintf("\n\n\ndb._create('%s')\n%s\ndb._drop('%s')\n\n\n\n", collection, code, collection)

	}

	return newCommand
}
