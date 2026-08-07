{{- /* Renders supported LLM/embedding models from site/data/llm_models.yaml.
       Call with no argument for the suite-wide list — only models supported by
       all three core services (Importer, AutoGraph, Retriever) are shown. Pass a
       service id (e.g. "importer") to show that one service's list.
       Use the percent-delimited form so the markdown table is rendered.

       The suite-wide table has a "Services" column naming every service that
       supports the model, taken from the model's `services` list. The
       per-service tables omit it: they are already filtered to one service, so
       the column would repeat the same value on every row.

       The "Default" column marks the model the service applies when the model
       name is not set with the `openai` provider, from the model's `default`
       field. Whether the `custom` provider shares that fallback differs per
       service, so it is documented on each service's page instead.

       The data file lists a single provider, so its name is carried by the
       surrounding prose instead of a heading; headings come back automatically
       if a second provider is ever added. */ -}}
{{- $service := .Get 0 -}}
{{- $data := index site.Data "llm_models" -}}
{{- $typeLabels := dict "chat" "Chat (LLM)" "embedding" "Embedding" -}}
{{- /* Models must be supported by all of these to appear in the suite-wide list. */ -}}
{{- $core := slice "importer" "autograph" "retriever" -}}
{{- /* Order here is the order the service names appear in the Services column. */ -}}
{{- $order := slice "importer" "autograph" "retriever" "graphrag" "nl2aql" "ada" -}}
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
{{- if $service -}}
| Model | Type | Default |
|---|---|---|
{{ range $m := $models -}}
| `{{ $m.name }}` | {{ index $typeLabels $m.type | default $m.type }} | {{ if $m.default }}Yes{{ else }}—{{ end }} |
{{ end -}}
{{- else -}}
| Model | Type | Services | Default |
|---|---|---|---|
{{ range $m := $models -}}
{{- $for := slice -}}
{{- range $order -}}
{{- if in $m.services . -}}
{{- $for = $for | append (index $data.services .) -}}
{{- end -}}
{{- end -}}
| `{{ $m.name }}` | {{ index $typeLabels $m.type | default $m.type }} | {{ delimit $for ", " }} | {{ if $m.default }}Yes{{ else }}—{{ end }} |
{{ end -}}
{{- end }}
A model marked **Yes** under Default is the one applied automatically when the
model name is not set with the `openai` provider. Whether the `custom` provider
falls back to the same model varies by service — check the parameter reference
for the service you are configuring.
{{ end -}}
{{- end -}}
