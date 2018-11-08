FROM node

RUN git clone https://github.com/trufflesuite/ganache-cli.git ganache-cli
RUN npm i --save https://github.com/trufflesuite/ganache-core.git#develop
RUN cd /ganache-cli && npm i

WORKDIR ganache-cli
ENV DOCKER true

ENTRYPOINT ["npm", "start", "--"]
