{{- /* Renders the endpoints of one service from site/data/rbac_services/
       as a table with the action each endpoint requires and the predefined
       roles that grant it. Further actions that a request needs are listed
       below the action, with their condition if they are not always needed.

       Use the percent-delimited form: {{% rbac-endpoints "autograph" %}} */ -}}
{{- $data := partialCached "rbac/data.html" "rbac" -}}
{{- $svc := partial "rbac/service.html" (dict "id" (.Get 0) "page" .Page) -}}
| Endpoint | Action | Predefined roles |
|---|---|---|
{{ range $ep := $svc.endpoints -}}
{{- $action := dict -}}
{{- range $svc.actions -}}{{- if eq .name $ep.action -}}{{- $action = . -}}{{- end -}}{{- end -}}
{{- if and $ep.action (not $action) -}}
  {{- errorf "RBAC: endpoint %s %s of service %q requires the action %q, which is not listed in the actions of the service in site/data/rbac_services/" $ep.method $ep.path $svc.id $ep.action -}}
{{- end -}}
{{- $also := slice -}}
{{- range $ep.also -}}
  {{- $names := slice -}}
  {{- range .actions -}}{{- $names = $names | append (printf "`%s`" .) -}}{{- end -}}
  {{- $line := printf "Also %s on `%s`" (partial "rbac/list.html" (dict "items" $names "conj" "and")) .resource -}}
  {{- with .if -}}{{- $line = printf "%s, %s" $line . -}}{{- end -}}
  {{- $also = $also | append $line -}}
{{- end -}}
| `{{ $ep.method }} {{ $ep.path }}` | {{ with $ep.action }}`{{ . }}`{{ range $also }}<br>{{ . }}{{ end }}{{ else }}{{ if eq $ep.access "public" }}None, public{{ else }}None, any authenticated user{{ end }}{{ end }} | {{ if $ep.action }}{{ partial "rbac/roles-of.html" ($ep.roles | default $action.roles) }}{{ else }}–{{ end }} |
{{ end -}}
