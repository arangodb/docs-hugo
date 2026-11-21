{{- /* Renders the actions of one service from site/data/rbac_services.yaml as
       a table with the resource each action is checked on and the predefined
       roles that grant it.

       Use the percent-delimited form: {{% rbac-actions "autograph" %}} */ -}}
{{- $data := index hugo.Data "rbac_services" -}}
{{- $svc := partial "rbac/service.html" (dict "id" (.Get 0) "page" .Page) -}}
| Action | Allows | Resource | Predefined roles |
|---|---|---|---|
{{ range $svc.actions -}}
{{- $res := index $data.resources .resource -}}
| `{{ .name }}` | {{ .summary }} | {{ if and (eq .resource "service") .resourceNote }}{{ .resourceNote }}{{ else }}`{{ $res.resource }}`{{ with .resourceNote }} {{ . }}{{ end }}{{ end }} | {{ partial "rbac/roles-of.html" .roles }} |
{{ end -}}
