#include <stdint.h>

typedef struct {
    int a;
    float b;
    char c[10];
    long long d;
    unsigned char e;
} Data;

Data data = {1, 2.3f, "hello", 5ll, 255U};

uintptr_t get() {
    return (uintptr_t)&data;
}

// emcc -o a.wasm a.c --no-entry -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS="['_get']"