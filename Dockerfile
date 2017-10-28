FROM ubuntu:17.10
LABEL maintainer="Huan LI <zixia@zixia.net>"

ENV DEBIAN_FRONTEND     noninteractive
ENV LC_ALL              C.UTF-8
ENV NODE_ENV            $NODE_ENV
ENV NPM_CONFIG_LOGLEVEL warn

RUN apt-get update && apt-get install -y --no-install-recommends \
      bash \
      build-essential \
      ca-certificates \
      curl \
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
      sudo \
      ttf-freefont \
      ttf-wqy-zenhei \
      ucf \
      wget \
      vim \
    && rm -rf /tmp/* /var/lib/apt/lists/* \
    && apt-get purge --auto-remove

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /tmp/* /var/lib/apt/lists/* \
    && apt-get purge --auto-remove

# https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md
# https://github.com/ebidel/try-puppeteer/blob/master/backend/Dockerfile
# Install latest chrome dev package.
# Note: this also installs the necessary libs so we don't need the previous RUN command.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove

RUN groupadd -r blinder && useradd -r -g blinder -d /bot -m -G audio,video,sudo blinder \
    && mkdir -p /blinder/Downloads \
    && chown -R blinder:blinder /blinder \
    && echo "blinder   ALL=NOPASSWD:ALL" >> /etc/sudoers

RUN mkdir /workdir && chown -R blinder:blinder /workdir
VOLUME /workdir

# Run user as non privileged.
USER    blinder
WORKDIR /blinder/

COPY package.json .
RUN npm install && rm -fr /tmp/* ~/.npm
COPY . .

CMD [ "npm", "start" ]


