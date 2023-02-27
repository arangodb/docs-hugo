# arangoproxy
FROM golang:1.19 AS arangoproxy

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}
RUN apt-get update && apt-get install -y \
    python3.6
CMD ["bash", "-c", "/home/scripts/start_arangoproxy.sh"]


FROM golang:1.19 AS hugo

RUN apt-get update && \
    apt-get install -y git curl

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}

CMD ["bash", "-c", "/home/scripts/start_hugo.sh"]
