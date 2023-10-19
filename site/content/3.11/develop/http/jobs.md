---
title: HTTP interface for jobs
menuTitle: Jobs
weight: 80
description: >-
  The HTTP API for jobs lets you access the results of asynchronously executed
  requests and check the status of such jobs
archetype: default
---
## Get the results of an async job

```openapi
paths:
  /_api/job/{job-id}:
    put:
      operationId: getJobResult
      description: |
        Returns the result of an async job identified by `job-id`. If the async job
        result is present on the server, the result will be removed from the list of
        result. That means this method can be called for each job-id once.
        The method will return the original job result's headers and body, plus the
        additional HTTP header x-arango-async-job-id. If this header is present,
        then
        the job was found and the response contains the original job's result. If
        the header is not present, the job was not found and the response contains
        status information from the job manager.
      parameters:
        - name: job-id
          in: path
          required: true
          description: |
            The async job id.
          schema:
            type: string
      responses:
        '204':
          description: |
            is returned if the job requested via job-id is still in the queue of pending
            (or not yet finished) jobs. In this case, no x-arango-async-id HTTP header
            will be returned.
        '400':
          description: |
            is returned if no job-id was specified in the request. In this case,
            no x-arango-async-id HTTP header will be returned.
        '404':
          description: |
            is returned if the job was not found or already deleted or fetched from
            the job result list. In this case, no x-arango-async-id HTTP header will
            be returned.
      tags:
        - Jobs
```

**Examples**

```curl
---
description: |-
  Not providing a job-id:
name: job_fetch_result_01
---
var url = "/_api/job";
var response = logCurlRequest('PUT', url, "");

assert(response.code === 400);

logJsonResponse(response);
```

```curl
---
description: |-
  Providing a job-id for a non-existing job:
name: job_fetch_result_02
---
var url = "/_api/job/notthere";
var response = logCurlRequest('PUT', url, "");

assert(response.code === 404);

logJsonResponse(response);
```

```curl
---
description: |-
  Fetching the result of an HTTP GET job:
name: job_fetch_result_03
---
var url = "/_api/version";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, "", headers);

assert(response.code === 202);
logRawResponse(response);

var queryId = response.headers['x-arango-async-id'];
url = '/_api/job/' + queryId
var response = logCurlRequest('PUT', url, "");
assert(response.code === 200);
logJsonResponse(response);
```

```curl
---
description: |-
  Fetching the result of an HTTP POST job that failed:
name: job_fetch_result_04
---
var url = "/_api/collection";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, {"name":" this name is invalid "}, headers);

assert(response.code === 202);
logRawResponse(response);

var queryId = response.headers['x-arango-async-id'];
url = '/_api/job/' + queryId
var response = logCurlRequest('PUT', url, "");
assert(response.code === 400);
logJsonResponse(response);
```

## Cancel an async job

```openapi
paths:
  /_api/job/{job-id}/cancel:
    put:
      operationId: cancelJob
      description: |
        Cancels the currently running job identified by job-id. Note that it still
        might take some time to actually cancel the running async job.
      parameters:
        - name: job-id
          in: path
          required: true
          description: |
            The async job id.
          schema:
            type: string
      responses:
        '200':
          description: |
            cancel has been initiated.
        '400':
          description: |
            is returned if no job-id was specified in the request. In this case,
            no x-arango-async-id HTTP header will be returned.
        '404':
          description: |
            is returned if the job was not found or already deleted or fetched from
            the job result list. In this case, no x-arango-async-id HTTP header will
            be returned.
      tags:
        - Jobs
```

**Examples**

```curl
---
description: ''
name: job_cancel
---
var url = "/_api/cursor";
var headers = {'x-arango-async' : 'store'};
var postData = {"query":
   "FOR i IN 1..10 FOR j IN 1..10 LET x = sleep(1.0) FILTER i == 5 && j == 5 RETURN 42"}

var response = logCurlRequest('POST', url, postData, headers);
assert(response.code === 202);
logRawResponse(response);

var queryId = response.headers['x-arango-async-id'];
url = '/_api/job/pending';
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);

url = '/_api/job/' + queryId + '/cancel'
var response = logCurlRequest('PUT', url, "");
assert(response.code === 200);
logJsonResponse(response);

url = '/_api/job/pending';
var response = logCurlRequest('GET', url, "");
assert(response.code === 200);
logJsonResponse(response);
```

## Delete async job results

```openapi
paths:
  /_api/job/{job-id}:
    delete:
      operationId: deleteJob
      description: |
        Deletes either all job results, expired job results, or the result of a
        specific job.
        Clients can use this method to perform an eventual garbage collection of job
        results.
      parameters:
        - name: job-id
          in: path
          required: true
          description: |
            The ID of the job to delete. The ID can be
            - `all` Deletes all jobs results. Currently executing or queued async
              jobs are not stopped by this call.
            - `expired` Deletes expired results. To determine the expiration status of a
              result, pass the stamp query parameter. stamp needs to be a Unix timestamp,
              and all async job results created before this time are deleted.
            - **A numeric job ID** In this case, the call removes the result of the
              specified async job. If the job is currently executing or queued, it is
              not aborted.
          schema:
            type: string
        - name: stamp
          in: query
          required: false
          description: |
            A Unix timestamp specifying the expiration threshold for when the `job-id` is
            set to `expired`.
          schema:
            type: number
      responses:
        '200':
          description: |
            is returned if the deletion operation was carried out successfully.
            This code will also be returned if no results were deleted.
        '400':
          description: |
            is returned if `job-id` is not specified or has an invalid value.
        '404':
          description: |
            is returned if `job-id` is a syntactically valid job ID but no async job with
            the specified ID is found.
      tags:
        - Jobs
```

