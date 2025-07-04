import {
    AsyncLocalStorage,
    AsyncResource,
    asyncWrapProviders,
    createHook,
    executionAsyncId,
    executionAsyncResource,
    HookCallbacks,
    triggerAsyncId,
} from "node:async_hooks";

{
    const hooks: HookCallbacks = {
        init() {},
        before() {},
        after() {},
        destroy() {},
        promiseResolve() {},
    };

    const asyncHook = createHook(hooks);

    asyncHook.enable().disable().enable();

    const tId: number = triggerAsyncId();
    const eId: number = executionAsyncId();
    const curRes: object = executionAsyncResource();

    class TestResource extends AsyncResource {
        constructor() {
            super("TEST_RESOURCE");
        }
    }

    class AnotherTestResource extends AsyncResource {
        constructor() {
            super("TEST_RESOURCE", 42);
            const aId: number = this.asyncId();
            const tId: number = this.triggerAsyncId();
        }
        run() {
            this.runInAsyncScope(() => {});
            this.runInAsyncScope(Array.prototype.find, [], () => true);
        }
        destroy() {
            this.emitDestroy();
        }
    }

    // check AsyncResource constructor options.
    new AsyncResource("");
    new AsyncResource("", 0);
    new AsyncResource("", {});
    new AsyncResource("", { triggerAsyncId: 0 });
    new AsyncResource("", {
        triggerAsyncId: 0,
        requireManualDestroy: true,
    });

    let res = AsyncResource.bind((x: number) => x)(42);
    const asyncResource = new AsyncResource("");
    res = asyncResource.bind((x: number) => x)(42);
    // $ExpectType AsyncResource
    asyncResource.emitDestroy();

    AsyncResource.bind(
        function() {
            this.a; // $ExpectType number
        },
        "test",
        {
            a: 1,
        },
    );
}

{
    const ctx = new AsyncLocalStorage<string>();
    ctx.disable();
    const exitResult: number = ctx.exit((a: number) => {
        return 42;
    }, 1);
    const runResult: number = ctx.run("test", (a: number) => {
        const store: string | undefined = ctx.getStore();
        return 42;
    }, 1);
    ctx.enterWith("test");
}

{
    const fn = AsyncLocalStorage.bind(() => 123);
    fn(); // $ExpectType number
}

{
    const asyncLocalStorage = new AsyncLocalStorage<number>();
    const runInAsyncScope = asyncLocalStorage.run(123, () => AsyncLocalStorage.snapshot());
    const result = asyncLocalStorage.run(321, () => { // $ExpectType number | undefined
        return runInAsyncScope(() => asyncLocalStorage.getStore());
    });
}

{
    const asyncLocalStorage = new AsyncLocalStorage({ defaultValue: {}, name: "storage" });
    asyncLocalStorage.name; // $ExpectType string
}

{
    // $ExpectType number
    asyncWrapProviders.NONE;
    // $ExpectType number
    asyncWrapProviders.DIRHANDLE;

    // $ExpectType number
    asyncWrapProviders.TLSWRAP;
    // $ExpectType number
    asyncWrapProviders.VERIFYREQUEST;

    // @ts-expect-error - Cannot assign to asyncWrapProviders.NONE
    asyncWrapProviders.NONE = 1;
    // @ts-expect-error - Cannot assign to asyncWrapProviders['...']
    asyncWrapProviders.foo = 1;
}
