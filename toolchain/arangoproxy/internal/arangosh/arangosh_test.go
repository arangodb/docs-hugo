package arangosh

import (
	"testing"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
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
			if failed := got == "ERRORD"; failed != test.failed {
				t.Errorf("checkExpectedErrors() failed = %v, want %v", failed, test.failed)
			}
		})
	}

	if got := checkExpectedErrors("example", []string{"ERROR_ARANGO_CONFLICT"}, "", nil, "output", "page.md", repository); got != "ERRORD" {
		t.Errorf("checkExpectedErrors() without resolved error codes did not fail")
	}
}

func TestExtractWarnings(t *testing.T) {
	out, warnings := ExtractWarnings("WARNINGS [{\"code\":1562,\"message\":\"division by zero\"}]\n[ \n  null \n]\n")
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
