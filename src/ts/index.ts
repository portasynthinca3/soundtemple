function $<T extends HTMLElement>(selector: string) {
    return document.querySelector(selector) as unknown as T;
}

// update time and fake CPU usage
setInterval(() => {
    const time = new Date().toLocaleTimeString("en-US", {
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
    const cpu = Math.round(Math.random() * 10);
    document.body.setAttribute("data-win-left", `${time} CPU ${cpu}`);
}, 500);

function unsupportedError(feat: string) {
    $<HTMLSpanElement>("#missing-support #feature").innerText = feat;
    $<HTMLDivElement>("#missing-support").style.display = "flex";
    throw Error(`No ${feat} support`);
}

if(!WebAssembly)
    unsupportedError("WebAssembly");
if(!WebAssembly.instantiateStreaming)
    unsupportedError("instantiateStreaming");

const worker = new Worker("./render.js");
worker.postMessage({ type: "init" });
worker.postMessage({ type: "test" });
