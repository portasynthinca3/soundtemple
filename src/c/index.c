#include "wasm.h"

int sub(int a, int b) {
    return a - b;
}

export int add(int a, int b) {
    return sub(a, -b);
}
