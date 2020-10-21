FROM node:12-alpine3.10 AS build

LABEL maintainer="sebastian.raubach@hutton.ac.uk"

COPY qemu-arm-static /usr/bin/qemu-arm-static

ARG BRANCH=master

# Force docker to not cache the next line
ADD https://api.github.com/repos/cropgeeks/gridscore/git/refs/heads/master version.json
# Clone the GridScore server code and client code
RUN echo "Pulling GitHub branch: $BRANCH"
RUN apk add --no-cache git && \
    git clone -b "$BRANCH" --single-branch --depth 1 https://github.com/cropgeeks/gridscore-server.git /opt/gridscore-server && \
    git clone -b "$BRANCH" --single-branch --depth 1 https://github.com/cropgeeks/gridscore.git /opt/gridscore-client

# Build the client code
WORKDIR /opt/gridscore-client
RUN rm -f .env && \
    echo "VUE_APP_BASE_URL=./api/" > .env && \
    apk add --no-cache python build-base gcc wget && \
    npm i && \
    npm run build && \
    mkdir /opt/gridscore-server/client/ && \
    cp -a /opt/gridscore-client/dist/. /opt/gridscore-server/client/

# Download Gradle and build the server code
RUN apk add --no-cache openjdk11 && \
    wget https://services.gradle.org/distributions/gradle-6.0.1-bin.zip -P /tmp/ && \
    unzip /tmp/gradle-6.0.1-bin.zip -d /opt/ && \
    echo "config.folder=/data/gridscore" > /opt/gridscore-server/config.properties && \
    echo "project.name=gridscore" >> /opt/gridscore-server/gradle.properties && \
    /opt/gradle-6.0.1/bin/gradle -p /opt/gridscore-server war


FROM arm64v8/tomcat:8-jdk11

LABEL maintainer="sebastian.raubach@hutton.ac.uk"

COPY qemu-arm-static /usr/bin/qemu-arm-static

RUN mkdir -p /usr/local/tomcat/webapps && \
    rm -rf /usr/local/tomcat/webapps/ROOT

COPY --from=build /opt/gridscore-server/build/libs/gridscore-*.war /usr/local/tomcat/webapps/ROOT.war

WORKDIR /usr/local/tomcat/
