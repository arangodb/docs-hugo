{{- /* Renders supported LLM/embedding models from site/data/llm_models.yaml.
       Call with no argument to list every provider and model (overview page),
       or pass a service id (e.g. "importer") to show only the models that
       service supports. Use the percent-delimited form so the markdown table
       is rendered. */ -}}
{{- $service := .Get 0 -}}
{{- $data := index site.Data "llm_models" -}}
{{- $svcMap := $data.services -}}
{{- range $data.providers -}}
{{- $models := .models -}}
{{- if $service }}{{ $models = where $models "services" "intersect" (slice $service) }}{{ end -}}
{{- if $models }}

### {{ .name }}{{ with .api }} ({{ . }}){{ end }}

| Model | Type |{{ if $service }} Default |{{ else }} Supported services |{{ end }}
|---|---|---|
{{ range $models -}}
| `{{ .name }}` | {{ if eq .type "chat" }}Chat (LLM){{ else if eq .type "embedding" }}Embedding{{ else }}{{ .type }}{{ end }} |{{ if $service }}{{ if in (.default_for | default slice) $service }} Yes |{{ else }} |{{ end }}{{ else }} {{ $names := slice }}{{ range .services }}{{ $names = $names | append (index $svcMap .) }}{{ end }}{{ delimit $names ", " }} |{{ end }}
{{ end -}}
{{- end -}}
{{- end -}}
