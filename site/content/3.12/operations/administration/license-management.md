---
title: Enterprise Edition License Management
menuTitle: License Management
weight: 20
description: >-
  How to apply a license and check the licensing status of an ArangoDB deployment
---
The Enterprise Edition of ArangoDB requires a license so that you can use
ArangoDB for commercial purposes and have a dataset size over 100 GiB. See
[ArangoDB Editions](../../about-arangodb/features/_index.md#arangodb-editions)
for details.

How to set a license key and to retrieve information about the current license
via different interfaces is described below.

{{< info >}}
If you use the ArangoDB Kubernetes Operator (including the ArangoDB Platform),
check the [kube-arangodb documentation](https://arangodb.github.io/kube-arangodb/docs/how-to/set_license.html)
for more details on how to set a license key in a Kubernetes-managed deployment.
{{< /info >}}

## Apply a license

To use the Enterprise Edition, set the license key like so:

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Support** in the main navigation.
2. Go to the **Rest API** tab.
3. Expand the **Administration** panel.
4. Expand the **PUT /_admin/license** sub-panel.
5. Click the **Try it out** button.
6. Paste the license key into the text area below the **Request body** label.
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
```js
await db.setLicense("<licenseString>");
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
The Java driver does not support setting a license key yet.
{{< /tab >}}

{{< tab "Python" >}}
```py
info = db.set_license("<licenseString>")
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
const info = await db.getLicense();
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
The Java driver does not support getting the license information yet.
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
  your ArangoDB sales representative to acquire a new license or
  extend your old license.
- `read-only`: Your license has expired at which
  point the deployment will be in read-only mode. All read operations to the
  instance will keep functioning. However, no data or data definition changes
  can be made. Please contact your ArangoDB sales representative immediately.

The attribute `expires` in `features` denotes the expiry date as Unix timestamp
(in seconds since January 1st, 1970 UTC).

The `license` field holds an encrypted and base64-encoded version of the
applied license for reference and support from ArangoDB.
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
