{{- $componentMap := dict "single" "Single Servers" "dbserver" "DB-Servers" "coordinator" "Coordinators" "agent" "Agents" }}
{{- $pageVersion := .Page.Store.Get "versionShort" }}
{{- $dataFolderByVersion := index site.Data $pageVersion }}
{{- $allMetricsFile := index $dataFolderByVersion "allMetrics" }}
{{- if not $allMetricsFile }}{{ errorf "Could not find %q in %q data folder" "allMetrics" $pageVersion}}{{ end }}
{{- $metricGroups := newScratch }}
{{- range $metric := $allMetricsFile }}
  {{- $metricsFromCategory := index ($metricGroups.Get "metrics") $metric.category | default slice }}
  {{- $metricGroups.SetInMap "metrics" $metric.category ($metricsFromCategory | append $metric) }}
{{- end }}
{{- range $category, $metricGroup := $metricGroups.Get "metrics" }}{{/* Seems to get sorted implicitly */}}

### {{ $category }}

{{ range $metric := $metricGroup }}

#### {{ strings.TrimRight "." $metric.help }}

{{ if eq $metric.type "histogram" -}}
`{{ $metric.name }}` (basename)<br>
`{{ $metric.name }}_bucket`<br>
`{{ $metric.name }}_sum`<br>
`{{ $metric.name }}_count`
{{ else if eq $metric.type "summary" -}}
`{{ $metric.name }}` (basename)<br>
`{{ $metric.name }}_sum`<br>
`{{ $metric.name }}_count`
{{ else -}}
`{{ $metric.name }}`
{{ end }}

{{ $metric.description }}

{{ with $metric.introducedIn }}
<small>Introduced in: v{{ . }}</small>
{{ end }}

{{ with $metric.renamedFrom }}
<small>Renamed from: `{{ . }}`</small>
{{ end }}

{{ $components := slice }}
{{- range $comp := $metric.exposedBy }}
  {{- $components = $components | append (index $componentMap $comp | default $comp) }}
{{- end }}
{{- $exposedBy := delimit $components ", " " and " }}

| Type | Unit | Complexity | Exposed by |
|:-----|:-----|:-----------|:-----------|
| {{ $metric.type }} | {{ $metric.unit }} | {{ $metric.complexity }} | {{ $exposedBy }} |

{{ with $metric.threshold }}
**Threshold:**
{{ . }}
{{ end }}

{{ with $metric.troubleshoot }}
**Troubleshoot:**
{{ . }}
{{ end }}

---

{{ end -}}
{{ end -}}
