import { assertRejects } from "asserts";
import { start, stop } from "./mod.ts";
import config from "config";
import { afterAll, it } from "./test-helpers.ts";
import { delay } from "https://deno.land/std/async/mod.ts";

const { port, host, protocol } = config;

afterAll(async () => {
  stop();
  // Server.close isn't truly synchronous
  await delay(10);
});

it(
  `listens on the LiveReload port ${port}`,
  async () => {
    // Make sure something isn't already listening on the port
    const listener = await Deno.listen({ port, hostname: host });
    listener.close();

    start();
    const foo = await fetch(`${protocol}://${host}:${port}`);
    await foo.body!.cancel();
  },
);
