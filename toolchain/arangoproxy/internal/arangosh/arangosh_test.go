package arangosh

import (
	"strings"
	"testing"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func TestCheckExpectedErrors(t *testing.T) {
	repository := models.Repository{Version: "test"}
	codes := `{"ERROR_ARANGO_CONFLICT":1200,"ERROR_ARANGO_DOCUMENT_NOT_FOUND":1202,"ERROR_TYPO":null}`

	tests := []struct {
		name     string
		expected []string
		thrown   []string
		failed   bool
	}{
		{"expected error occurs", []string{"ERROR_ARANGO_CONFLICT"}, []string{"1200 ArangoError 1200: conflict"}, false},
		{"expected error occurs repeatedly", []string{"ERROR_ARANGO_CONFLICT"}, []string{"1200 ArangoError 1200: conflict", "1200 ArangoError 1200: conflict"}, false},
		{"multiple expected errors occur", []string{"ERROR_ARANGO_CONFLICT", "ERROR_ARANGO_DOCUMENT_NOT_FOUND"}, []string{"1202 ArangoError 1202: not found", "1200 ArangoError 1200: conflict"}, false},
		{"different error occurs", []string{"ERROR_ARANGO_CONFLICT"}, []string{"1203 ArangoError 1203: collection or view not found"}, true},
		{"additional error occurs", []string{"ERROR_ARANGO_CONFLICT"}, []string{"1200 ArangoError 1200: conflict", "1202 ArangoError 1202: not found"}, true},
		{"JavaScript error occurs", []string{"ERROR_ARANGO_CONFLICT"}, []string{"1200 ArangoError 1200: conflict", "0 ReferenceError: x is not defined"}, true},
		{"expected error does not occur", []string{"ERROR_ARANGO_CONFLICT"}, []string{}, true},
		{"one of the expected errors does not occur", []string{"ERROR_ARANGO_CONFLICT", "ERROR_ARANGO_DOCUMENT_NOT_FOUND"}, []string{"1200 ArangoError 1200: conflict"}, true},
		{"unknown error name", []string{"ERROR_TYPO"}, []string{"1200 ArangoError 1200: conflict"}, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := checkExpectedErrors("example", test.expected, codes, test.thrown, "output", "page.md", repository)
			if failed := got == utils.MarkerError; failed != test.failed {
				t.Errorf("checkExpectedErrors() failed = %v, want %v", failed, test.failed)
			}
		})
	}

	if got := checkExpectedErrors("example", []string{"ERROR_ARANGO_CONFLICT"}, "", nil, "output", "page.md", repository); got != utils.MarkerError {
		t.Errorf("checkExpectedErrors() without resolved error codes did not fail")
	}
}

func TestExtractWarnings(t *testing.T) {
	out, warnings := ExtractWarnings(utils.MarkerWarnings + " [{\"code\":1562,\"message\":\"division by zero\"}]\n[ \n  null \n]\n")
	if out != "[ \n  null \n]\n" {
		t.Errorf("ExtractWarnings() output = %q", out)
	}
	want := "[\n  {\n    \"code\": 1562,\n    \"message\": \"division by zero\"\n  }\n]"
	if warnings != want {
		t.Errorf("ExtractWarnings() warnings\n got: %s\nwant: %s", warnings, want)
	}

	out, warnings = ExtractWarnings("[ \n  1 \n]\n")
	if out != "[ \n  1 \n]\n" || warnings != "" {
		t.Errorf("ExtractWarnings() without warnings = %q, %q", out, warnings)
	}
}

func TestCheckExpectedWarnings(t *testing.T) {
	repository := models.Repository{Version: "test"}
	codes := `{"ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH":1542,"ERROR_BAD_PARAMETER":10,"ERROR_TYPO":null}`
	mismatch := `{"code":1542,"message":"invalid argument type in call to function 'JSON_PARSE()'"}`
	badParameter := `{"code":10,"message":"bad parameter"}`
	output := func(warnings ...string) string {
		out := "[ \n  null \n]\n"
		if len(warnings) > 0 {
			out = utils.MarkerWarnings + " [" + strings.Join(warnings, ",") + "]\n" + out
		}
		return out
	}

	tests := []struct {
		name     string
		expected []string
		out      string
		failed   bool
	}{
		{"no warnings, none expected", nil, output(), false},
		{"expected warning occurs", []string{"ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH"}, output(mismatch), false},
		{"expected warning occurs repeatedly", []string{"ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH"}, output(mismatch, mismatch), false},
		{"multiple expected warnings occur", []string{"ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH", "ERROR_BAD_PARAMETER"}, output(badParameter, mismatch), false},
		{"undeclared warning", nil, output(mismatch), true},
		{"additional warning", []string{"ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH"}, output(mismatch, badParameter), true},
		{"expected warning does not occur", []string{"ERROR_BAD_PARAMETER"}, output(), true},
		{"unknown warning name", []string{"ERROR_TYPO"}, output(mismatch), true},
		{"already failed", nil, utils.MarkerError, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := checkExpectedWarnings("example", test.expected, codes, test.out, "page.md", repository)
			if failed := got == utils.MarkerError; failed != test.failed {
				t.Errorf("checkExpectedWarnings() failed = %v, want %v", failed, test.failed)
			}
			if !test.failed && got != test.out {
				t.Errorf("checkExpectedWarnings() changed the output to %q", got)
			}
		})
	}
}
