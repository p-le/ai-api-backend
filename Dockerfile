FROM node:7.9.0-alpine
MAINTAINER phu.le.dev@gmail.com
ENV PORT 2712
ENV LANG C.UTF-8

RUN apk add --update --no-cache ca-certificates python python-dev py-pip gcc musl-dev build-base linux-headers freetype-dev
RUN pip install -U pip --no-cache-dir
RUN ln -s /usr/include/locale.h /usr/include/xlocale.h
RUN pip install numpy --no-cache-dir


ENTRYPOINT ["/bin/sh"]


