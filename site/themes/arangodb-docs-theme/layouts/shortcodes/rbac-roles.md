{{- /* Renders the overview of what each predefined AI role grants per service,
       from site/data/rbac_services/: one row per service, one column per
       role, the cells listing the actions. The service name links to the
       service's RBAC page if it has one, otherwise to its main page. Internal
       services (`internal: true`) are left out.

       Use the percent-delimited form so that the Markdown table and the links
       are rendered: {{% rbac-roles %}} */ -}}
{{- $data := partialCached "rbac/data.html" "rbac" -}}
{{- $up := partial "rbac/up.html" .Page -}}
| Service | Resources |{{ range $data.roles }} `{{ .name }}` |{{ end }}
|---|---|{{ range $data.roles }}---|{{ end }}
{{ range $svc := where $data.services "internal" "ne" true -}}
{{- /* The distinct resources of the actions, in their order */ -}}
{{- $resources := slice -}}
{{- range $svc.actions -}}
  {{- $list := .resource -}}
  {{- if not (reflect.IsSlice $list) -}}{{- $list = slice $list -}}{{- end -}}
  {{- range $list -}}
    {{- $r := printf "`%s`" . -}}
    {{- if not (in $resources $r) -}}{{- $resources = $resources | append $r -}}{{- end -}}
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