**Examples**

```curl
---
description: |-
  Deleting all jobs:
name: job_delete_01
---
var url = "/_api/version";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, "", headers);

assert(response.code === 202);
logRawResponse(response);

url = '/_api/job/all'
var response = logCurlRequest('DELETE', url, "");
assert(response.code === 200);
logJsonResponse(response);
```

```curl
---
description: |-
  Deleting expired jobs:
name: job_delete_02
---
var url = "/_api/version";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, "", headers);

assert(response.code === 202);
logRawResponse(response);

var response = logCurlRequest('GET', "/_admin/time");
assert(response.code === 200);
logJsonResponse(response);
now = response.parsedBody.time;

url = '/_api/job/expired?stamp=' + now
var response = logCurlRequest('DELETE', url, "");
assert(response.code === 200);
logJsonResponse(response);

url = '/_api/job/pending';
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);
```

```curl
---
description: |-
  Deleting the result of a specific job:
name: job_delete_03
---
var url = "/_api/version";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, "", headers);

assert(response.code === 202);
logRawResponse(response);

var queryId = response.headers['x-arango-async-id'];
url = '/_api/job/' + queryId
var response = logCurlRequest('DELETE', url, "");
assert(response.code === 200);
logJsonResponse(response);
```

```curl
---
description: |-
  Deleting the result of a non-existing job:
name: job_delete_04
---
url = '/_api/job/AreYouThere'
var response = logCurlRequest('DELETE', url, "");
assert(response.code === 404);
logJsonResponse(response);
```

## List async jobs by status or get the status of specific job

```openapi
paths:
  /_api/job/{job-id}:
    get:
      operationId: getJob
      description: |
        This endpoint returns either of the following, depending on the specified value
        for the `job-id` parameter:

        - The IDs of async jobs with a specific status
        - The processing status of a specific async job
      parameters:
        - name: job-id
          in: path
          required: true
          description: |
            If you provide a value of `pending` or `done`, then the endpoint returns an
            array of strings with the job IDs of ongoing or completed async jobs.

            If you provide a numeric job ID, then the endpoint returns the status of the
            specific async job in the form of an HTTP reply without payload. Check the
            HTTP status code of the response for the job status.
          schema:
            type: string
        - name: count
          in: query
          required: false
          description: |
            The maximum number of job IDs to return per call. If not specified, a
            server-defined maximum value is used. Only applicable if you specify `pending`
            or `done` as `job-id` to list jobs.
          schema:
            type: number
      responses:
        '200':
          description: |
            is returned if the job with the specified `job-id` has finished and you can
            fetch its results, or if your request for the list of `pending` or `done` jobs
            is successful (the list might be empty).
        '204':
          description: |
            is returned if the job with the specified `job-id` is still in the queue of
            pending (or not yet finished) jobs.
        '400':
          description: |
            is returned if you specified an invalid value for `job-id` or no value.
        '404':
          description: |
            is returned if the job cannot be found or is already fetched or deleted from the
            job result list.
      tags:
        - Jobs
```

**Examples**

```curl
---
description: |-
  Querying the status of a done job:
name: job_getStatusById_01
---
var url = "/_api/version";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, "", headers);

assert(response.code === 202);
logRawResponse(response);

var queryId = response.headers['x-arango-async-id'];
url = '/_api/job/' + queryId
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logRawResponse(response);
```

```curl
---
description: |-
  Querying the status of a pending job:
  (therefore we create a long running job...)
name: job_getStatusById_02
---
var url = "/_api/transaction";
var body = {
  collections: {
    read : [ "_aqlfunctions" ]
  },
  action: "function () {require('internal').sleep(15.0);}"
};
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('POST', url, body, headers);

assert(response.code === 202);
logRawResponse(response);

var queryId = response.headers['x-arango-async-id'];
url = '/_api/job/' + queryId
var response = logCurlRequest('GET', url);
assert(response.code === 204);
logRawResponse(response);
```

```curl
---
description: |-
  Fetching the list of `done` jobs:
name: job_getByType_01
---
var url = "/_api/version";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, "", headers);

assert(response.code === 202);
logRawResponse(response);

url = '/_api/job/done'
var response = logCurlRequest('GET', url, "");
assert(response.code === 200);
logJsonResponse(response);
```

```curl
---
description: |-
  Fetching the list of `pending` jobs:
name: job_getByType_02
---
var url = "/_api/version";
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('PUT', url, "", headers);

assert(response.code === 202);
logRawResponse(response);

url = '/_api/job/pending'
var response = logCurlRequest('GET', url, "");
assert(response.code === 200);
logJsonResponse(response);
```

```curl
---
description: |-
  Fetching the list of a `pending` jobs while a long-running job is executing
  (and aborting it):
name: job_getByType_03
---
var url = "/_api/transaction";
var body = {
  collections: {
    read : [ "_frontend" ]
  },
  action: "function () {require('internal').sleep(15.0);}"
};
var headers = {'x-arango-async' : 'store'};
var response = logCurlRequest('POST', url, body, headers);

assert(response.code === 202);
logRawResponse(response);

var queryId = response.headers['x-arango-async-id'];
url = '/_api/job/pending'
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);

url = '/_api/job/' + queryId
var response = logCurlRequest('DELETE', url, "");
assert(response.code === 200);
logJsonResponse(response);
```
