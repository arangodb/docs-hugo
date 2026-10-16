FROM alpine:latest AS arangoproxy

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

COPY --from=golang:alpine /usr/local/go/ /usr/local/go/
 
ENV PATH="/usr/local/go/bin:${PATH}"

RUN apk add --update --no-cache nodejs npm bash curl docker-cli

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq
RUN npm install -g @apidevtools/swagger-cli

# JSON form, so that the script gets the stop signal (as PID 1)
WORKDIR /home/toolchain/scripts
CMD ["./start_arangoproxy.sh"]






FROM alpine:latest AS hugo

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

COPY --from=golang:alpine /usr/local/go/ /usr/local/go/
ENV PATH="/usr/local/go/bin:${PATH}"

RUN apk add --update --no-cache git curl bash

# Hugo release (standard edition, statically linked; the site uses no features of
# the extended edition). To update Hugo, change the version and rebuild the images
# with the create-docs-images-amd64 and create-docs-images-arm64 workflows.
ARG HUGO_VERSION=0.167.0
RUN curl -fsSLO "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-${ARCH}.tar.gz" \
 && curl -fsSL "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_checksums.txt" \
    | grep " hugo_${HUGO_VERSION}_linux-${ARCH}.tar.gz$" | sha256sum -c - \
 && tar -xzf "hugo_${HUGO_VERSION}_linux-${ARCH}.tar.gz" -C /usr/bin hugo \
 && rm "hugo_${HUGO_VERSION}_linux-${ARCH}.tar.gz" \
 && hugo version

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq
# JSON form, so that the script gets the stop signal (as PID 1)
WORKDIR /home/toolchain/scripts
CMD ["./start_hugo.sh"]



FROM alpine:latest AS toolchain

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

RUN  apk add --update --no-cache unzip curl jq docker-cli bash python3 py3-pip

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq

RUN pip3 install --break-system-packages pyyaml

ENTRYPOINT ["/home/toolchain/scripts/toolchain.sh"]
