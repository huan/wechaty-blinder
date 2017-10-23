FROM zixia/wechaty:onbuild

RUN apt-get update && apt-get install \
    fonts-arphic-ukai \
    ttf-wqy-zenhei \
    && rm -rf /tmp/* /var/lib/apt/lists/*
