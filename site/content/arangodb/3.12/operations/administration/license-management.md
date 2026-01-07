---
title: Enterprise Edition License Management
menuTitle: License Management
weight: 20
description: >-
  How to activate a deployment, obtain and apply a license key, and check the
  licensing status of an ArangoDB deployment
---
The Enterprise Edition of ArangoDB requires a license so that you can use
ArangoDB for commercial purposes and have a dataset size over 100 GiB. See
[ArangoDB Editions](../../features/_index.md#arangodb-editions)
for details.

There are different license management flows:

- **Activate a deployment** (from v3.12.6 onward):\
  Customers receive license credentials composed of a client ID and a client secret.
  You can use a command-line tool to activate deployments with these credentials,
  either one-off or continuously.

  An activation is generally valid for two weeks and it is recommended to
  renew the activation weekly.

  {{< info >}}
  If you use the ArangoDB Kubernetes Operator (including the Data Platform),
  check the [kube-arangodb documentation](https://arangodb.github.io/kube-arangodb/docs/how-to/set_license.html)
  for more details on how to set a license key in a Kubernetes-managed deployment.
  {{< /info >}}

- **Apply a license key**:\
  Up to v3.12.5, customers received a license key directly and it was typically
  valid for one year. From v3.12.6 onward, customers receive license credentials
  instead. You can use a command-line tool to generate a license key using these
  credentials, and the license key generally expires every two weeks.

  You can also activate a deployment instead of generating a license key, but
  this requires an internet connection. For air-gapped environments for example,
  the license key flow is required and the license key has a longer validity.

How to activate a deployment or apply a license key to it, as well as how to
retrieve information about the current license via different interfaces is
described below.

## Activate a deployment

1. Download the Arango Data Platform CLI tool `arangodb_operator_platform` from
   <https://github.com/arangodb/kube-arangodb/releases>.
   It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
   architecture (e.g. `arangodb_operator_platform_linux_amd64`).

   It is recommended to rename the downloaded executable to
   `arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
   the `PATH` environment variable to make it available as a command in the system.

2. Activate a deployment once using the Platform CLI tool. Point it to a running
   ArangoDB deployment (running on `http://localhost:8529` in this example) and
   supply the license credentials:

   ```sh
   arangodb_operator_platform license activate --arango.endpoint http://localhost:8529 --license.client.id "your-corp" --license.client.secret "..."
   ```

   Unless authentication is disabled for the deployment, you need to additionally
   supply either ArangoDB user credentials or a JWT session token and specify the
   authentication method (case-sensitive):

   ```sh
   # User credentials
   arangodb_operator_platform license activate --arango.authentication Basic --arango.basic.username "root" --arango.basic.password "" ...

   # JWT session token
   arangodb_operator_platform license activate --arango.authentication Token --arango.token "eyJh..." ...
   ```

3. You can specify an activation interval to keep the Platform CLI tool running
   and have it re-activate the deployment automatically, e.g. once a week:

   ```sh
   arangodb_operator_platform license activate --license.interval 168h ...
   ```

## Generate a license key

1. Download the Arango Data Platform CLI tool `arangodb_operator_platform` from
   <https://github.com/arangodb/kube-arangodb/releases>.
   It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
   architecture (e.g. `arangodb_operator_platform_linux_amd64`).

   It is recommended to rename the downloaded executable to
   `arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
   the `PATH` environment variable to make it available as a command in the system.

2. Create an inventory file using the Platform CLI tool. Point it to a running
   ArangoDB deployment (running on `http://localhost:8529` in this example):

   ```sh
   arangodb_operator_platform license inventory --arango.endpoint="http://localhost:8529" inventory.json
   ```

   Unless authentication is disabled for the deployment, you need to additionally
   supply either ArangoDB user credentials or a JWT session token and specify the
   authentication method (case-sensitive):

   ```sh
   # User credentials
   arangodb_operator_platform license inventory --arango.authentication Basic --arango.basic.username "root" --arango.basic.password "" ...

   # JWT session token
   arangodb_operator_platform license inventory --arango.authentication Token --arango.token "eyJh..." ...
   ```

3. Determine the ID of the ArangoDB deployment. You can find it in the inventory file
   or call the [`GET /_admin/deployment/id` endpoint](../../develop/http-api/administration.md#get-the-deployment-id):

   ```sh
   # User credentials (-u username:password)
   curl -u root: http://localhost:8529/_admin/deployment/id

   # JWT session token
   curl -H "Authorization: Bearer eyJh..." http://localhost:8529/_admin/deployment/id

   # Example result:
   # {"id":"6172616e-676f-4000-0000-05c958168340"}
   ```

4. Generate the license key using the deployment ID, the inventory file, and the
   license credentials, and write it to a file:

   ```sh
   arangodb_operator_platform license generate --deployment.id "6172616e-676f-4000-0000-05c958168340" --inventory inventory.json --license.client.id "your-corp" --license.client.secret "..." 2> license_key.txt
   ```

## Apply a license key

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Support** in the main navigation.
2. Go to the **Rest API** tab.
3. Expand the **Administration** panel.
4. Expand the **PUT /_admin/license** sub-panel.
5. Click the **Try it out** button.
6. Paste the license key into the text area below the **Request body** label.
   Make sure the key is wrapped in double quotes.
7. Make sure the license key is surrounded by double quote marks.
8. Click the **Execute** button.
9. Scroll down to **Server response** to check the result.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
db._setLicense("<license-string>");
```

See [`db._setLicense()`](../../develop/javascript-api/@arangodb/db-object.md#db_setlicenselicensestring-force)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
Make sure to put the license string in quotes as shown:

```sh
curl -d '"<licenseString>"' -XPUT http://localhost:8529/_db/mydb/_admin/license
```

See the [`PUT /_admin/license`](../../develop/http-api/administration.md#set-a-new-license)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
Make sure to put the license string in quotes as shown:

```js
await db.setLicense('"<licenseString>"');
```

See [`Database.setLicense()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#setLicense)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
err := client.SetLicense(ctx, "<licenseString>", false)
if err != nil {
  fmt.Println(err)
}
```

See [`ClientAdminLicense.SetLicense()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ClientAdminLicense)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
{{< info >}}
The Java driver does not support setting a license key.
{{< /info >}}
{{< /tab >}}

{{< tab "Python" >}}
Make sure to put the license string in quotes as shown:

```py
err = db.set_license('"<licenseString>"')
```

See [`StandardDatabase.setLicense()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.set_license)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

Check the response whether the operation succeeded, for example:

```json
{ "error": false, "code": 201 }
```

Please be careful to copy the exact license key string.

## Check the license

At any point, you may check the current state of your license like so:

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Support** in the main navigation.
2. Go to the **Rest API** tab.
3. Expand the **Administration** panel.
4. Expand the **GET /_admin/license** sub-panel.
5. Click the **Try it out** button.
6. Click the **Execute** button.
7. Scroll down to **Server response** to check the result.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
db._getLicense();
```

See [`db._getLicense()`](../../develop/javascript-api/@arangodb/db-object.md#db_getlicense)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_admin/license
```

See the [`GET /_admin/license`](../../develop/http-api/administration.md#get-information-about-the-current-license)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const license = await db.getLicense();
```

See [`Database.getLicense()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#getLicense)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
license, err := client.GetLicense(ctx)
if err != nil {
  fmt.Println(err)
} else {
  _ = license // Use license info here
}
```

See [`ClientAdminLicense.GetLicense()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ClientAdminLicense)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
{{< info >}}
The Java driver does not support getting the license information.
{{< /info >}}
{{< /tab >}}

{{< tab "Python" >}}
```py
license = db.license()
```

See [`StandardDatabase.license()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.license)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

The server response is different for the Community Edition and the
Enterprise Edition.

{{< tabs "arangodb-edition" >}}

{{< tab "Community Edition" >}}
```json
{
  "upgrading": false,
  "diskUsage": {
    "bytesUsed": 127316844,
    "bytesLimit": 107374182400,
    "limitReached": false,
    "secondsUntilReadOnly": 315569520,
    "secondsUntilShutDown": 315569520,
    "status": "good"
  }
}
```

The `diskUsage.status` attribute tells you the state of your Community Edition
deployment with regard to the dataset size limit at a glance and can have the
following values:

- `good`: The dataset size of your deployment is below the 100 GiB limit.
- `limit-reached`: Your deployment exceeds the size limit and you have two days
  to bring the deployment back below 100 GiB. Consider acquiring an
  Enterprise Edition license to lift the limit.
- `read-only`: Your deployment is in read-only mode because it exceeded the
  size limit for two days. All read operations to the instance keep functioning
  for two more days. However, no data or data definition changes can be made.
- `shutdown`: The server shuts down after two days of read-only mode.

The other sub-attributes of `diskUsage` indicate the dataset size limit, the
size determined for your deployment, whether it exceeds the limit, as well as
the time until the read-only mode and the shutdown are expected to occur if
you are over the limit.
{{< /tab >}}

{{< tab "Enterprise Edition" >}}
```json
{
  "upgrading": false,
  "features": {
    "expires": 1743568356
  },
  "hash": "95af ... 3de1",
  "license": "JD4E ... dnDw==",
  "version": 1,
  "status": "good"
}
```

The `status` attribute is the executive summary of your license and
can have the following values:

- `good`: Your license is valid for more than another 1 week.
- `expiring`: Your license is about to expire shortly. Please contact
  your Arango sales representative to acquire a new license or
  extend your old license.
- `read-only`: Your license has expired at which
  point the deployment will be in read-only mode. All read operations to the
  instance will keep functioning. However, no data or data definition changes
  can be made. Please contact your Arango sales representative immediately.

The attribute `expires` in `features` denotes the expiry date as Unix timestamp
(in seconds since January 1st, 1970 UTC).

The `license` field holds an encrypted and base64-encoded version of the
applied license for reference and support from Arango.
{{< /tab >}}

{{< /tabs >}}

## Monitoring

In order to monitor the remaining validity of the license, the metric
`arangodb_license_expires` is exposed by Coordinators and DB-Servers, see the
[Metrics API](../../develop/http-api/monitoring/metrics.md).

## Managing Your License

Backups, restores, exports and imports and the license management do not
interfere with each other. In other words, the license is not backed up
and restored with any of the above mechanisms.

Make sure that you store your license in a safe place, and potentially the
email with which you received it, should you require the license key to
re-activate a deployment.
