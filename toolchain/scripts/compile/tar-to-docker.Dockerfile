FROM alpine:3.16 AS base
MAINTAINER Max Neunhoeffer <hackers@arango.ai>

ARG ARANGODB_VERSION=3.12
ENV ARANGODB_VERSION=${ARANGODB_VERSION}

RUN apk add --no-cache pwgen nodejs numactl numactl-tools curl
# foxx-cli only available up to ArangoDB 3.x but removed in 4.0
RUN if [ "${ARANGODB_VERSION%%.*}" = "3" ]; then \
      apk add --no-cache npm && npm install -g foxx-cli && apk del npm; \
    fi

ENV GLIBCXX_FORCE_NEW=1

# Path of the compiled arangodb instance archive
ADD install.tar.gz .

COPY setup-tar-to-docker.sh /setup.sh

FROM base AS setup
RUN /setup.sh && rm /setup.sh

# Adjust TZ by default since tzdata package isn't present (BTS-913)
RUN echo "UTC" > /etc/timezone

# The following is magic for unholy OpenShift security business.
# Containers in OpenShift by default run with a random UID but with GID 0,
# and we want that they can access the database and doc directories even
# without a volume mount:
RUN chgrp 0 /var/lib/arangodb3 /var/lib/arangodb3-apps && \
    chmod 775 /var/lib/arangodb3 /var/lib/arangodb3-apps

COPY docker-entrypoint.sh /entrypoint.sh
RUN ["chmod", "+x", "/entrypoint.sh"]

FROM setup AS arangodb-tar-starter
ENTRYPOINT [ "/entrypoint.sh" ]

EXPOSE 8529
CMD [ "arangod" ]
