FROM zixia/facenet
LABEL maintainer="Huan LI <zixia@zixia.net>"

RUN sudo apt-get update \
    && sudo apt-get install -y --no-install-recommends \
      build-essential \
      fontconfig \
      fontconfig-config \
      fonts-arphic-ukai \
      fonts-dejavu-core \
      fonts-wqy-zenhei \
      git \
      jq \
      libcairo2-dev \
      libfontconfig1 \
      libgif-dev \
      libjpeg8-dev \
      libpango1.0-dev \
      moreutils \
      python2.7 \
      python3-venv \
      ttf-freefont \
      ttf-wqy-zenhei \
      ucf \
    && sudo rm -rf /tmp/* /var/lib/apt/lists/* \
    && sudo apt-get purge --auto-remove

# https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md
# https://github.com/ebidel/try-puppeteer/blob/master/backend/Dockerfile
# Install latest chrome dev package.
# Note: this also installs the necessary libs so we don't need the previous RUN command.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update && apt-get install -y --no-install-recommends \
      google-chrome-unstable \
    && rm -rf /usr/bin/google-chrome* /opt/google/chrome-unstable \
    && apt-get purge --auto-remove \
    && rm -rf /tmp/* /var/lib/apt/lists/*

RUN [ -e /workdir ] || sudo mkdir /workdir \
  && sudo chown -R "$(id -nu)":"$(id -ng)" /workdir
VOLUME /workdir

RUN [ -e /blinder ] || sudo mkdir /blinder \
  && sudo chown -R "$(id -nu)":"$(id -ng)" /blinder

WORKDIR /blinder
COPY package.json .
RUN sudo chown "$(id -nu)" package.json \
    && jq 'del(.dependencies.facenet)' package.json | sponge package.json \
    && npm install \
    && rm -fr /tmp/* ~/.npm

COPY . .

CMD [ "npm", "start" ]
