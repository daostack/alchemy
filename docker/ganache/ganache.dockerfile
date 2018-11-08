FROM node

RUN git clone https://github.com/trufflesuite/ganache-cli.git ganache-cli
RUN npm i --save https://github.com/trufflesuite/ganache-core.git#develop
RUN cd /ganache-cli && npm i

# pulling in arc.js because we will use it to deploy our contracts
# TODO: in the subgraph repo, this is halded by the ops/gen.js script
RUN git clone https://github.com/daostack/arc.js.git
RUN cd /arc.js && npm install

WORKDIR ganache-cli
ENV DOCKER true

ENTRYPOINT ["npm", "start", "--"]
