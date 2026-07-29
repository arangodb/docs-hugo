{{- /* Renders supported LLM/embedding models from site/data/llm_models.yaml.
       Call with no argument for the suite-wide list — only models supported by
       all three core services (Importer, AutoGraph, Retriever) are shown. Pass a
       service id (e.g. "importer") to show that one service's list.
       Use the percent-delimited form so the markdown table is rendered.

       The "Default" column names the services a model is a recommended default
       for, taken from the model's `services` list. The whole list is recommended
       for all three core services, so every row names all three — on the
       individual service pages too, not just the suite-wide list.

       The data file lists a single provider, so its name is carried by the
       surrounding prose instead of a heading; headings come back automatically
       if a second provider is ever added. */ -}}
{{- $service := .Get 0 -}}
{{- $data := index site.Data "llm_models" -}}
{{- $typeLabels := dict "chat" "Chat (LLM)" "embedding" "Embedding" -}}
{{- /* Order here is the order the service names appear in the column. */ -}}
{{- $core := slice "importer" "autograph" "retriever" -}}
{{- $showHeadings := gt (len $data.providers) 1 -}}
{{- range $data.providers -}}
{{- $models := .models -}}
{{- if $service -}}
{{- $models = where $models "services" "intersect" (slice $service) -}}
{{- else -}}
{{- range $core -}}
{{- $models = where $models "services" "intersect" (slice .) -}}
{{- end -}}
{{- end -}}
{{- if $models }}
{{ if $showHeadings -}}
### {{ .name }}{{ with .api }} ({{ . }}){{ end }}

{{ end -}}
| Model | Type | Default |
|---|---|---|
{{ range $m := $models -}}
{{- $for := slice -}}
{{- range $core -}}
{{- if in $m.services . -}}
{{- $for = $for | append (index $data.services .) -}}
{{- end -}}
{{- end -}}
| `{{ $m.name }}` | {{ index $typeLabels $m.type | default $m.type }} | {{ delimit $for ", " }} |
{{ end -}}
{{- end -}}
{{- end -}}
