# arangoproxy
FROM golang:1.19 AS arangoproxy

ARG BUILDARCH
RUN echo ${BUILDARCH}
ENV ARCH=${BUILDARCH}
RUN apt-get update && apt-get install -y \
    python3.6
CMD ["bash", "-c", "/home/scripts/$ARCH/start_arangoproxy.sh"]


FROM golang:1.19 AS hugo

RUN apt-get update && \
    apt-get install -y git curl

# Download Hugo deb file
RUN curl -L https://github.com/gohugoio/hugo/releases/download/v0.109.0/hugo_0.109.0_linux-amd64.deb -o hugo.deb

# Install Hugo
RUN apt-get install -y  ./*.deb

CMD ["bash", "-c", "/home/start_hugo.sh"]
