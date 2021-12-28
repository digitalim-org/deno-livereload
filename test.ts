import { assert, assertEquals } from "asserts";
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

describe("HTTP Server", () => {
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
