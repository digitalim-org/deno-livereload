import { Server } from "http";
// import config from "config";

function handler(req: Request): Response {
  return new Response("Hello, World!");
}

const server = new Server({ port: 35729, handler });

export const start = () => {
  return server.listenAndServe();
};

export const stop = () => {
  server.close();
};
