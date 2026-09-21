package format

import (
	"reflect"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestConvertAdmonitions(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "no admonition is left unchanged",
			in:   "Returns the collection.\n\n    indented code\n",
			want: "Returns the collection.\n\n    indented code\n",
		},
		{
			name: "single paragraph",
			in:   "Deletes the collection.\n{{< warning >}}\nThis cannot be undone.\n{{< /warning >}}\nThe collection must exist.",
			want: "Deletes the collection.\n\n> **WARNING**\n>\n> This cannot be undone.\n\nThe collection must exist.",
		},
		{
			name: "multiple paragraphs with a list and a fenced code block",
			in:   "Intro.\n\n{{< info >}}\nFirst paragraph.\n\nSecond one, see [Backups](https://example.com):\n\n- one\n- two\n\n```js\ndb._drop(\"coll\");\n```\n{{< /info >}}\n\nOutro.",
			want: "Intro.\n\n> **INFO**\n>\n> First paragraph.\n>\n> Second one, see [Backups](https://example.com):\n>\n> - one\n> - two\n>\n> ```js\n> db._drop(\"coll\");\n> ```\n\nOutro.",
		},
		{
			name: "indented code block in the body",
			in:   "{{< tip >}}\nUse a query:\n\n    RETURN 1\n\nThat is all.\n{{< /tip >}}",
			want: "> **TIP**\n>\n> Use a query:\n>\n>     RETURN 1\n>\n> That is all.",
		},
		{
			name: "tab indented code block in the body becomes spaces",
			in:   "{{< tip >}}\nUse a query:\n\n\tRETURN 1\n{{< /tip >}}",
			want: "> **TIP**\n>\n> Use a query:\n>\n>     RETURN 1",
		},
		{
			name: "mixed tabs and spaces are normalized to columns",
			in:   "{{< info >}}\nText:\n\n \t  deeper\n    even\n{{< /info >}}",
			want: "> **INFO**\n>\n> Text:\n>\n>       deeper\n>     even",
		},
		{
			name: "uniformly indented body is deindented like Hugo does",
			in:   "{{< info >}}\n    RETURN 1\n{{< /info >}}",
			want: "> **INFO**\n>\n> RETURN 1",
		},
		{
			name: "inline on a single line",
			in:   "The name of the collection. {{< info >}}Names are case-sensitive.{{< /info >}}",
			want: "The name of the collection.\n\n> **INFO**\n>\n> Names are case-sensitive.",
		},
		{
			name: "inside a list item keeps the list indentation",
			in:   "- item one:\n  {{< info >}}\n  A note.\n\n      RETURN 1\n  {{< /info >}}\n- item two",
			want: "- item one:\n\n  > **INFO**\n  >\n  > A note.\n  >\n  >     RETURN 1\n\n- item two",
		},
		{
			name: "nested admonitions are quoted twice",
			in:   "{{< info >}}\nOuter.\n{{< warning >}}\nInner.\n{{< /warning >}}\nStill outer.\n{{< /info >}}",
			want: "> **INFO**\n>\n> Outer.\n>\n> > **WARNING**\n> >\n> > Inner.\n>\n> Still outer.",
		},
		{
			name: "adjacent admonitions stay separate",
			in:   "Text.\n{{< warning >}}\nOne.\n{{< /warning >}}\n{{< security >}}\nTwo.\n{{< /security >}}\nEnd.",
			want: "Text.\n\n> **WARNING**\n>\n> One.\n\n> **SECURITY**\n>\n> Two.\n\nEnd.",
		},
		{
			name: "danger keeps blank lines of the body",
			in:   "{{< danger >}}\nOne.\n\nTwo.\n{{< /danger >}}",
			want: "> **DANGER**\n>\n> One.\n>\n> Two.",
		},
		{
			name: "comment is dropped with its body",
			in:   "Kept.\n{{< comment >}}\nInternal remark.\n\nWith two paragraphs.\n{{< /comment >}}\nAlso kept.",
			want: "Kept.\n\nAlso kept.",
		},
		{
			name: "inline comment is dropped without splitting the paragraph",
			in:   "Kept {{< comment >}}dropped{{< /comment >}}and kept.",
			want: "Kept and kept.",
		},
		{
			name: "comment inside an admonition",
			in:   "{{< warning >}}\nShown.\n{{< comment >}}\nHidden.\n{{< /comment >}}\nAlso shown.\n{{< /warning >}}",
			want: "> **WARNING**\n>\n> Shown.\n>\n> Also shown.",
		},
		{
			name: "indented block after an admonition keeps its indentation",
			in:   "Text:\n{{< info >}}\nA note.\n{{< /info >}}\n    RETURN 1",
			want: "Text:\n\n> **INFO**\n>\n> A note.\n\n    RETURN 1",
		},
		{
			name: "hard line break of the body is preserved",
			in:   "{{< info >}}\nfirst  \nsecond\n{{< /info >}}",
			want: "> **INFO**\n>\n> first  \n> second",
		},
		{
			name: "unbalanced marker is left for the leftover check",
			in:   "Text.\n{{< warning >}}\nNo closing marker.",
			want: "Text.\n{{< warning >}}\nNo closing marker.",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := ConvertAdmonitions(test.in); got != test.want {
				t.Errorf("ConvertAdmonitions()\n got: %q\nwant: %q", got, test.want)
			}
		})
	}
}

