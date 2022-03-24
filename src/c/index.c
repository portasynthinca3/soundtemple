#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include "wasm.h"

#define min(a, b) ((a) <= (b) ? (a) : (b))
#define max(a, b) ((a) >= (b) ? (a) : (b))

#define COLOR_BLACK   0xFF000000
#define COLOR_IBLACK  0xFF555555
#define COLOR_BLUE    0xFFAA0000
#define COLOR_IBLUE   0xFFFF5555
#define COLOR_GREEN   0xFF00AA00
#define COLOR_IGREEN  0xFF55FF55
#define COLOR_CYAN    0xFFAAAA00
#define COLOR_ICYAN   0xFFFFFF55
#define COLOR_RED     0xFF0000AA
#define COLOR_IRED    0xFF5555FF
#define COLOR_PINK    0xFFAA00AA
#define COLOR_IPINK   0xFFFF55FF
#define COLOR_YELLOW  0xFF00AAAA
#define COLOR_IYELLOW 0xFF55FFFF
#define COLOR_WHITE   0xFFAAAAAA
#define COLOR_IWHITE  0xFFFFFFFF

import void log_int(int);


typedef int16_t sample_t;

typedef struct __attribute__((packed)) {
    uint32_t size;
    uint32_t rate;
    sample_t buffer[1];
} audio_t;

typedef union __attribute__((packed)) {
    uint32_t raw; // <- little endian, ABGR order
    struct __attribute__((packed)) {
        uint8_t r;
        uint8_t g;
        uint8_t b;
        uint8_t a;
    };
} pixel_t;

typedef struct __attribute__((packed)) {
    uint32_t size_x;
    uint32_t size_y;
    pixel_t buffer[1];
} graphics_t;


#define HISTORY_LEN 2 * 4410
sample_t audio_history[HISTORY_LEN];


export void render_frame(graphics_t* gr, uint32_t time) {
    memset(gr->buffer, 0, gr->size_x * gr->size_y * sizeof(pixel_t));

    // find a starting point (trigger)
    int32_t max_diff = -1;
    uint32_t start = HISTORY_LEN - (gr->size_x / 2);
    for(uint32_t i = start + 1; i > gr->size_x / 2 + 1; i--) {
        // find the point with the max difference
        int32_t diff = (int32_t)audio_history[i] - (int32_t)audio_history[i + 1];
        if(diff > max_diff) {
            max_diff = diff;
            start = i;
        }
    }

    // we want the trigger point to be in the middle of the screen
    start -= gr->size_x / 2;

    int32_t half_height = (int32_t)gr->size_y / 2;
    int32_t last_sample = audio_history[start - 1];
    for(uint32_t x = 0; x < gr->size_x; x++) {
        int32_t sample = audio_history[start + x];
        // repetition, yes, i know
        int32_t pos = gr->size_y - (sample * half_height / INT16_MAX) - half_height - 1;
        int32_t last_pos = gr->size_y - (last_sample * half_height / INT16_MAX) - half_height - 1;

        // draw lines (we don't want a bunch of disconnected points)
        if(abs(pos - last_pos) <= 1) {
            uint32_t offs = (pos * gr->size_x) + x;
            gr->buffer[offs].raw = COLOR_BLUE;
        } else {
            int32_t lesser = min(pos, last_pos);
            int32_t greater = max(pos, last_pos);
            int32_t half_diff = (greater - lesser) / 2;
            for(uint32_t y = lesser; y < lesser + half_diff; y++) {
                uint32_t offs = (y * gr->size_x) + x;
                if(last_pos < pos) offs -= 1;
                gr->buffer[offs].raw = COLOR_BLUE;
            }
            for(uint32_t y = lesser + half_diff; y <= greater; y++) {
                uint32_t offs = (y * gr->size_x) + x;
                if(last_pos > pos) offs -= 1;
                gr->buffer[offs].raw = COLOR_BLUE;
            }
        }

        last_sample = sample;
    }
}


float lpf_last = 0;
export void render_audio(audio_t* audio, uint32_t time) {
    uint64_t phase = time * audio->rate / 1000;

    // generate waveform
    for(uint32_t i = 0; i < audio->size; i++) {
        audio->buffer[i] = ((phase % 256) > 128) * 50 * 256 - (256 * 25);
        // audio->buffer[i] = (phase % 256) * 50 - (256 * 25);
        phase++;
    }

    // apply low-pass filter
    float beta = 0.5;
    for(uint32_t i = 1; i < audio->size; i++) {
        lpf_last = lpf_last - (beta * (lpf_last - (float)audio->buffer[i]));
        audio->buffer[i] = (int16_t)lpf_last;
    }

    // shift old data
    sample_t* new_target = audio_history + HISTORY_LEN - audio->size;
    // memmove(audio_history, new_target, (HISTORY_LEN - audio->size) * sizeof(sample_t));
    // fill new data in
    memcpy(new_target, audio->buffer, audio->size * sizeof(sample_t));
}
