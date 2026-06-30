{{- /* Renders supported LLM/embedding models from site/data/llm_models.yaml.
       Call with no argument for the suite-wide list — only models supported
       by all three core services (Importer, Retriever, AutoGraph) are shown.
       Pass a service id (e.g. "importer") to show the per-service list.
       Use the percent-delimited form so the markdown table is rendered. */ -}}
{{- $service := .Get 0 -}}
{{- $data := index site.Data "llm_models" -}}
{{- range $data.providers -}}
{{- $models := .models -}}
{{- if $service -}}
{{- $models = where $models "services" "intersect" (slice $service) -}}
{{- else -}}
{{- $models = where $models "services" "intersect" (slice "importer") -}}
{{- $models = where $models "services" "intersect" (slice "retriever") -}}
{{- $models = where $models "services" "intersect" (slice "autograph") -}}
{{- end -}}
{{- if $models }}

### {{ .name }}{{ with .api }} ({{ . }}){{ end }}

{{ if $service -}}
| Model | Type | Default |
|---|---|---|
{{ range $models -}}
| `{{ .name }}` | {{ if eq .type "chat" }}Chat (LLM){{ else if eq .type "embedding" }}Embedding{{ else }}{{ .type }}{{ end }} |{{ if in (.default_for | default slice) $service }} Yes |{{ else }} |{{ end }}
{{ end -}}
{{- else -}}
| Model | Type |
|---|---|
{{ range $models -}}
| `{{ .name }}` | {{ if eq .type "chat" }}Chat (LLM){{ else if eq .type "embedding" }}Embedding{{ else }}{{ .type }}{{ end }} |
{{ end -}}
{{- end -}}
{{- end -}}
{{- end -}}
