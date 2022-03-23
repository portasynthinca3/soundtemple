function $<T extends HTMLElement>(selector: string) {
    return document.querySelector(selector) as unknown as T;
}

if(!WebAssembly)
    unsupportedError("WebAssembly");
if(!WebAssembly.instantiateStreaming)
    unsupportedError("instantiateStreaming");
if(!String.prototype.matchAll)
    unsupportedError("matchAll");

// update time and fake CPU usage
setInterval(() => {
    const time = new Date().toLocaleTimeString("en-US", {
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    let status = `${time} CPU`;
    for(let i = 0; i < 8; i++)
        status += `0${Math.round(Math.random() * 8) + 1} `;
    
    document.body.setAttribute("data-win-left", status);
}, 500);

// update caret position
const poem = $<HTMLTextAreaElement>("#poem");
const caret = $<HTMLDivElement>("#caret");
poem.addEventListener("keyup", updateCaret);
poem.addEventListener("keydown", updateCaret);
poem.addEventListener("input", updateCaret);
poem.addEventListener("click", updateCaret);
poem.addEventListener("scroll", updateCaret);
function updateCaret() {
    // take line wrapping and scrolling into account
    const upToCaret = poem.value.substring(0, poem.selectionEnd);
    const lines = [...upToCaret.matchAll(/(.{1,40})|(^$)/gm)];
    if(lines.length === 0) {
        caret.style.top = caret.style.left = "1em";
        return;
    }
    const left = lines[lines.length - 1][0].length;
    const top = lines.length - 1;
    caret.style.top = `calc(${top + 1}em - ${poem.scrollTop}px)`;
    caret.style.left = `${left + 1}em`;
}
updateCaret();

// update caret visibility
poem.addEventListener("focus", updateCaretVis);
poem.addEventListener("blur", updateCaretVis);
function updateCaretVis() {
    if(document.activeElement === poem)
        caret.style.opacity = "1";
    else
        caret.style.opacity = "0";
}
poem.focus();
updateCaretVis();

document.addEventListener("keydown", () => poem.focus());

function unsupportedError(feat: string) {
    $<HTMLSpanElement>("#missing-support #feature").innerText = feat;
    $<HTMLDivElement>("#missing-support").style.display = "flex";
    throw Error(`No ${feat} support`);
}

const worker = new Worker("./render.js");
worker.postMessage({ type: "init" });
worker.postMessage({ type: "test" });
