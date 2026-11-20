{{- /* Renders the actions of one service from site/data/rbac_services/ as
       a table with the resource each action is checked on and the predefined
       roles that grant it.

       Use the percent-delimited form: {{% rbac-actions "autograph" %}} */ -}}
{{- $data := partialCached "rbac/data.html" "rbac" -}}
{{- $svc := partial "rbac/service.html" (dict "id" (.Get 0) "page" .Page) -}}
| Action | Allows | Resource | Predefined roles |
|---|---|---|---|
{{ range $svc.actions -}}
{{- $list := .resource -}}
{{- if not (reflect.IsSlice $list) -}}{{- $list = slice $list -}}{{- end -}}
{{- $res := slice -}}
{{- range $list -}}{{- $res = $res | append (printf "`%s`" .) -}}{{- end -}}
| `{{ .name }}` | {{ .summary }} | {{ partial "rbac/list.html" (dict "items" $res "conj" "or") }}{{ with (.note | default $svc.note) }}, {{ . }}{{ end }} | {{ partial "rbac/roles-of.html" .roles }} |
{{ end -}}
