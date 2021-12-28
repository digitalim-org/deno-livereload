import { Server } from "http";
import config from "config";

const liveReloadScript = Deno.readTextFileSync("./livereload.min.js");

function handler(_: Request): Response {
  // It really doesn't matter what path we serve the file from since this *should* be the only
  // thing running on the LiveReload port.
  //
  // That being the case, since the protocol doesn't specify that the script be served *only* from
  // /livereload.js, we can simplify our handling logic to serve the file to any request.
  return new Response(liveReloadScript, {
    status: 200,
    headers: {
      "content-type": "text/javascript",
    },
  });
}

let server: Server;

export const start = () => {
  server = new Server({ port: config.port, hostname: config.host, handler });
  return server.listenAndServe();
};

export const stop = () => {
  server.close();
};
