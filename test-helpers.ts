const noOp = () => {};
const isPromise = (candidate: unknown) => candidate instanceof Promise;

interface Test {
  name: string;
  fn: (t: Deno.TestContext) => void | Promise<void>;
}

class TestRunner {
  #tests: Record<string, Test[]> = {};
  #beforeAll = noOp;
  #afterAll = noOp;
  #hasStarted = false;
  #pendingTests = 0;

  setBeforeAll(fn: () => void | Promise<void>) {
    this.#beforeAll = fn;
  }

  setAfterAll(fn: () => void | Promise<void>) {
    this.#afterAll = fn;
  }

  addTest(test: Test, group: string) {
    this.#tests[group] = this.#tests[group] || [];
    this.#tests[group].push(test);
  }

  async #markTestDone() {
    this.#pendingTests--;
    if (this.#pendingTests === 0) {
      console.log("===teardown");
      const maybePromise = this.#afterAll();
      if (isPromise(maybePromise)) {
        await maybePromise;
      }
    }
  }

  async start() {
    console.log("===setup");
    const maybePromise = this.#beforeAll();
    if (isPromise(maybePromise)) {
      await maybePromise;
    }
    this.#hasStarted = true;
  }

  async runGroup(group: string) {
    await Promise.all(this.#tests[group].map((test) => this.testWrapper(test)));
  }

  testWrapper(test: Test) {
    this.#pendingTests++;
    Deno.test(test.name, async (t) => {
      if (!this.#hasStarted) {
        await this.start();
      }
      const res = test.fn(t);
      if (res instanceof Promise) {
        await res.then(() => {
          return this.#markTestDone();
        });
      } else {
        const markTestDone = this.#markTestDone();
        if (isPromise(markTestDone)) {
          await markTestDone;
        }
      }
    });

    console.log("===test finished");
  }
}

const testRunner = new TestRunner();

let groupCursor: string;

export const describe = (
  name: string,
  fn: () => void,
) => {
  groupCursor = name;
  fn();
  testRunner.runGroup(name);
};

export const it = (
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
) => {
  testRunner.addTest({ name, fn }, groupCursor);
};

export const afterAll = (fn: () => void) => {
  testRunner.setAfterAll(fn);
};

export const beforeAll = (fn: () => void | Promise<void>) => {
  testRunner.setBeforeAll(fn);
};
