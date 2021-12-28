import { Server } from "http";
import config from "config";

const liveReloadScript = Deno.readTextFileSync("./livereload.min.js");

const isWebSocketRequest = (req: Request) =>
  req.headers.get("connection") === "Upgrade" &&
  req.headers.get("upgrade") === "websocket";

function handler(req: Request): Response {
  // It really doesn't matter what path we serve the file from since this *should* be the only
  // thing running on the LiveReload port.
  //
  // That being the case, since the protocol doesn't specify that the script be served *only* from
  // /livereload.js, we can simplify our handling logic to serve the file to any request.
  //
  // Same with the WebSocket connection. Any path will do.
  if (isWebSocketRequest(req)) {
    const { response, socket } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        command: "hello",
        protocols: ["http://livereload.com/protocols/official-7"],
      }));
    };
    socket.onmessage = () => {};
    socket.onerror = (evt) => {
      console.error("server err:::" + (evt as ErrorEvent).message);
    };
    socket.onclose = () => {
      console.log("socket closed");
    };

    return response;
  } else {
    return new Response(liveReloadScript, {
      status: 200,
      headers: {
        "content-type": "text/javascript",
      },
    });
  }
}

let server: Server;

export const start = () => {
  server = new Server({ port: config.port, hostname: config.host, handler });
  return server.listenAndServe();
};

export const stop = () => {
  server.close();
};
