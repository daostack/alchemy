FROM node:10.13.0

COPY . /alchemy/
RUN cd /alchemy && npm install

## Add the wait script to the image
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /wait

RUN chmod +x /wait
ENTRYPOINT [ "/entry.sh" ]
