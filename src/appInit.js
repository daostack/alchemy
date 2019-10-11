const Server = require("./server.js");

const port = (process.env.PORT || 8080);
const app = Server.app();

app.listen(port);
// eslint-disable-next-line no-console
console.log(`Listening at http://127.0.0.1:${port}`);
