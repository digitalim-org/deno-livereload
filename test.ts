import { assert, assertEquals, fail } from "asserts";
import { start, stop } from "./mod.ts";
import config from "config";
import { afterEach, beforeEach, describe, it } from "./test-helpers.ts";
import { delay } from "https://deno.land/std/async/mod.ts";

const { port, host, protocol } = config;

beforeEach(async () => {
  // Make sure something isn't already listening on the port
  const listener = await Deno.listen({ port, hostname: host });
  listener.close();
  start();
});

afterEach(async () => {
  stop();
  // Server.close isn't truly synchronous
  await delay(10);
});

describe("HTTP", () => {
  it(`listens on the LiveReload port ${port}`, async () => {
    const foo = await fetch(`${protocol}://${host}:${port}`);
    await foo.body!.cancel();
  });

  it("serves the livereload.js file from /livereload.js", async () => {
    const res = await fetch(`${protocol}://${host}:${port}/livereload.js`);
    const script = await res.text();
    assertEquals(res.headers.get("content-type"), "text/javascript");

    const expected = Deno.readTextFileSync("./livereload.min.js");
    assertEquals(script, expected, "livereload.js is served");
  });
});

describe("WebSocket", () => {
  let webSocket: WebSocket;
  beforeEach(() => {
    webSocket = new WebSocket(`ws://${host}:${port}/livereload`);
    webSocket.onerror = (evt) => {
      if (evt instanceof ErrorEvent) {
        fail(evt.message);
      } else {
        fail("WebSocket failed to connect");
      }
    };
  });
  afterEach(() => {
    webSocket.close();
    webSocket.onerror = () => {};
    webSocket.onopen = () => {};
  });

  it("establishes a WebSocket connection", () => {
    return new Promise<void>((resolve) => {
      webSocket.onopen = () => {
        resolve();
      };
    });
  });
  it("sends a 'hello' command with official-7 protocol on open", () => {
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        fail("Timed out");
      }, 500);
      webSocket.onmessage = (ev) => {
        clearTimeout(timeout);
        try {
          const data = JSON.parse(ev.data);
          assertEquals(data.command, "hello");
          assertEquals(
            data.protocols[0],
            "http://livereload.com/protocols/official-7",
          );
          resolve();
        } catch (e) {
          console.error(e);
          fail("Message must be JSON");
        }
      };
    });
  });
});
