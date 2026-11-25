package utils

import (
	"encoding/json"
	"fmt"
)

// Markers are the lines that arangosh prints for arangoproxy around and within
// the output of examples, and the value that replaces the output of a failed
// example. The ## make them invalid in JavaScript and AQL, so that they don't
// collide with names in the example code, and unlikely in the output.
//
// arangosh gets them as the __docsMarker object (see GetCommonFunctions). The
// markers with a value after them (e.g. MarkerWarnings) are followed by a space.
const (
	// End of the output of the code sent to arangosh
	MarkerEOF = "##EOF##"
	// Output of hidden code (lines starting with ~) in between
	MarkerHideStart = "##HIDE-START##"
	MarkerHideEnd   = "##HIDE-END##"
	// A failed assert() in an example
	MarkerAssertFail = "##ASSERT-FAIL##"
	// The warnings of an AQL query (__docsQuery in common.js)
	MarkerWarnings = "##WARNINGS##"
	// The resources removed after an example (__docsCleanup in common.js)
	MarkerCleaned = "##CLEANED##"
	// The resources removed after a page (__docsPageDone in common.js)
	MarkerPageDone = "##PAGE-DONE##"
	// The error numbers of the errors that an example expects
	MarkerExpectedErrors = "##EXPECTED-ERRORS##"
	// An exception of an example that expects errors (added by arangoproxy)
	MarkerThrown = "##THROWN##"
	// A request and a response of an HTTP API example
	MarkerRequest     = "##REQ##"
	MarkerRequestEnd  = "##END-REQ##"
	MarkerResponse    = "##RESP##"
	MarkerResponseEnd = "##END-RESP##"
	// Result of reconnecting arangosh after a server restart
	MarkerReconnected     = "##RECONNECTED##"
	MarkerReconnectFailed = "##RECONNECT-FAILED##"
	// Replaces the output of a failed example, which isn't cached. Also checked
	// by the examples/example.html partial of the theme.
	MarkerError = "##ERROR##"
)

// markersJS defines the markers in arangosh as __docsMarker.Name
func markersJS() string {
	markers, _ := json.Marshal(map[string]string{
		"EOF":             MarkerEOF,
		"HideStart":       MarkerHideStart,
		"HideEnd":         MarkerHideEnd,
		"AssertFail":      MarkerAssertFail,
		"Warnings":        MarkerWarnings,
		"Cleaned":         MarkerCleaned,
		"PageDone":        MarkerPageDone,
		"Request":         MarkerRequest,
		"RequestEnd":      MarkerRequestEnd,
		"Response":        MarkerResponse,
		"ResponseEnd":     MarkerResponseEnd,
		"Reconnected":     MarkerReconnected,
		"ReconnectFailed": MarkerReconnectFailed,
	})
	return fmt.Sprintf("var __docsMarker = %s;\n", markers)
}
