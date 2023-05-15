FROM ubuntu:latest AS arangoproxy

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}
RUN apt-get update && apt-get install -y \
    python3.6
CMD cd /home/toolchain/scripts ; ./start_arangoproxy.sh






FROM ubuntu:latest AS hugo

RUN apt-get update && \
    apt-get install -y git curl

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

CMD cd /home/toolchain/scripts ; ./start_hugo.sh



FROM ubuntu:latest AS toolchain

RUN  apt-get update \
  && apt-get install -y wget python3 python3-pip software-properties-common curl jq

## Install python scripts deps
RUN pip3 install pyyaml


## Install npm for swagger-cli usage
RUN curl -sL https://deb.nodesource.com/setup_18.x  | bash -
RUN apt-get -y install nodejs
RUN npm install -g @apidevtools/swagger-cli

RUN curl -fsSL https://get.docker.com -o get-docker.sh
RUN sh get-docker.sh

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

CMD cd /home/toolchain/scripts ; ./toolchain.sh
