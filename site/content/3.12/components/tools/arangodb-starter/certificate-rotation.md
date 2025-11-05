---
title: SSL/TLS Certificate Rotation
menuTitle: SSL/TLS Certificate Rotation
weight: 10
description: >-
  This document explains how to rotate SSL/TLS certificates in ArangoDB clusters managed by the ArangoDB Starter.
---
## Contents

- [1. Quick Recommendation](#1-quick-recommendation)
- [2. Prerequisites & Variables](#2-prerequisites--variables)
- [3. Option Comparison](#3-option-comparison)
- [4. Option 1: Graceful Restart](#4-option-1-graceful-restart-recommended)
- [5. Option 2: Configuration File Update](#5-option-2-configuration-file-update)
- [6. Option 3: Hot Reload via API](#6-option-3-hot-reload-via-api)
- [7. Summary](#7-summary)

---

## 1. Quick Recommendation

For most production deployments, use _Option 1_ (Graceful Restart).

It provides the best balance of _simplicity, reliability, and safety_ with only _30-60 seconds_ of planned downtime.

---

## 2. Prerequisites & Variables

Before starting any certificate rotation procedure, set these variables for your environment:

```bash
# Replace with your actual values
export NODE="your-hostname.example.com"      # Your server hostname or IP
export PORT="8529"                           # Coordinator port (default: 8529)
export STARTER_PORT="8528"                   # Starter API port (default: 8528)
```

**Common Default Ports:**
- **Starter API**: 8528
- **Coordinator**: 8529
- **DBServer**: 8530
- **Agent**: 8531

Throughout this document, commands use `${NODE}`, `${PORT}`, and `${STARTER_PORT}` placeholders. Replace them with your actual values or set the variables as shown above.

---

## 3. Option Comparison

| Options                | Downtime | Complexity | Reliability          | Best For                |
|------------------------|----------|------------|----------------------|-------------------------|
| 1. Graceful Restart    | 30-60s   | Low        | 100%                 | **Most production use** |
| 2. Config File Update  | 30-60s   | High       | Error-prone          | Path changes only       |
| 3. Hot Reload API      | None     | Medium     | Requires verification| Zero-downtime SLA       |

## 4. Option 1: Graceful Restart (Recommended)

### Overview

This option provides the best approach for most certificate rotation scenarios.

**Benefits:**
- **Simple**: Only 6 straightforward steps
- **Reliable**: Always successful when followed correctly
- **Safe**: No manual configuration file editing
- **Quick**: 30-60 seconds planned downtime
- **Clean**: Fresh configuration state
- **Easy Rollback**: Restore file and restart

### Procedure

#### Step 1: Prepare New Certificate

```bash
# Generate or obtain your new certificate
openssl req -x509 -newkey rsa:4096 \
    -keyout /tmp/new-key.pem \
    -out /tmp/new-cert.pem \
    -days 365 -nodes \
    -subj "/CN=your-hostname/O=YourOrganization"

# Combine into ArangoDB keyfile format (certificate + private key)
cat /tmp/new-cert.pem /tmp/new-key.pem > /tmp/new-server.keyfile
chmod 600 /tmp/new-server.keyfile

# Verify the certificate
openssl x509 -in /tmp/new-server.keyfile -noout -subject -dates

# Backup current certificate
cp /path/to/current/server.keyfile \
   /path/to/current/server.keyfile.backup-$(date +%Y%m%d)
```

#### Step 2: Replace Certificate at Same Path

```bash
# Replace the certificate file
# Note: Cluster still running with old cert in memory
cp /tmp/new-server.keyfile /path/to/current/server.keyfile

# Verify replacement
openssl x509 -in /path/to/current/server.keyfile -noout -subject
```

#### Step 3: Graceful Cluster Shutdown

```bash
# Shutdown each node gracefully
# Adjust NODE and PORT for your environment
curl -k -X POST https://${NODE}:${STARTER_PORT}/shutdown

# Wait for clean shutdown
sleep 15

# Verify all stopped
ps aux | grep arangod | grep -v grep  # Should be empty
```

#### Step 4: Delete setup.json Files

**This is the key step** - forces starter to use command-line options:

```bash
# Delete setup.json from all data directories
rm -f /path/to/data-dir/setup.json

# Verify deletion
ls -la /path/to/data-dir/setup.json  # Should show "No such file"
```

**Why delete setup.json?**
- Forces fresh configuration with new certificate
- Eliminates cached state conflicts
- Ensures command-line options take precedence

#### Step 5: Restart Cluster

Restart using the **exact same commands** as original startup:

```bash
export STARTER=/usr/local/bin/arangodb

$STARTER \
    --ssl.keyfile=/path/to/current/server.keyfile \
    --starter.data-dir=/path/to/data-dir \
    --starter.port=${PORT} \
    --log.console=true
```

Wait for startup completion (~30 seconds):
```
Your cluster can now be accessed with a browser at `https://hostname:8529`
```

#### Step 6: Verify New Certificate

```bash
# Check each server type (adjust NODE and PORT for your environment)
echo | openssl s_client -connect ${NODE}:${PORT} 2>/dev/null | \
    openssl x509 -noout -subject -dates

# Verify cluster health
curl -k -u root: https://${NODE}:8529/_admin/cluster/health
# Should return JSON with "Status": "GOOD"
```

**Default Ports**: Coordinator: 8529, DBServer: 8530, Agent: 8531

---

### Production Automation Script

```bash
#!/bin/bash
# rotate-certificate.sh - Automated certificate rotation
# Usage: ./rotate-certificate.sh /path/to/new/certificate.keyfile

set -e

# Configuration - Adjust for your environment
NODES=("node1.example.com" "node2.example.com" "node3.example.com")
STARTER_PORT="8528"
CERT_PATH="/path/to/production/server.keyfile"
DATA_DIRS=("/path/to/data-node1" "/path/to/data-node2" "/path/to/data-node3")

NEW_CERT="$1"

echo "=== ArangoDB Certificate Rotation ==="

# Backup
BACKUP="${CERT_PATH}.backup-$(date +%Y%m%d-%H%M%S)"
cp "$CERT_PATH" "$BACKUP"
echo "Backed up to: $BACKUP"

# Replace certificate
cp "$NEW_CERT" "$CERT_PATH"
chmod 600 "$CERT_PATH"
echo "Certificate replaced"

# Shutdown all nodes
echo "Shutting down cluster..."
for NODE in "${NODES[@]}"; do
    curl -k -X POST https://${NODE}:${STARTER_PORT}/shutdown || true
done
sleep 15

# Delete setup.json on all nodes
for DIR in "${DATA_DIRS[@]}"; do
    rm -f "${DIR}/setup.json"
done
echo "setup.json files deleted"

echo "Ready to restart cluster. Press Enter after restart..."
read

# Verify
echo "Verifying new certificate..."
for NODE in "${NODES[@]}"; do
    echo "$NODE:"
    echo | openssl s_client -connect ${NODE}:8529 2>/dev/null | \
        openssl x509 -noout -subject
done

echo "Certificate rotation complete"
```

---

## 5. Option 2: Configuration File Update

### Overview

{{< warning >}}
**Not Recommended** - Use only for path changes.
{{< /warning >}}

This option requires manually editing multiple configuration files and is error-prone. Use only when the certificate path must change.

### Procedure

#### Step 1: Create New Certificate at Different Path

```bash
mkdir -p /new/certificate/path

openssl req -x509 -newkey rsa:4096 \
    -keyout /new/certificate/path/key.pem \
    -out /new/certificate/path/cert.pem \
    -days 730 -nodes \
    -subj "/CN=your-hostname/O=YourOrganization"

cat /new/certificate/path/cert.pem \
    /new/certificate/path/key.pem \
    > /new/certificate/path/server.keyfile

chmod 600 /new/certificate/path/server.keyfile
```

#### Step 2: Update setup.json Files

{{< warning >}}
The cluster is still running during this step - be careful with edits.
{{< /warning >}}

```python
#!/usr/bin/env python3
# update-setup-json.py
import json, sys, shutil

setup_file, new_cert_path = sys.argv[1], sys.argv[2]

with open(setup_file, 'r') as f:
    config = json.load(f)

shutil.copy(setup_file, setup_file + '.backup')
config['ssl-keyfile'] = new_cert_path

with open(setup_file, 'w') as f:
    json.dump(config, f, indent=2)

print(f"Updated {setup_file}")
```

```bash
# Run for each node's setup.json
python3 update-setup-json.py /path/to/data-dir/setup.json /new/path/cert.keyfile

# Verify
grep "ssl-keyfile" /path/to/data-dir/setup.json
```

#### Step 3: Update arangod.conf Files

{{< info >}}
Config files use `keyfile = ...` under the `[ssl]` section.
{{< /info >}}

```bash
#!/bin/bash
# update-arangod-conf.sh
CONF_FILE="$1"
NEW_PATH="$2"

[ ! -f "$CONF_FILE" ] && echo "Skip: $CONF_FILE" && exit 0

cp "$CONF_FILE" "${CONF_FILE}.backup"
sed -i "s|^keyfile.*|keyfile = ${NEW_PATH}|g" "$CONF_FILE"
echo "Updated: $CONF_FILE"
```

```bash
# Update all server instances (adjust paths for your environment)
./update-arangod-conf.sh /path/to/data-dir/coordinator*/arangod.conf /new/path/cert.keyfile
./update-arangod-conf.sh /path/to/data-dir/dbserver*/arangod.conf /new/path/cert.keyfile
./update-arangod-conf.sh /path/to/data-dir/agent*/arangod.conf /new/path/cert.keyfile
```

{{< info >}}
Directory names include port numbers (e.g., `coordinator8529`).
{{< /info >}}

#### Step 4: Restart Cluster

```bash
# Shutdown
curl -k -X POST https://${NODE}:${STARTER_PORT}/shutdown
sleep 15

# Restart with original commands (starter uses paths from config files)
$STARTER --ssl.keyfile=/old/path/cert.keyfile ...
```

#### Step 5: Verify New Certificate

```bash
echo | openssl s_client -connect ${NODE}:8529 2>/dev/null | \
    openssl x509 -noout -subject -dates
```

---

## 6. Option 3: Hot Reload via API

### Overview

This option enables certificate rotation with zero downtime by reloading certificates without restarting the cluster.

**When to Use:**
- Zero downtime is absolutely critical (strict SLA)
- Cannot schedule maintenance window
- Have monitoring to verify reload success

**Important:** For most deployments, the 30-60 second downtime of Option 1 is preferable due to simplicity and reliability.

### How It Works

The `/_admin/server/tls` API endpoint reloads the SSL certificate from disk without restarting. However:

-  New TLS connections immediately use the new certificate
-  Existing TLS connections cache the old certificate until they close

### Procedure

#### Step 1: Prepare and Replace Certificate

```bash
# Generate new certificate
openssl req -x509 -newkey rsa:4096 \
    -keyout /tmp/new-key.pem \
    -out /tmp/new-cert.pem \
    -days 365 -nodes \
    -subj "/CN=your-hostname/O=YourOrganization"

cat /tmp/new-cert.pem /tmp/new-key.pem > /tmp/new-server.keyfile
chmod 600 /tmp/new-server.keyfile

# Backup and replace (cluster stays running)
cp /path/to/current/server.keyfile \
   /path/to/current/server.keyfile.backup-$(date +%Y%m%d)

cp /tmp/new-server.keyfile /path/to/current/server.keyfile
```

{{< warning >}}
Certificate path must stay the same. Path changes are not supported for hot reload.
{{< /warning >}}

#### Step 2: Trigger Hot Reload

```bash
# Reload all server types on each node
# Adjust NODE and PORTs for your environment
curl -k -u root: -X POST https://${NODE}:8529/_admin/server/tls  # Coordinator
curl -k -u root: -X POST https://${NODE}:8530/_admin/server/tls  # DBServer
curl -k -u root: -X POST https://${NODE}:8531/_admin/server/tls  # Agent

# Expected response: {"error":false,"code":200}
sleep 5
```

#### Step 3: Verify with Fresh Connections

{{< info >}}
You must force new TLS connections to verify the new certificate is active.
{{< /info >}}

```bash
# Force fresh connection to see new certificate
timeout 2 openssl s_client -connect localhost:8530</dev/null 2>/dev/null | \
    openssl x509 -noout -subject -dates
```

#### Step 4: Verify Cluster Health

```bash
curl -k -u root: https://${NODE}:8529/_admin/cluster/health
```

#### Step 5: Fallback if Needed

If verification fails:

```bash
# Fall back to Option 1
curl -k -X POST https://${NODE}:${STARTER_PORT}/shutdown
sleep 15
rm -f /path/to/data-dir/setup.json
# Restart cluster
```

### Understanding Connection Caching

After calling `/_admin/server/tls`:

1. Server immediately reloads certificate from disk 
2. New TLS connections use new certificate 
3. Existing TLS connections continue with cached old certificate 

This is standard TLS behavior. Applications will gradually reconnect and pick up new certificate.

---

## 7. Summary

### For Most Deployments: Use Option 1

**Graceful Restart** is recommended for:
- Regular certificate renewals
- Emergency rotations (expiring cert)
- Production updates

**Why:**
- Simple and reliable (5 steps, 100% success)
- Minimal downtime (30-60 seconds)
- No manual config editing
- Easy rollback

### For Special Cases

**Use Option 3 (Hot Reload)** only when:
- Zero downtime SLA absolutely requires it
- You have verification and monitoring
- You understand connection caching

**Use Option 2 (Config Update)** only when:
- Certificate path must change
- Simplified variant won't work

### Key Points

1. **Option 1 is recommended** for 95% of certificate rotations
2. Brief downtime (30-60s) is acceptable and worth the simplicity
3. Hot reload works but adds complexity
4. Manual config editing should be avoided when possible
5. Always backup certificates before rotation
6. Always verify after rotation
