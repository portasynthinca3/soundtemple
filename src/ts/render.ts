interface WasmExports {
    render_frame(graphics: number, time: number): void;
    render_audio(audio: number, time: number): void;
    malloc(bytes: number): number;
}

export type MsgToRenderer =
    { type: "init", size: [number, number] } |
    { type: "frame" } |
    { type: "audio" };

export type MsgFromRenderer =
    { type: "error", msg: string } |
    { type: "imgData", data: ImageData } |
    { type: "audioData", data: null };

let wasmResolve: (exp: WasmExports) => any;
const wasmReady = new Promise<WasmExports>((res) => wasmResolve = res);

let memory: WebAssembly.Memory|null = null;
let imageData: ImageData|null = null;
let graphicsBuffer = 0;
let audioBuffer = 0;

self.addEventListener("message", async (event: MessageEvent<MsgToRenderer>) => {
    const data = event.data;

    if(data.type === "init") {
        const [x, y] = data.size;
        const imgBufSize = x * y * 4;
        const audioBufSize = 4410 * 2;
        console.log(`canvas size: ${x}x${y}`);

        try {
            memory = new WebAssembly.Memory({ initial: 2 });
            const { instance } = await WebAssembly.instantiateStreaming(fetch("index.wasm"), {
                env: {
                    memory,
                    log_int: (i: number) => console.log(i)
                }
            });
            const exports = instance.exports as unknown as WasmExports;
            console.log("loaded index.wasm");

            graphicsBuffer = exports.malloc(imgBufSize + 8);
            audioBuffer = exports.malloc(audioBufSize + 8);
            console.log("allocated memory");

            // write sizes
            const graphicsView = new Uint32Array(memory.buffer, graphicsBuffer);
            graphicsView[0] = x;
            graphicsView[1] = y;
            const audioView = new Uint32Array(memory.buffer, audioBuffer);
            audioView[0] = 4410;
            audioView[1] = 44100;

            imageData = new ImageData(new Uint8ClampedArray(memory.buffer, graphicsBuffer + 8, imgBufSize), x, y);
            console.log("created graphics imageData");

            wasmResolve(exports as unknown as WasmExports);
        } catch(ex) {
            console.error(ex);
            self.postMessage({ type: "error", msg: `failed to load wasm: ${ex}` });
        }
    }

    else if(data.type === "frame") {
        const exports = await wasmReady;
        exports.render_frame(graphicsBuffer, performance.now());
        self.postMessage({ type: "imgData", data: imageData! });
    }

    else if(data.type === "audio") {
        const exports = await wasmReady;
        exports.render_audio(audioBuffer, performance.now());
        self.postMessage({ type: "audioData", data: null });
    }
});
