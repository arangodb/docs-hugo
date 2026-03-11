{{- $pageVersion := .Page.Store.Get "versionShort" | default (partialCached "version-short.html" .Page.RelPermalink .Page.RelPermalink) }}
{{- $dataFolderByVersion := index site.Data $pageVersion }}
{{- $data := index $dataFolderByVersion "exitcodes" }}
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
