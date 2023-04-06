# FROM  AS compile

# RUN git clone --depth 1 https://github.com/arangodb/arangodb.git --branch devel --recurse-submodules --shallow-submodules -j 8 
# WORKDIR arangodb/

# RUN pwd
# RUN ls
# RUN cmake --preset community-pr -DCMAKE_C_COMPILER=gcc -DCMAKE_CXX_COMPILER=g++ -DCMAKE_EXE_LINKER_FLAGS="-fuse-ld=lld" -DCMAKE_LIBRARY_PATH=$OPENSSL_ROOT_DIR/lib

# RUN  cmake --build --preset community-pr --parallel 8 --target arangodbtests arangod arangosh arangoimport arangoexport arangodump arangorestore arangobench fuertetest
# RUN find build/ -iname *.a -delete || true && find build/ -iname *.o -delete || true


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
