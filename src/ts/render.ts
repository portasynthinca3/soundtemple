interface WasmExports {
    add(a: number, b: number): number;
}

export type MsgToRenderer =
    { type: "init" } |
    { type: "test" };

export type MsgFromRenderer =
    { type: "error", msg: string };

let wasmResolve: (exp: WasmExports) => any;
let wasmReady = new Promise<WasmExports>((resolve) => {
    wasmResolve = resolve;
});

self.addEventListener("message", async (event: MessageEvent<MsgToRenderer>) => {
    const data = event.data;

    if(data.type === "init") {
        try {
            const results = await WebAssembly.instantiateStreaming(fetch("index.wasm"));
            console.log("loaded index.wasm");
            wasmResolve(results.instance.exports as unknown as WasmExports);
        } catch(ex) {
            self.postMessage({ type: "error", msg: "failed to load wasm" })
        }
    }

    else if(data.type === "test") {
        const exports = await wasmReady;
        console.log(exports.add(3, 5));
    }
});
