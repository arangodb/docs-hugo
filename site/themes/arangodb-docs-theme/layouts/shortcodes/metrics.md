{{ $pageVersion := .Page.Store.Get "versionShort" }}

{{ $dataFolderByVersion := index site.Data $pageVersion }}
{{ $allMetricsFile := index $dataFolderByVersion "allMetrics"}}
{{ range $metric := $allMetricsFile }}
#### {{ $metric.help }}

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
<small>
    Introduced in: v{{ . }}
</small>
{{ end }}

{{ with $metric.renamedFrom }}
<small>
    Renamed from: `{{ . }}`
</small>
{{ end }}

{{ $exposedBy := delimit $metric.exposedBy ", " | upper }}

| Type | Unit | Complexity | Exposed by |
|:-----|:-----|:-----------|:-----------|
| {{ $metric.type }} | {{ $metric.unit }} | {{ $metric.complexity }} | {{ $exposedBy}} |


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