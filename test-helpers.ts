const noOp = () => {};
let _beforeAll, _afterAll: () => void | Promise<void> = noOp;
let pendingTests = 0;

const isPromise = (candidate: unknown) => candidate instanceof Promise;

export const it = (
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
) => {
  pendingTests++;
  return Deno.test(name, (t) => {
    const res = fn(t);
    if (res instanceof Promise) {
      return res.then(() => {
        pendingTests--;
        if (pendingTests === 0) {
          const _afterAllRes = _afterAll();
          if (isPromise(_afterAllRes)) {
            return _afterAllRes;
          }
        }
      });
    } else {
      pendingTests--;
      if (pendingTests === 0) {
        const _afterAllRes = _afterAll();
        if (isPromise(_afterAllRes)) {
          return _afterAllRes;
        }
      }
    }
  });
};

export const afterAll = (fn: () => void) => {
  _afterAll = fn;
};
