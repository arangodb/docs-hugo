{{- /* Renders the service versions of every Arango Contextual Data Platform
       release from the files in site/data/data_platform/, newest release first.

       Each file contributes one section: a headline with the release version
       and date, taken from its top-level `version` and `date` keys, and a
       table of its `packages` map. Both keys are required and the build fails
       naming the file if one is missing — the platform configuration files
       carry the version, but the date has to be added by hand. The file name
       is not interpreted, only the data inside it.

       The package name is mapped to the features it implements and the pages
       that document them via site/data/data_platform_services.yaml. A package can
       carry several features, which are listed in one cell. That mapping holds
       paths relative to the content root; this shortcode rewrites them to
       paths relative to the page it is called from, so the emitted Markdown
       links pass through the link render hook and are checked like any other
       link on the page. Call the shortcode with the percent-delimited form for
       that reason — the angle-bracket form would bypass the Markdown renderer.

       Takes an optional headline level (default 2), so the page can place
       the sections below its own structure — pass 3 to get h3 headlines.

       A package that is missing from the mapping is still listed, with an
       empty Features cell, and reported the same way a broken link is: as an
       error when failOnBrokenLinks is set, as a warning otherwise. */ -}}

{{- $level := int (.Get 0 | default 2) -}}
{{- $hashes := strings.Repeat $level "#" -}}
{{- $dataDir := "data_platform" -}}
{{- $services := index hugo.Data "data_platform_services" -}}
{{- $releases := index hugo.Data $dataDir -}}

{{- /* Hugo's data map carries no file information and .Page.File.Path is
       relative to the content root, so the paths that the messages below
       report are reconstructed. hugo.WorkingDir is the Hugo site directory,
       which sits one level below the repository root, and naming it makes the
       paths relative to that root, so that they can be opened as they are. */ -}}
{{- $siteDir := path.Base hugo.WorkingDir -}}
{{- $dataPath := printf "%s/data/%s" $siteDir $dataDir -}}
{{- $mappingPath := printf "%s/data/data_platform_services.yaml" $siteDir -}}
{{- $currentFile := "<non-file source>" -}}
{{- with .Page.File }}{{ $currentFile = printf "%s/content/%s" $siteDir .Path }}{{ end -}}

{{- /* Path back to the content root, so that the content-root-relative links
       of the mapping work from whatever page the shortcode is called on. */ -}}
{{- $up := "" -}}
{{- with .Page.File -}}
  {{- $dir := path.Dir .Path -}}
  {{- if ne $dir "." -}}
    {{- range split $dir "/" -}}
      {{- $up = printf "../%s" $up -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- /* Sort the releases by version, newest first. Comparing the version
       strings directly would order v4.10.0 before v4.9.0, so pad each part.
       A pre-release suffix such as -preview is not numeric; it is kept out
       of the padded parts and sorts the pre-release below the final release
       with the same number. */ -}}
{{- $sorted := slice -}}
{{- range $file, $release := $releases -}}
  {{- $filePath := printf "%s/%s.yaml" $dataPath $file -}}
  {{- with $release.version -}}
    {{- $version := printf "%v" . -}}
    {{- if not $release.date -}}
      {{- errorf "<error code=1> Platform config file '%s' has no top-level 'date' key </error>" $filePath -}}
    {{- end -}}
    {{- $key := "" -}}
    {{- $parts := split $version "-" -}}
    {{- range split (index $parts 0) "." -}}
      {{- $key = printf "%s%05d" $key (int .) -}}
    {{- end -}}
    {{- if gt (len $parts) 1 -}}
      {{- $key = printf "%s0%s" $key (delimit (after 1 $parts) "-") -}}
    {{- else -}}
      {{- $key = printf "%s1" $key -}}
    {{- end -}}
    {{- $sorted = $sorted | append (dict "key" $key "version" $version "date" $release.date "packages" $release.packages) -}}
  {{- else -}}
    {{- errorf "<error code=1> Platform config file '%s' has no top-level 'version' key </error>" $filePath -}}
  {{- end -}}
{{- end -}}

{{- range sort $sorted "key" "desc" }}
{{ $hashes }} v{{ .version }} ({{ .date }})

{{ $rows := slice -}}
{{- range $package, $entry := .packages -}}
  {{- $sortName := $package -}}
  {{- $features := slice -}}
  {{- $mapped := slice -}}
  {{- with index $services $package -}}
    {{- $mapped = .features -}}
  {{- end -}}
  {{- with $mapped -}}
    {{- $sortName = (index . 0).name -}}
    {{- range . -}}
      {{- if .link -}}
        {{- $features = $features | append (printf "[%s](%s%s)" .name $up .link) -}}
      {{- else -}}
        {{- $features = $features | append .name -}}
      {{- end -}}
    {{- end -}}
  {{- else -}}
    {{- $message := printf "Package '%s' is shipped by a release in %s/ but is not listed in %s, so it is rendered without a feature in %s" $package $dataPath $mappingPath $currentFile -}}
    {{- if site.Params.failOnBrokenLinks -}}
      {{- errorf "<error code=1> %s </error>" $message -}}
    {{- else -}}
      {{- warnf "%s" $message -}}
    {{- end -}}
  {{- end -}}
  {{- $rows = $rows | append (dict "sort" (printf "%s\t%s" (lower $sortName) $package) "features" (delimit $features ", ") "package" $package "version" $entry.version) -}}
{{- end -}}
| Features | Service | Version |
|---|---|---|
{{ range sort $rows "sort" -}}
| {{ with .features }}{{ . }}{{ else }}&mdash;{{ end }} | `{{ .package }}` | {{ .version }} |
{{ end }}
{{- end -}}
