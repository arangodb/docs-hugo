# CircleCI
## Automated Triggers

### Plain Build
Whenever there is a push in a PR.

Invoke Args:
- workflow: plain-build
- deploy-url: deploy-preview-{PR_NUMBER}

### Generate
Comment a PR with 

    /generate

Invoke Args:
- workflow: generate
- arangodb-3_10: {string in PR Template at 3.10: }
- arangodb-3_11: {string in PR Template at 3.11: }
- arangodb-3_12: {string in PR Template at 3.12: }
- generators: examples
- deploy-url: deploy-preview-{PR_NUMBER}

### Commit Generated Files From Previous Generate Rum
Comment a PR with

    /commit-generated

No Args

### Generate and Commit at the same time
Comment a PR with

    /generate-commit

Invoke Args:
- workflow: generate
- arangodb-3_10: {string in PR Template at 3.10: }
- arangodb-3_11: {string in PR Template at 3.11: }
- arangodb-3_12: {string in PR Template at 3.12: }
- generators: examples
- deploy-url: deploy-preview-{PR_NUMBER}
- commit-generated: true

### Scheduled Generate Content
Every Thursday a variant of generate workflow is launched by CircleCI

Invoke Args:

 - workflow: generate-scheduled

 This workflow uses a "generate" workflow with predefined args:

 - arangodb-3_10: arangodb/enterprise-preview:3.10-nightly
 - arangodb-3_11: arangodb/enterprise-preview:3.11-nightly
 - arangodb-3_12: arangodb/enterprise-preview:devel-nightly
 - generators: metrics error-codes optimizer options
 - commit-generated: true
 - create-pr: true
 - pr-branch: scheduled-content-generate_$CIRCLE_BUILD_NUM

### Scheduled Generate OasisCTL
Every Thursday a variant of generate workflow is launched by CircleCI

Invoke Args:

 - workflow: generate-oasisctl

 This workflow uses a "generate" workflow with predefined args:

 - arangodb-3_10: arangodb/enterprise-preview:3.10-nightly
 - arangodb-3_11: arangodb/enterprise-preview:3.11-nightly
 - arangodb-3_12: arangodb/enterprise-preview:devel-nightly
 - generators: oasisctl
 - commit-generated: true
 - create-pr: true
 - pr-branch: scheduled-oasisctl-generate_$CIRCLE_BUILD_NUM




## Manual Triggers

### Plain Build


 - workflow: plain-build
 - deploy-url: {string}   Netlify Url to deploy the site using the --alias option

 ### Generate

 - workflow: generate
 - arangodb-3_10: {optional} arangodb branch to generate 3.10 content
 - arangodb-3_11: {optional} arangodb branch to generate 3.11 content
 - arangodb-3_12: {optional} arangodb branch to generate 3.12 content
 - generators: {string} space-separated list of generators to use, empty=all generators
 - commit-generated: {boolean} commit generated files
 - create-pr: {boolean} create pr with generated files
 - pr-branch: if create-pr=true, name of the new branch
 - deploy-url: {string}   Netlify Url to deploy the site using the --alias option

### Commit Generated Files From Last Generate Run
 - workflow: commit-generated


### Scheduled Generate Content
 - workflow: generate-scheduled

### Scheduled Generate Oasisctl
 - workflow: generate-oasisctl

### Compile

  - workflow: compile
  - arangodb-branch: arangodb branch to compile
  - openssl: openssl version to use for compiling

### Create Docs Images AMD64
 - workflow: create-docs-images-amd64

### Create Docs Images ARM64
 - workflow: create-docs-images-arm64

