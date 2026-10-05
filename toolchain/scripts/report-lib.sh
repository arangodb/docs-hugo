#!/bin/bash
## Errors and warnings for the build report (see report.py), one per line:
## kind (error/warning), section, version, title, location, message, tab-separated.
## Backslashes, tabs, and newlines in the fields are escaped (\\, \t, \n).
## Also written by arangoproxy (models.Logger.Issue).

REPORT_ISSUES=/home/report-issues.tsv

function report_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/\t/\\t/g' | awk 'NR > 1 { printf "\\n" } { printf "%s", $0 }'
}

### Args: kind, section, version, title, location, message
function report_issue() {
  local line="" field
  for field in "$@"; do
    [ -n "$line" ] && line+=$'\t'
    line+=$(report_escape "$field")
  done
  echo "$line" >> "$REPORT_ISSUES"
}

function report_error() {
  report_issue error "$@"
}

function report_warning() {
  report_issue warning "$@"
}

### Whether any errors were reported
function report_has_errors() {
  grep -q '^error' "$REPORT_ISSUES" 2>/dev/null
}
