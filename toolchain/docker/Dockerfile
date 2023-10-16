FROM alpine:latest AS arangoproxy

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

COPY --from=golang:alpine /usr/local/go/ /usr/local/go/
 
ENV PATH="/usr/local/go/bin:${PATH}"

RUN apk add --update --no-cache nodejs npm bash curl

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq
RUN npm install -g @apidevtools/swagger-cli

CMD cd /home/toolchain/scripts ; ./start_arangoproxy.sh






FROM alpine:latest AS hugo

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

COPY --from=golang:alpine /usr/local/go/ /usr/local/go/
ENV PATH="/usr/local/go/bin:${PATH}"

RUN apk add --update --no-cache git curl bash
RUN apk add --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community --no-cache hugo

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq
CMD cd /home/toolchain/scripts ; ./start_hugo.sh



FROM alpine:latest AS toolchain

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

RUN  apk add --update --no-cache unzip curl jq docker-cli bash python3 py3-pip

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq
RUN wget https://github.com/arangodb-managed/oasisctl/releases/download/v1.19.0/oasisctl.zip && unzip oasisctl.zip
RUN mv bin/linux/arm/ bin/linux/arm64
RUN cd bin/linux/$ARCH && mv oasisctl /usr/bin/oasisctl && chmod +x /usr/bin/oasisctl

RUN pip3 install pyyaml

ENTRYPOINT ["/home/toolchain/scripts/toolchain.sh"]
