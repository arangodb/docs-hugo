{{- /* Renders the RBAC information of one endpoint from
       site/data/rbac_services.yaml: the predefined roles that grant access to
       it, using the same label as the ArangoDB HTTP API documentation, and the
       action and resource that the service checks. Place it below the
       `endpoint` shortcode of the endpoint.

       The endpoint is identified by the service id and "<method> <path>",
       with the path relative to the `prefix` of the service. The build fails
       if the endpoint is not listed, so that the data file and the pages stay
       in sync.

       Use the percent-delimited form:
       {{% rbac-endpoint "autograph" "GET /v1/projects/{project}/overview" %}} */ -}}
{{- $data := index hugo.Data "rbac_services" -}}
{{- $svc := partial "rbac/service.html" (dict "id" (.Get 0) "page" .Page) -}}
{{- $key := .Get 1 -}}
{{- $ep := dict -}}
{{- range $svc.endpoints -}}
  {{- if eq (printf "%s %s" .method .path) $key -}}
    {{- $ep = . -}}
  {{- end -}}
{{- end -}}
{{- if not $ep -}}
  {{- errorf "RBAC: endpoint %q of service %q used in %s is not listed in site/data/rbac_services.yaml" $key $svc.id .Page.File.Path -}}
{{- end -}}
{{- $up := partial "rbac/up.html" .Page -}}
{{- $link := printf "%s%s" $up ($svc.rbacPage | default "contextual-data-platform/access-control/rbac.md") -}}
{{- if not $ep.action }}
**Predefined roles (RBAC)**: None needed, the endpoint is public
{{ else -}}
{{- $action := dict -}}
{{- range $svc.actions -}}{{- if eq .name $ep.action -}}{{- $action = . -}}{{- end -}}{{- end -}}
{{- $resId := $ep.resource | default $action.resource -}}
{{- $res := index $data.resources $resId -}}
{{- $note := $ep.resourceNote | default $action.resourceNote | default $svc.resourceNote }}
**Predefined roles (RBAC)**: {{ partial "rbac/roles-of.html" ($ep.roles | default $action.roles) }}

**Required permission**: [`{{ $ep.action }}`]({{ $link }}) on `{{ $res.resource }}`{{ with $note }}, {{ . }}{{ end }}
{{- range $ep.also }}\
Also requires `{{ .action }}` on `{{ (index $data.resources .resource).resource }}` {{ .when }}
{{- end }}
{{ end -}}
