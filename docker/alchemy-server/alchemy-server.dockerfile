FROM node:10.13.0

RUN apt install git
RUN git clone https://github.com/daostack/alchemy-server.git
ADD datasources.json /alchemy-server/server
RUN cd alchemy-server && npm install

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /wait

ADD entry.sh /entry.sh
RUN chmod +x /wait /entry.sh 
ENTRYPOINT [ "/entry.sh" ]
