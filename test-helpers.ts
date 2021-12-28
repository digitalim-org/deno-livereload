const noOp = () => Promise.resolve();
const isPromise = (candidate: unknown) => candidate instanceof Promise;

interface Test {
  name: string;
  fn: (t: Deno.TestContext) => void | Promise<void>;
}

class TestRunner {
  #tests: Record<string, Test[]> = {};
  #beforeEach = noOp;
  #afterEach = noOp;
  #hasStarted = false;
  #pendingTests = 0;

  setBeforeEach(fn: () => Promise<void>) {
    this.#beforeEach = fn;
  }

  setAfterEach(fn: () => Promise<void>) {
    this.#afterEach = fn;
  }

  addTest(test: Test, group: string) {
    this.#tests[group] = this.#tests[group] || [];
    this.#tests[group].push(test);
  }

  async runGroup(group: string) {
    await Promise.all(this.#tests[group].map((test) => this.testWrapper(test)));
  }

  testWrapper(test: Test) {
    this.#pendingTests++;
    Deno.test(test.name, async (t) => {
      await this.#beforeEach();
      const res = test.fn(t);
      if (res instanceof Promise) {
        await res;
      }
      await this.#afterEach();
    });
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

const promiseWrapper = (fn: (...args: unknown[]) => void | Promise<void>) =>
  (...args: unknown[]) =>
    new Promise<void>((resolve, reject) => {
      const maybePromise = fn(...args);
      if (isPromise(maybePromise)) {
        (maybePromise as Promise<void>).then(resolve).catch(reject);
      } else {
        resolve();
      }
    });

export const afterEach = (fn: () => void | Promise<void>) => {
  testRunner.setAfterEach(promiseWrapper(fn));
};

export const beforeEach = (fn: () => void | Promise<void>) => {
  testRunner.setBeforeEach(promiseWrapper(fn));
};
