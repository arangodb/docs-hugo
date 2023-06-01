FROM golang:1.19 AS arangoproxy

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}
RUN apt-get update && apt-get install -y \
    python3.6

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq

CMD cd /home/toolchain/scripts ; ./start_arangoproxy.sh






FROM golang:1.19 AS hugo

RUN apt-get update && \
    apt-get install -y git curl

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq
RUN wget -q https://github.com/gohugoio/hugo/releases/download/v0.112.5/hugo_0.112.5_linux-$ARCH.deb -O hugo.deb
RUN apt-get install -y ./hugo.deb

CMD cd /home/toolchain/scripts ; ./start_hugo.sh



FROM ubuntu:latest AS toolchain

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

RUN  apt-get update \
  && apt-get install -y wget python3 python3-pip software-properties-common curl jq

RUN wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$ARCH -O /usr/bin/yq && chmod +x /usr/bin/yq

## Install python scripts deps
RUN pip3 install pyyaml


## Install npm for swagger-cli usage
RUN curl -sL https://deb.nodesource.com/setup_18.x  | bash -
RUN apt-get -y install nodejs
RUN npm install -g @apidevtools/swagger-cli

RUN curl -fsSL https://get.docker.com -o get-docker.sh
RUN sh get-docker.sh



CMD cd /home/toolchain/scripts ; ./toolchain.sh
