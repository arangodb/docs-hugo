{{- /* Renders the overview of what each predefined AI role grants per service,
       from site/data/rbac_services.yaml: one row per service, one column per
       role, the cells listing the actions. The service name links to the
       service's RBAC page if it has one, otherwise to its main page.

       Use the percent-delimited form so that the Markdown table and the links
       are rendered: {{% rbac-roles %}} */ -}}
{{- $data := index hugo.Data "rbac_services" -}}
{{- $up := partial "rbac/up.html" .Page -}}
| Service | Resources |{{ range $data.roles }} `{{ .name }}` |{{ end }}
|---|---|{{ range $data.roles }}---|{{ end }}
{{ range $svc := $data.services -}}
{{- $resources := slice -}}
{{- range $svc.resources -}}
  {{- $resources = $resources | append (printf "`%s`" (index $data.resources .).resource) -}}
{{- end -}}
{{- $derive := $svc.actions -}}
{{- if $resources -}}{{- $derive = slice -}}{{- end -}}
{{- range $derive -}}
  {{- $r := (index $data.resources .resource).resource -}}
  {{- if eq .resource "service" -}}
    {{- with .resourceNote -}}{{- $r = "" -}}{{- end -}}
  {{- end -}}
  {{- with $r -}}
    {{- if not (in $resources (printf "`%s`" .)) -}}
      {{- $resources = $resources | append (printf "`%s`" .) -}}
    {{- end -}}
  {{- end -}}
  {{- if and (eq .resource "service") .resourceNote -}}
    {{- if not (in $resources .resourceNote) -}}
      {{- $resources = $resources | append .resourceNote -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
| [{{ $svc.name }}]({{ $up }}{{ $svc.rbacPage | default $svc.page }}) | {{ delimit $resources "<br>" }} |
{{- range $role := $data.roles -}}
  {{- $actions := slice -}}
  {{- range $svc.actions -}}
    {{- if in .roles $role.name -}}
      {{- $actions = $actions | append (printf "`%s`" .name) -}}
    {{- end -}}
  {{- end }} {{ if $actions }}{{ delimit $actions "<br>" }}{{ else }}–{{ end }} |
{{- end }}
{{ end -}}
