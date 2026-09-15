---
title: The ArangoDB exit codes and their meanings
menuTitle: Exit codes
weight: 281
description: >-
  The ArangoDB server and the client tools set a number called exit code when
  they terminate, and you can look up what they mean here
pageToc:
  maxHeadlineLevel: 3
---
## Exit codes

Exit codes are numeric values programs return when they finish, indicating
success or failure.

- An exit code of zero indicates a successful execution, e.g. the termination of
  the server process without any issues.
- Any non-zero exit code indicates that some error occurred, e.g. you tried to
  run a program with invalid parameters or it failed to process something.

Right after running a command in a command-line, you can show the exit code like so:

- Bash, zsh, and other shells: `echo $?`
- Fish shell: `echo $status`
- PowerShell: `echo $LASTEXITCODE`

The ArangoDB server and (to some extent) the client tools use exit codes to signal
to other applications or the operating system whether they encountered problems.
You can typically tell from the log messages right before the process termination
what errors were encountered, but in certain cases you might only have the
exit code. The below list of exit codes can help you understand the cause in
such a case.

## List of exit codes

The following exit codes are used by the ArangoDB server (_arangod_), the
ArangoDB Shell (_arangosh_), _arangodump_, _arangorestore_, _arangoimport_,
_arangoexport_, _arangobench_, _arangovpack_, and _arangoinspect_.

They are grouped into a few categories. There is a headline for each exit code
with the format `code - name`, and the exit code description as the text.

{{% exit-codes %}}
