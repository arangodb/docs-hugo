package arangosh

import (
	"bufio"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/format"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

// Job is an example to run in the arangosh process of a repository
type Job struct {
	Name, Code, Filepath string
	Repository           models.Repository
	Reply                chan string
}

// The examples run one at a time (a single routine for all repositories)
var queue = make(chan Job)

func StartRoutine() {
	go ExecRoutine(queue)
}

// Run queues an example and returns its output once it ran
func Run(name, code, filepath string, repository models.Repository) string {
	reply := make(chan string, 1)
	queue <- Job{name, code, filepath, repository, reply}
	return <-reply
}

func ExecRoutine(queue chan Job) {
	for job := range queue {
		name, code, filepath, repository := job.Name, job.Code, job.Filepath, job.Repository

		// The handlers log "Queued" when they receive a request, this is where an
		// example actually runs
		models.Logger.Printf("[EXEC] Running %s %s example %s", repository.Version, repository.Type, name)
		start := time.Now()
		// Hidden lines before and after the example (in the same exchange with
		// arangosh): the page for exemptions, and the cleanup (see common.js)
		page, _ := json.Marshal(pageOf(filepath))
		// The numbers of the expected errors, resolved by arangosh (see
		// checkExpectedErrors)
		expectedErrors := models.ExpectedErrors(code)
		resolveErrors := ""
		if len(expectedErrors) > 0 {
			names, _ := json.Marshal(expectedErrors)
			resolveErrors = fmt.Sprintf("\n~print(%q + JSON.stringify(__docsErrorCodes(%s)));", expectedErrorsMarker, names)
		}
		execCode := fmt.Sprintf("~__docsPage = %s;%s\n%s\n~__docsCleanup();", page, resolveErrors, code)
		out := Exec(name, execCode, filepath, repository)

		// A single long-lived arangosh serves every example for a version.
		// Some examples (e.g. RestBackupRestoreBackup) restart the arangod
		// process, which drops this shared connection. If we see "not
		// connected", reconnect once and retry the example. If the server
		// does not come back, it is gone for good (e.g. a restore that left
		// arangod unable to restart): every remaining example would block on
		// the reconnect timeout and then fail anyway, so abort the whole run
		// immediately instead of wasting CI time. See reconnectSession.
		if isNotConnected(out) {
			models.Logger.Printf("[%s %s] [WARN] arangosh lost its connection to arangod; reconnecting and retrying", repository.Version, name)
			if reconnectSession(name, repository) {
				out = Exec(name, execCode, filepath, repository)
			} else {
				models.Logger.Printf("[%s %s] [FATAL] arangod (%s) is unreachable and could not be recovered; aborting example generation to avoid a cascade of timeouts", repository.Version, name, repository.Url)
				models.Logger.Error("Examples", repository.Version, name, filepath, "arangod is unreachable and could not be recovered, aborted the example generation")
				models.Exit(1)
			}
		}

		out, cleaned := extractMarker(out, cleanedMarker)
		if cleaned != "" {
			models.Logger.Printf("[%s %s] [INFO] Removed after the example: %s", repository.Version, name, cleaned)
		}
		out, errorCodes := extractMarker(out, expectedErrorsMarker)
		out, thrown := extractMarkers(out, thrownMarker)
		out = checkAssertionFailed(name, code, out, filepath, repository)
		if len(expectedErrors) > 0 {
			out = checkExpectedErrors(name, expectedErrors, errorCodes, thrown, out, filepath, repository)
		} else {
			out = checkArangoError(name, code, out, filepath, repository)
		}

		models.Logger.Printf("[EXEC] Finished %s %s example %s in %d ms", repository.Version, repository.Type, name, time.Since(start).Milliseconds())
		job.Reply <- out
	}
}

// Output lines of the hidden code that arangoproxy runs around examples
const cleanedMarker = "CLEANED "
const pageDoneMarker = "PAGEDONE "
const expectedErrorsMarker = "EXPECTEDERRORS "

// Output line that Exec adds for every exception of an example that expects
// errors: the error number (0 if it's not an ArangoError) and the message
const thrownMarker = "THROWN "

// The first line of an exception that arangosh prints, e.g.
// JavaScript exception in file '...' at 92,9: ArangoError 1210: unique constraint violated ...
// JavaScript exception: ReferenceError: undefinedFunction is not defined
// The lines that follow (source excerpt, stacktrace) end with an empty line.
var exceptionRE = regexp.MustCompile(`^JavaScript exception(?: in file '[^']*' at \d+,\d+)?: (.*)$`)
var arangoErrorRE = regexp.MustCompile(`^ArangoError (\d+): `)

// extractMarker removes the output line with the marker from the output and
// returns it separately (without the marker)
func extractMarker(out, marker string) (string, string) {
	out, found := extractMarkers(out, marker)
	if len(found) == 0 {
		return out, ""
	}
	return out, found[len(found)-1]
}

// extractMarkers removes all output lines with the marker from the output and
// returns them separately (without the marker)
func extractMarkers(out, marker string) (string, []string) {
	found := []string{}
	lines := []string{}
	for _, line := range strings.Split(out, "\n") {
		if value, ok := strings.CutPrefix(line, marker); ok {
			found = append(found, value)
			continue
		}
		lines = append(lines, line)
	}
	return strings.Join(lines, "\n"), found
}

// ExtractWarnings removes the warnings line of an AQL example (__docsQuery in
// common.js) from the output and returns the warnings as indented JSON
func ExtractWarnings(out string) (string, string) {
	out, warnings := extractMarker(out, "WARNINGS ")
	if warnings == "" {
		return out, ""
	}
	var parsed interface{}
	if err := json.Unmarshal([]byte(warnings), &parsed); err != nil {
		return out, warnings
	}
	indented, _ := json.MarshalIndent(parsed, "", "  ")
	return out, string(indented)
}

// pageOf returns the source file of a code block position (file:line:column)
func pageOf(position string) string {
	return regexp.MustCompile(`:\d+:\d+$`).ReplaceAllString(position, "")
}

// PageDone removes the exemptions that the examples of a page added but didn't
// remove, together with the exempted resources (__docsPageDone in common.js). It
// runs through the queue, i.e. after the examples of the page.
func PageDone(page string, repository models.Repository) {
	code, _ := json.Marshal(page)
	out := Run("page done "+page, fmt.Sprintf("__docsPageDone(%s);", code), page, repository)
	if _, left := extractMarker(out, pageDoneMarker); left != "" {
		models.Logger.Printf("[%s %s] [INFO] Removed at the end of the page (exempted but not removed by its examples): %s", repository.Version, page, left)
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
		models.Logger.Printf("[%s %s] [INFO] arangosh reconnected to arangod", repository.Version, name)
		return true
	}
	models.Logger.Printf("[%s %s] [ERROR] arangosh could not reconnect to arangod within 30s (%s): %s", repository.Version, name, repository.Url, strings.TrimSpace(out))
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
	// Within the lines of an exception (until the next empty line)
	inException := false
	// Examples that expect errors show exceptions in a short form, and every
	// exception is reported with a marker line for checkExpectedErrors
	expectsErrors := len(models.ExpectedErrors(code)) > 0
	hide := false

	for {
		if buf {
			break
		}

		for scanner.Scan() {
			if strings.Contains(scanner.Text(), "EOFD") {
				buf = true
				break
			}

			if inException {
				if scanner.Text() == "" {
					inException = false
					output = output + "\n"
				}
				continue
			}

			if strings.Contains(scanner.Text(), "HIDED-START") {
				hide = true
				continue
			}

			if strings.Contains(scanner.Text(), "HIDED-END") {
				hide = false
				continue
			}

			// The cleanup and the resolution of expected errors run as hidden
			// code but their results are needed
			if strings.HasPrefix(scanner.Text(), cleanedMarker) || strings.HasPrefix(scanner.Text(), pageDoneMarker) || strings.HasPrefix(scanner.Text(), expectedErrorsMarker) {
				output = output + scanner.Text() + "\n"
				continue
			}

			if hide {
				continue
			}

			if expectsErrors {
				if match := exceptionRE.FindStringSubmatch(scanner.Text()); match != nil {
					inException = true
					message := match[1]
					number := "0"
					if arangoError := arangoErrorRE.FindStringSubmatch(message); arangoError != nil {
						number = arangoError[1]
						// Shown in the output, the rest of the exception is skipped
						output = output + "[" + message + "]"
					}
					output = output + "\n" + thrownMarker + number + " " + message + "\n"
					continue
				}
			}

			output = output + scanner.Text() + "\n"
		}
		if buf {
			break
		}
		if err := scanner.Err(); err != nil {
			models.Logger.Printf("[%s %s] [arangosh.Exec] stdout read error: %v", repository.Version, exampleName, err)
			break
		}
		// EOF or arangosh exited without printing EOFD (e.g. fatal error) — do not spin forever.
		break
	}
	return
}

func checkAssertionFailed(name, code, out, filepath string, repository models.Repository) string {
	if strings.Contains(out, "ASSERTD-FAIL") {
		models.Logger.Printf("[%s %s] [ERROR]: Assertion Failed", repository.Version, name)
		models.Logger.Printf("[%s %s] [ERROR]: Command output: %s", repository.Version, name, out)

		re := regexp.MustCompile(`(?m)ASSERTD-FAIL.*`)
		conditions := []string{}
		for _, match := range re.FindAllString(out, -1) {
			conditions = append(conditions, "Assertion failed: "+strings.ReplaceAll(match, "ASSERTD-FAIL ", ""))
		}
		models.Logger.Error("Examples", repository.Version, name, filepath, strings.Join(conditions, "\n"))

		return "ERRORD"
	}
	return out
}

// checkExpectedErrors fails an example that declares errors with
// `// expectedError(ERROR_NAME)` comments if one of the names is unknown, if an
// exception occurs that isn't one of the declared errors, or if a declared error
// doesn't occur. The check is for the whole example, not per statement, so that
// it works for statements that span multiple lines.
// codes is the JSON object with the error numbers by name (__docsErrorCodes in
// common.js), thrown the exceptions (number and message) recorded by Exec.
func checkExpectedErrors(name string, expected []string, codes string, thrown []string, out, filepath string, repository models.Repository) string {
	if strings.Contains(out, "ERRORD") {
		return out
	}

	problems := []string{}
	numbers := map[string]*int{}
	if err := json.Unmarshal([]byte(codes), &numbers); err != nil {
		problems = append(problems, fmt.Sprintf("Could not resolve the expected errors %v: %q", expected, codes))
	}

	expectedNumbers := map[int]string{}
	for _, errorName := range expected {
		if number, ok := numbers[errorName]; ok && number != nil {
			expectedNumbers[*number] = errorName
		} else if len(numbers) > 0 {
			problems = append(problems, fmt.Sprintf("Unknown error name in expectedError(%s)", errorName))
		}
	}

	occurred := map[int]bool{}
	for _, exception := range thrown {
		numberText, message, _ := strings.Cut(exception, " ")
		number := 0
		fmt.Sscanf(numberText, "%d", &number)
		if _, ok := expectedNumbers[number]; ok && number != 0 {
			occurred[number] = true
			continue
		}
		problems = append(problems, "Unexpected error: "+message)
	}

	for _, errorName := range expected {
		if number, ok := numbers[errorName]; ok && number != nil && !occurred[*number] {
			problems = append(problems, fmt.Sprintf("Expected error did not occur: %s (%d)", errorName, *number))
		}
	}

	if len(problems) > 0 {
		models.Logger.Printf("[%s %s] [ERROR]: %s", repository.Version, name, strings.Join(problems, "; "))
		models.Logger.Printf("[%s %s] [ERROR]: Command output: %s", repository.Version, name, out)
		models.Logger.Error("Examples", repository.Version, name, filepath, strings.Join(problems, "\n"))
		return "ERRORD"
	}

	return out
}

func checkArangoError(name, code, out, filepath string, repository models.Repository) string {
	if strings.Contains(out, "ERRORD") {
		return out
	}

	if strings.Contains(out, "JavaScript exception") {
		if strings.Contains(out, "ArangoError 1203") || strings.Contains(out, "ArangoError 1932") {
			return handleCollectionNotFound(name, code, out, filepath, repository)
		} else if strings.Contains(out, "ArangoError 1207") {
			var re = regexp.MustCompile(`(?m)JavaScript.*\n(.+\n)*`)
			out = re.ReplaceAllString(out, "")
			return out
		} else {
			models.Logger.Printf("[%s %s] [ERROR]: Found ArangoError without expectedError", repository.Version, name)
			models.Logger.Printf("[%s %s] [ERROR]: Command output: %s", repository.Version, name, out)

			re := regexp.MustCompile(`(?m)ArangoError.*`)
			if !re.MatchString(out) {
				re = regexp.MustCompile(`(?m)JavaScript exception.*`)
			}

			models.Logger.Error("Examples", repository.Version, name, filepath, "Unexpected error (no expectedError):\n"+strings.Join(re.FindAllString(out, -1), "\n"))

			return "ERRORD"
		}
	}

	return out
}

func handleCollectionNotFound(name, code, out, filepath string, repository models.Repository) string {
	code = notFoundFallbackCode(code, out)
	output := Exec(name, code, filepath, repository)
	if strings.Contains(output, "ArangoError") {
		models.Logger.Printf("[%s %s] [ERROR]: Found ArangoError without expectedError", repository.Version, name)
		models.Logger.Printf("[%s %s] [ERROR]: Command output: %s", repository.Version, name, output)

		re := regexp.MustCompile(`(?m)JavaScript exception.*|ArangoError.*`)
		models.Logger.Error("Examples", repository.Version, name, filepath, "Unexpected error (no expectedError):\n"+strings.Join(re.FindAllString(output, -1), "\n"))

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
