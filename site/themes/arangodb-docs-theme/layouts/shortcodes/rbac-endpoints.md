{{- /* Renders the endpoints of one service from site/data/rbac_services.yaml
       as a table with the action each endpoint requires and the predefined
       roles that grant it. Further actions that a request may need are listed
       below the action.

       Use the percent-delimited form: {{% rbac-endpoints "autograph" %}} */ -}}
{{- $data := index hugo.Data "rbac_services" -}}
{{- $svc := partial "rbac/service.html" (dict "id" (.Get 0) "page" .Page) -}}
| Endpoint | Action | Predefined roles |
|---|---|---|
{{ range $ep := $svc.endpoints -}}
{{- $action := dict -}}
{{- range $svc.actions -}}{{- if eq .name $ep.action -}}{{- $action = . -}}{{- end -}}{{- end -}}
{{- if and $ep.action (not $action) -}}
  {{- errorf "RBAC: endpoint %s %s of service %q requires the action %q, which is not listed in the actions of the service in site/data/rbac_services.yaml" $ep.method $ep.path $svc.id $ep.action -}}
{{- end -}}
{{- $also := slice -}}
{{- range $ep.also -}}
  {{- $also = $also | append (printf "Also requires `%s` on `%s` %s" .action (index $data.resources .resource).resource .when) -}}
{{- end -}}
| `{{ $ep.method }} {{ $ep.path }}` | {{ with $ep.action }}`{{ . }}`{{ range $also }}<br>{{ . }}{{ end }}{{ else }}None, public{{ end }} | {{ if $ep.action }}{{ partial "rbac/roles-of.html" ($ep.roles | default $action.roles) }}{{ else }}–{{ end }} |
{{ end -}}
