# code was lifted from https://hub.docker.com/r/consensysllc/go-ipfs/

FROM ipfs/go-ipfs:latest

USER root
COPY start_ipfs.sh /start_ipfs
RUN chmod a+x /start_ipfs
USER ipfs
ENTRYPOINT ["/start_ipfs"]
