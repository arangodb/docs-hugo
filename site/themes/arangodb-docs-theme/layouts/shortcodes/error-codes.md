{{- $pageVersion := .Page.Store.Get "versionShort" }}
{{- $dataFolderByVersion := index site.Data $pageVersion }}
{{- $data := index $dataFolderByVersion "errors" }}
{{- $basePage := .Page.RelPermalink }}
{{- range $data }}
{{- if index . "group" }}

### {{ .group }}

{{ else }}
<a name="{{ .code }}" id="{{ .code }}"></a>

#### {{ .code }} - {{ .name }} {#{{ .name }}}

<p>{{ .desc }}</p>
{{- end }}
{{- end }}
