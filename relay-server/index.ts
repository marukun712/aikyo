import { createServer } from "node:net";
import { createBroker } from "aedes";

const port = 1883;

const aedes = await createBroker();
const server = createServer(aedes.handle);

server.listen(port, function () {
  console.log("server started and listening on port ", port);
});
