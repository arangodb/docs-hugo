{{- $program := .Get "name" }}
{{- $pageVersion := .Page.Store.Get "versionShort" }}
{{- $dataFolderByVersion := index site.Data $pageVersion }}
{{- $options := index $dataFolderByVersion $program }}
{{- $osMap := dict "linux" "Linux" "macos" "macOS" "windows" "Windows" }}
{{- $componentMap := dict "single" "Single Servers" "dbserver" "DB-Servers" "coordinator" "Coordinators" "agent" "Agents" }}
{{- with $options }}
  {{- $optionsMap := dict }}
  {{- range $name, $option := . }}
    {{- $optionsMap = merge $optionsMap (dict ($option.section | default "General") slice) }}
  {{- end }}
  {{- range $name, $option := . }}
    {{- $section := index $optionsMap ($option.section | default "General") }}
    {{- $oses := slice }}
    {{- range $os := $option.os }}
      {{- $oses = $oses | append (index $osMap $os) }}
    {{- end }}
    {{- $components := slice }}
    {{- range $comp := $option.component }}
      {{- $components = $components | append (index $componentMap $comp) }}
    {{- end }}
    {{- $section = $section | append (merge $option (dict "Name" $name "os" $oses "component" $components)) }}
    {{- $optionsMap = merge $optionsMap (dict ($option.section | default "General") $section) }}
  {{- end }}

  {{- $section := index $optionsMap "General" }}
  {{- if gt ($section | len) 0 }}
    {{- template "render-section" (dict "name" "General" "section" $section) }}
  {{- end }}

  {{- range $name, $section := $optionsMap }}
    {{- if ne $name "General" }}
      {{- template "render-section" (dict "name" $name "section" $section) }}
    {{- end }}
  {{- end }}
{{- end }}

{{- define "render-section" }}
## {{ .name }}

{{ range $option := .section }}
### `--{{ $option.Name }}`

{{ with $option.introducedIn }}
<small>Introduced in: {{ delimit . ", " }}</small>
{{ end }}

{{ with $option.deprecatedIn }}
<small>Deprecated in: {{ delimit . ", " }}</small>
{{ end }}

{{ with $option.enterpriseOnly }}
*Enterprise Edition only*
{{ end }}

**Type**: {{ $option.type }}

{{ $option.description }}

{{ if and (eq $option.requiresValue true ) (ne $option.category "command" )}}
This option can be specified without a value to enable it.
{{ end }}

{{ if eq $option.category "command" }}
This is a command, no value needs to be specified. The process terminates after executing the command.
{{ end }}

{{ with $option.default }}
  {{ if ne $option.category "command"}}
    {{ if $option.dynamic }}
Default: _dynamic_ (e.g. `{{ . }}`)
    {{ else }}{{/* if $option.type is a vector, don't print e.g. [info info] as that is not how would be set by users */}}
Default: `{{ index (slice | append .) 0 }}`
    {{ end }}
  {{ end }}
{{ end }}

{{ with $option.values }}
{{ . }}
{{ end }}

{{ with $option.os }}
  {{ $size := . | len }}
  {{ if lt $size 3}}{{/* needs to be equal to the total number of possible OSes */}}
Available on {{ delimit . ", " " and " }} only.
  {{ end }}
{{ end }}

{{ with $option.component }}
  {{ $size := . | len }}
  {{ if lt $size 4 }}{{/* needs to be equal to the total number of possible components */}}
Effective on {{ delimit . ", " " and " }} only.
  {{ end }}
{{ end }}

{{ with $option.longDescription }}
  {{- partial "shortcodes/expand.html" (dict
    "content" .
    "open"    "open"
    "title"   "Show details"
  ) }}
{{ end }}

---

{{ end }}
{{ end }}
