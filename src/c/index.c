#include <stdlib.h>
#include <string.h>
#include "wasm.h"

typedef unsigned char uint8_t;
typedef unsigned int  uint32_t;
typedef uint8_t       sam_t;

typedef union __attribute__((packed)) {
    uint32_t raw;
    struct __attribute__((packed)) {
        uint8_t r;
        uint8_t g;
        uint8_t b;
        uint8_t a;
    };
} pix_t;

typedef struct __attribute__((packed)) {
    uint32_t size_x;
    uint32_t size_y;
    pix_t buffer[1];
} graphics_t;

export void render_frame(graphics_t* graphics) {
    #define gr (*graphics)

    for(uint32_t x = 0; x < gr.size_x; x++) {
        for(uint32_t y = 0; y < gr.size_y; y++) {
            uint32_t offs = (y * gr.size_x) + x;

            gr.buffer[offs].r = x * 8;
            gr.buffer[offs].g = y * 8;
            gr.buffer[offs].b = 8 * ((x / 8) + (y / 8));
            gr.buffer[offs].a = 255;
        }
    }

    #undef gr
}
