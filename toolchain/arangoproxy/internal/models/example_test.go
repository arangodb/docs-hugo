package models

import (
	"reflect"
	"testing"
)

func TestExpectedErrors(t *testing.T) {
	tests := []struct {
		name string
		code string
		want []string
	}{
		{"none", "db._query('RETURN 1');", []string{}},
		{"single", "db._document('c/x'); // expectedError(ERROR_ARANGO_DOCUMENT_NOT_FOUND)", []string{"ERROR_ARANGO_DOCUMENT_NOT_FOUND"}},
		{"spacing", "x(); //expectedError( ERROR_A )", []string{"ERROR_A"}},
		{"multiple without duplicates", "a(); // expectedError(ERROR_A)\nb(); // expectedError(ERROR_B)\nc(); // expectedError(ERROR_A)", []string{"ERROR_A", "ERROR_B"}},
		{"AQL comment in a string literal", `__docsQuery(db._query("RETURN 1 + // expectedError(ERROR_QUERY_PARSE)"));`, []string{"ERROR_QUERY_PARSE"}},
		{"old name is not supported", "x(); // xpError(ERROR_A)", []string{}},
		{"empty name is reported as unknown", "x(); // expectedError()", []string{""}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := ExpectedErrors(test.code); !reflect.DeepEqual(got, test.want) {
				t.Errorf("ExpectedErrors() = %#v, want %#v", got, test.want)
			}
		})
	}
}

func TestFormatResponseRemovesExpectedErrorComments(t *testing.T) {
	response := ExampleResponse{Input: "db.c.save(\n  {_key: \"a\"}\n); // expectedError(ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED)\nprint(1);"}
	FormatResponse(&response)
	want := "db.c.save(\n  {_key: \"a\"}\n);\nprint(1);"
	if response.Input != want {
		t.Errorf("FormatResponse()\n got: %q\nwant: %q", response.Input, want)
	}
}

func TestExpectedWarnings(t *testing.T) {
	code := "RETURN [\n  JSON_PARSE(\"{\"), // expectedWarning(ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH)\n  1 / 0 // expectedWarning( ERROR_QUERY_DIVISION_BY_ZERO )\n] // expectedError(ERROR_X)"
	want := []string{"ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH", "ERROR_QUERY_DIVISION_BY_ZERO"}
	if got := ExpectedWarnings(code); !reflect.DeepEqual(got, want) {
		t.Errorf("ExpectedWarnings() = %#v, want %#v", got, want)
	}
	if got := ExpectedErrors(code); !reflect.DeepEqual(got, []string{"ERROR_X"}) {
		t.Errorf("ExpectedErrors() = %#v, want only the error", got)
	}
}

func TestFormatResponseRemovesExpectedWarningComments(t *testing.T) {
	response := ExampleResponse{Input: "RETURN JSON_PARSE(\"{\") // expectedWarning(ERROR_QUERY_FUNCTION_ARGUMENT_TYPE_MISMATCH)"}
	FormatResponse(&response)
	if want := "RETURN JSON_PARSE(\"{\")"; response.Input != want {
		t.Errorf("FormatResponse()\n got: %q\nwant: %q", response.Input, want)
	}
}
