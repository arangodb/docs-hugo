#!/bin/sh
#getent group arangodb > /dev/null || addgroup -S arangodb
#getent passwd arangodb > /dev/null || adduser -S -G arangodb -D -h /usr/share/arangodb3 -H -s /bin/false -g "ArangoDB Application User" arangodb

set -e

# The directory name follows the major version (CMake project name), e.g.
# arangodb3 in 3.x, arangodb4 in 4.x. Detect it from the generated config
# instead of hardcoding it (pick the highest if there are several).
conf=$(ls -d /build/etc/arangodb*/arangod.conf 2>/dev/null | sort -V | tail -n 1)
if [ -z "$conf" ]; then
  echo "[setup-tar-to-docker] ERROR: no arangod.conf under /build/etc/arangodb*/" >&2
  exit 1
fi
NAME=$(basename "$(dirname "$conf")")
echo "[setup-tar-to-docker] Using directory name $NAME"

install -o root -g root -m 755 -d /var/lib/$NAME
install -o root -g root -m 755 -d /var/lib/$NAME-apps
# Note that the log dir is 777 such that any user can log there.
install -o root -g root -m 777 -d /var/log/$NAME

mkdir /docker-entrypoint-initdb.d/

mkdir -p /etc/$NAME
mkdir -p /usr/share/$NAME/js

cp -r /build/etc/$NAME/* /etc/$NAME


cp -r /build/bin/* /usr/bin
cp -r /js/* /usr/share/$NAME/js
if [ -d /enterprise/js ]; then
  cp -r /enterprise/js/* /usr/share/$NAME/js/
fi

# Bind to all endpoints (in the container):
sed -i -e 's~^endpoint.*8529$~endpoint = tcp://0.0.0.0:8529~' /etc/$NAME/arangod.conf
# Remove the uid setting in the config file, since we want to be able
# to run as an arbitrary user:
sed -i \
    -e 's!^\(file\s*=\s*\).*!\1 -!' \
    -e 's~^uid = .*$~~' \
    /etc/$NAME/arangod.conf

# foxx-cli only available up to ArangoDB 3.x but removed in 4.0
if [ "${ARANGODB_VERSION%%.*}" = "3" ] && [ -x /usr/lib/node_modules/foxx-cli/bin/foxx ]; then
  rm -f /usr/bin/foxx
  cat >> /usr/bin/foxx <<'EOF'
#!/bin/sh
test -d /tmp/foxx || mkdir -m 700 /tmp/foxx
export HOME=/tmp/foxx
exec /usr/lib/node_modules/foxx-cli/bin/foxx "$@"
EOF
  chmod 755 /usr/bin/foxx
fi