func TestEditDescriptions(t *testing.T) {
	formatter := OpenapiFormatter{}
	spec := map[string]interface{}{
		"paths": map[string]interface{}{
			"/_api/collection/{name}": map[string]interface{}{
				"delete": map[string]interface{}{
					"summary":     "Drop a collection",
					"description": "Drops it.\n{{< warning >}}\nGone forever.\n{{< /warning >}}\n",
					"parameters": []interface{}{
						map[string]interface{}{
							"name":        "name",
							"description": "{{< info >}}\nCase-sensitive.\n{{< /info >}}\n",
							"schema": map[string]interface{}{
								"type":    "string",
								"example": "{{< info >}}not a description{{< /info >}}",
							},
						},
					},
				},
			},
		},
	}

	formatter.EditDescriptions(spec)

	operation := spec["paths"].(map[string]interface{})["/_api/collection/{name}"].(map[string]interface{})["delete"].(map[string]interface{})
	if got, want := operation["description"], "Drops it.\n\n> **WARNING**\n>\n> Gone forever."; got != want {
		t.Errorf("description\n got: %q\nwant: %q", got, want)
	}
	if got, want := operation["summary"], "Drop a collection"; got != want {
		t.Errorf("summary\n got: %q\nwant: %q", got, want)
	}

	parameter := operation["parameters"].([]interface{})[0].(map[string]interface{})
	if got, want := parameter["description"], "> **INFO**\n>\n> Case-sensitive."; got != want {
		t.Errorf("parameter description\n got: %q\nwant: %q", got, want)
	}
	schema := parameter["schema"].(map[string]interface{})
	if got, want := schema["example"], "{{< info >}}not a description{{< /info >}}"; got != want {
		t.Errorf("only descriptions and summaries are converted\n got: %q\nwant: %q", got, want)
	}
}

func TestLeftoverShortcodes(t *testing.T) {
	formatter := OpenapiFormatter{}
	tests := []struct {
		name string
		spec map[string]interface{}
		want []string
	}{
		{
			name: "converted admonitions leave nothing behind",
			spec: map[string]interface{}{"description": "Text.\n{{< warning >}}\nBody.\n{{< /warning >}}\n"},
			want: []string{},
		},
		{
			name: "unsupported shortcodes are reported",
			spec: map[string]interface{}{
				"description": "See {{< tag \"ArangoDB Platform\" >}} and {{% details %}}x{{% /details %}}.",
				"parameters":  []interface{}{map[string]interface{}{"description": "Also {{< tag \"ArangoDB Platform\" >}}."}},
			},
			want: []string{"{{< tag \"ArangoDB Platform\" >}}", "{{% details %}}", "{{% /details %}}"},
		},
		{
			name: "unbalanced admonition markers are reported",
			spec: map[string]interface{}{"description": "{{< warning >}}\nNo closing marker."},
			want: []string{"{{< warning >}}"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			formatter.EditDescriptions(test.spec)
			got := formatter.LeftoverShortcodes(test.spec)
			if len(got) != len(test.want) {
				t.Fatalf("LeftoverShortcodes()\n got: %q\nwant: %q", got, test.want)
			}
			gotSet := map[string]bool{}
			for _, shortcode := range got {
				gotSet[shortcode] = true
			}
			for _, shortcode := range test.want {
				if !gotSet[shortcode] {
					t.Errorf("LeftoverShortcodes() missing %q, got %q", shortcode, got)
				}
			}
		})
	}
}

func TestSplitIndent(t *testing.T) {
	tests := []struct {
		line        string
		wantColumns int
		wantRest    string
	}{
		{"text", 0, "text"},
		{"    text", 4, "text"},
		{"\ttext", 4, "text"},
		{" \ttext", 4, "text"},
		{"\t text", 5, "text"},
		{"   \ttext", 4, "text"},
		{"     ", 5, ""},
		{"", 0, ""},
	}
	for _, test := range tests {
		columns, rest := splitIndent(test.line)
		if columns != test.wantColumns || rest != test.wantRest {
			t.Errorf("splitIndent(%q) = (%d, %q), want (%d, %q)", test.line, columns, rest, test.wantColumns, test.wantRest)
		}
	}
	if !reflect.DeepEqual(deindentLines([]string{"  a", "      b", ""}), []string{"a", "    b", ""}) {
		t.Error("deindentLines() did not remove the common indentation")
	}
}

// TestEditDescriptionsOfYamlBlock covers the interaction with the YAML block
// scalars that the descriptions of an openapi code block are written in
func TestEditDescriptionsOfYamlBlock(t *testing.T) {
	block := `
paths:
  /_api/collection/{name}:
    delete:
      operationId: deleteCollection
      description: |
        Drops the collection.
        {{< warning >}}
        Dropping a collection cannot be undone.

        Take a backup first:

            arangodump --collection coll

        See [Hot Backups](https://docs.arango.ai/stable/operations/backup-and-restore/).
        {{< /warning >}}
        The collection must exist.
`
	spec := make(map[string]interface{})
	if err := yaml.Unmarshal([]byte(block), &spec); err != nil {
		t.Fatalf("Unmarshal() failed: %s", err.Error())
	}

	OpenapiFormatter{}.EditDescriptions(spec)

	operation := spec["paths"].(map[string]interface{})["/_api/collection/{name}"].(map[string]interface{})["delete"].(map[string]interface{})
	want := "Drops the collection.\n\n" +
		"> **WARNING**\n>\n" +
		"> Dropping a collection cannot be undone.\n>\n" +
		"> Take a backup first:\n>\n" +
		">     arangodump --collection coll\n>\n" +
		"> See [Hot Backups](https://docs.arango.ai/stable/operations/backup-and-restore/).\n\n" +
		"The collection must exist."
	if got := operation["description"]; got != want {
		t.Errorf("description\n got: %q\nwant: %q", got, want)
	}
}
