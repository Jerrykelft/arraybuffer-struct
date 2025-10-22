> ⚠️ Disclaimer:  
> The English here might be pretty rough.  
> This README was created with AI assistance + Google Translate,  
> so please forgive any awkward phrasing!  
> Also, if you're a beginner struggling with GitHub/NPM, you're not alone — this stuff can be a real headache. 😅

# arraybuffer-struct
A JavaScript library for working with memory buffers as struct types.

# Usage

`i8`: int8 1 byte, range: -128 to 127  
`u8`: uint8 1 byte, range: 0 to 255  
`u8c`: uint8 clamped 1 byte, range: 0 to 255, clamps values outside the range to 0 or 255  
`i16`: int16 2 bytes, range: -32768 to 32767  
`u16`: uint16 2 bytes, range: 0 to 65535  
`i32`: int32 4 bytes, range: -2147483648 to 2147483647  
`u32`: uint32 4 bytes, range: 0 to 4294967295  
`i64`: int64 8 bytes, range: -9223372036854775808 to 9223372036854775807  
`u64`: uint64 8 bytes, range: 0 to 18446744073709551615  
`f16`: float16 2 bytes, range: 6.103515625e-05 to 65504  
`f32`: float32 4 bytes, range: 1.175494351e-38 to 3.402823466e+38  
`f64`: float64 8 bytes, range: 2.2250738585072014e-308 to 1.7976931348623157e+308  
`bool`: 1 byte, true or false  
`utf8`: variable-length string  
`struct`: nested object with its own fields and types  

**Always use little endian reading and writing.**

```javascript
import { Struct } from 'arraybuffer-struct';

const point = new Struct({
    x: {value: 10, type: 'i32'},
    y: {value: 20, type: 'i32'}
});

point.data.x; // 10
point.data.y; // 20

// Not initialized
const noInit = new Struct({
    x: {value: null, type: 'i32'},
    y: {value: undefined, type: 'i32'}
});

noInit.data.x; // 0
noInit.data.y; // 0

// all types
const allTypes = new Struct({
    i8: {value: 1, type: 'i8'},
    u8: {value: 2, type: 'u8'},
    i16: {value: 3, type: 'i16'},
    u16: {value: 4, type: 'u16'},
    i32: {value: 5, type: 'i32'},
    u32: {value: 6, type: 'u32'},
    i64: {value: 7n, type: 'i64'},
    u64: {value: 9n, type: 'u64'},
    f16: {value: 10, type: 'f16'}, 
    f32: {value: 11, type: 'f32'},
    f64: {value: 12, type: 'f64'},
    bool: {value: true, type: 'bool'},
    utf8: {value: 'A', type: 'utf8'}, // only one character

    // Array types
    f64Arr1: {value: [1, 2, 3], type: 'f64[3]'}, // Floar64Array [1, 2, 3]
    f64Arr2: {value: new Float64Array([4, 5, 6]), type: 'f64[3]'}, // Floar64Array [4, 5, 6]
    boolArr: {value: [true, false, true], type: 'bool[3]'}, // Array [true, false, true]
    string: {value: 'abcde', type: 'utf8[100]'}, // string 'abcde'

    // Multidimensional Array
    i32Mat2x2_1: {value: [[1, 2], [3, 4]], type: 'i32[2][2]'},
    i32Mat2x2_2: {value: new Int32Array([1, 2, 3, 4]), type: 'i32[2][2]'},
    i32Mat2x2_3: {value: [1, 2, 3, 4], type: 'i32[2][2]'},

    i32Mat4x4: {
        value: [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16]
        ],
        type: 'i32[4][4]'
    },

    // struct
    struct: {
        value: {
            x: {value: 1, type: 'i32'},
            y: {value: 2, type: 'i32'},
            z: {value: 3, type: 'i32'}
        },
        type: 'struct'
    },
    moreStructs: {
        value: {
            a: {
                value: {
                    b: {
                        value: 1,
                        type: 'i32'
                    }
                },
                type: 'struct'
            }
        },
        type: 'struct'
    }
});
```

## 🔧 Type Availability by Platform

`f16`: Chrome 135+ or Node.js 24+,  
See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float16Array#browser_compatibility

`i64` & `u64`: Chrome 67+ or Node.js 10.4+,  
See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array#browser_compatibility

# options

## align & layoutOpt
```javascript
const obj = {
    x: {value: 1, type: 'i8'},
    y: {value: 2, type: 'i64'}
};
const struct1 = new Struct(obj, {align: true, layoutOpt: false});
struct1.view.buffer.byteLength; // 16
const struct2 = new Struct(obj, {align: false, layoutOpt: false});
struct2.view.buffer.byteLength; // 9
const struct3 = new Struct(obj, {align: true, layoutOpt: true});
struct3.view.buffer.byteLength; // 9

```
Explanation:

When `align: true` and `layoutOpt: false`, the structure follows C-like natural alignment:
- `i8` (1 byte) is placed at offset 0
- `i64` (8 bytes) requires 8-byte alignment, so 7 bytes of padding are inserted
- Total size becomes: 1 (`i8`) + 7 (padding) + 8 (`i64`) = 16 bytes

When `align: false`, no padding is applied regardless of type alignment.
- The structure becomes tightly packed: 1 (`i8`) + 8 (`i64`) = 9 bytes
- However, this layout is incompatible with C/wasm and cannot safely use TypedArray slicing for certain fields.

When `layoutOpt: true`, member reordering is enabled (e.g., large fields come first) to minimize padding.
- With both `align: true` and `layoutOpt: true`, the struct is aligned but members are reordered to reduce size.
- In this case, `i64` comes first, followed by `i8`, producing a total size of 9 bytes without breaking alignment.

Summary:  
✅ `align: true` ensures ABI compatibility with C/C++/WebAssembly memory layout  
✅ TypedArray slicing works reliably only when proper alignment is preserved  

⚠️ Disabling alignment may reduce size but breaks compatibility and causes potential slicing errors  
⚠️ Enabling `layoutOpt` reorders fields, so offsets may not match original field order — this is not ideal if field layout must match exactly (e.g., in wasm interop)

If you want to use array on non-aligned structures, please set `{useTypedArray: false}`, which will use js array to read and write

## shared
```javascript
const shared = new Struct({
    counter: {value: 0, type: 'i32'},
    lock: {value: 0, type: 'i32'}
}, {shared: true});
shared.view.buffer; // SharedArrayBuffer
```

## utf8FixedSize
only initialize the first element of a `string[]` with a fixed size.
```javascript
const obj = {
    strArr: {value: ['abc', 'def'], type: 'utf8[2][100]'}
};
// Treat each element of string[] as a separate column
const struct1 = new Struct(obj, {utf8FixedSize: true});
struct1.data.strArr; // ["abc", "def"]

// Concatenate all elements of string[] into a string and encode them together
const struct2 = new Struct(obj, {utf8FixedSize: false});
struct2.data.strArr; // ["abcdef", ""]
```

## useTypedArray
Enable or disable returning native TypedArray views for fixed-size array fields.  
When useTypedArray is `true`, array fields will be represented as real TypedArray instances, allowing fast bulk operations and compatibility with APIs that expect typed arrays.  
When `false`, the array is returned as a normal JavaScript array with each element implemented via getter/setter for fine-grained control.
```javascript
const obj = {
    arr: {value: [1, 2, 3, 4, 5], type: 'i32[5]'}
};
const struct1 = new Struct(obj, {useTypedArray: true});
struct1.data.arr; // Int32Array [1, 2, 3, 4, 5]
const struct2 = new Struct(obj, {useTypedArray: false});
struct2.data.arr; // Array [1, 2, 3, 4, 5] (all elements are getter/setter)
```

## buffer & byteOffset
Manually specify an external `ArrayBuffer` as the backing store and set a custom `byteOffset`.  
Note:
- An error will be thrown if the remaining space from the given `byteOffset` is insufficient to fit the entire Struct.
- If you want to use arrays on `byteOffset` that are not multiples of 2, 4, or 8 without possible `RangeError`, set `{useTypedArray: false}`, which will use js arrays for safe reading and writing.
```javascript
const buffer = new ArrayBuffer(1024);
const struct = new Struct({
    x: {value: 1, type: 'i32'},
    y: {value: 2, type: 'i32'}
}, {
    buffer: buffer,
    byteOffset: 128
});
struct.view.buffer === buffer; // true
struct.view.byteOffset; // 128
```

# Serializable by structuredClone / postMessage
`Struct` instances are designed to be safely serialized using `structuredClone` or transferred via `postMessage` (e.g. to a Web Worker or Node.js worker thread).

When a `Struct` object is cloned or transferred:

Its internal layout metadata (field types, offsets, etc.) is preserved.

The underlying buffer (`ArrayBuffer` or `SharedArrayBuffer`) is retained and re-linked.

You can reconstruct a working `Struct` instance simply by passing the cloned object into new `Struct(...)`.

```javascript
// In main thread:
const struct = new Struct({...}, {shared: true});
worker.postMessage(struct); // structuredClone happens automatically

// In worker thread:
parentPort.on("message", data => {
    const clone = new Struct(data); // Rebuilds the same structure
    clone.data.someField = 42; // Modifies the same SharedArrayBuffer
});
```
If a `SharedArrayBuffer` is used, both the original and cloned `Struct` instances will operate on the same shared memory, enabling real-time synchronization between threads. This makes inter-thread communication and memory-mapped data models extremely simple and efficient.


# SharedArrayBuffer & Worker
Please make sure you have enabled `COOP`/`COEP`, otherwise `SharedArrayBuffer` will not be available.

main.js:
```javascript
import Struct from "arraybuffer-struct";
import { Worker } from "worker_threads";
const shared = new Struct({
    counter: {value: [0], type: 'i32[1]'}
}, {
    shared: true
});
const worker = new Worker("./worker.js");
worker.postMessage({shared: shared});

worker.on("message", () => {
    console.log(shared.data.counter[0]);
});
```

worker.js:
```javascript
import Struct from "arraybuffer-struct";
import { parentPort } from "worker_threads";

parentPort.on("message", ({shared}) => {
    const shared = new Struct(shared);
    for (let i = 0; i < 1000000; i++) {
        Atomics.add(shared.data.counter, 0, 1);
    }
    parentPort.postMessage("done");
});
```


# WebAssembly Struct ⇄ JavaScript Struct Object
This library bridges the gap between low-level memory structures in `WebAssembly` (C/C++) and high-level structured objects in `JavaScript`. It allows developers to define struct layouts in `JavaScript` that exactly match native memory layouts, enabling direct memory mapping via `ArrayBuffer` or `SharedArrayBuffer`.  

Key use cases include:  

- Interfacing with `WebAssembly` modules that return raw pointers to structs.  
- Interpreting memory buffers from native code (e.g., WASM, C/C++) as structured JS objects.  
- Creating compact, binary-efficient data representations for workers or network transfers.  
- Supporting precise control over memory alignment and layout optimization.  

By syncing memory layout between JS and WASM, this tool enables efficient and predictable memory access — especially useful when working with shared memory, `TypedArray` slicing, or low-level binary protocols.

struct.c:
```c
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
// emcc -o struct.wasm struct.c --no-entry -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS="['_get']"
```

main.js:
```javascript
import { Struct } from "arraybuffer-struct";
import * as fs from "fs";

const wasmBuffer = fs.readFileSync("./test.wasm");

const wasmModule = await WebAssembly.instantiate(wasmBuffer);

const {instance: {exports: {get, memory}}} = wasmModule;

const struct = new Struct({
    // Not initialized values
    a: {value: null, type: 'i32'},
    b: {value: null, type: 'f32'},
    c: {value: null, type: 'utf8[10]'},
    d: {value: null, type: 'i64'},
    e: {value: null, type: 'u8'}
}, {
    align: true,
    layoutOpt: false,
    buffer: memory.buffer,
    byteOffset: get()
});
const {data} = struct;
console.log([data.a, data.b, data.c, data.d, data.e]); // [1, 2.299999952316284, "hello", 5n, 255]
```

# ✅ Module Format Support
This library supports multiple module systems for maximum compatibility:

UMD (for direct use in browsers via `<script>` tag or CDN)  
CommonJS (for Node.js require)  
ESM (for modern import in both Node.js and browser environments)

# ⚠️ TypeScript Type Inference Quirk
Due to limitations in TypeScript's inference system — particularly around deeply nested generic arguments — the compiler might fail to infer the correct types if optional parameters are omitted. This can result in unexpected fallback to any.

Consider the following example:
```javascript
const a = new Struct({
  a: {
    value: Array.from({ length: 10 }, () => ({
      value: { x: { value: 1, type: 'i32' }, y: { value: 2, type: 'i32' } },
      type: 'struct'
    })),
    type: 'struct'
  }
});
a.data.a; // ❌ TypeScript infers: any[]
```

Despite being well-structured, a.data.a becomes any[]. However, simply supplying the optional options parameter — even an empty object — resolves the issue:

✅ Solution 1: Pass {} as the options parameter
```javascript
const b = new Struct({
    a: {
        value: Array.from({ length: 10 }, () => ({
            value: { x: { value: 1, type: 'i32' }, y: { value: 2, type: 'i32' } },
            type: 'struct'
        })),
        type: 'struct'
    }
}, {});
b.data.a; // ✅ TypeScript infers: { x: number; y: number }[]
```

✅ Solution 2: Use @satisfies with type annotation
```javascript
/**
 * @typedef {import('arraybuffer-struct').StructInputData} StructInputData
 */
/** @satisfies {StructInputData} */
const obj = {
  a: {
    value: Array.from({ length: 10 }, () => ({
      value: { x: { value: 1, type: 'i32' }, y: { value: 2, type: 'i32' } },
      type: 'struct'
    })),
    type: 'struct'
  }
};
const c = new Struct(obj, {});
c.data.a; // ✅ TypeScript infers: { x: number; y: number }[]
```

🧠 Explanation
The reason behind this behavior is that TypeScript prioritizes inference from the second generic parameter when both are involved. When the second argument (options) is omitted, it can cause the first argument (T) to lose inference context, defaulting to any. This is a known edge case in TypeScript's inference mechanics.

# ⚠ Expected Lifespan Notice: Potential Future Retirement
🧭 This package is designed to provide a flexible workaround for memory structure typing (`struct`) in JavaScript, which currently lacks native support for such features.

However, there is an official proposal underway: https://github.com/tc39/proposal-structs  
If this proposal is successfully adopted and implemented across environments, native `Struct` support will eventually offer a cleaner, faster, and more integrated solution.

Therefore:  
📌 This project is **not intended as a long-term stable solution**, but rather as a **transitional utility**.  
📅 If the proposal is accepted and broadly implemented, this package may be **officially retired** or repurposed as a compatibility layer.

💬 Personally, I'm very excited about this proposal and would love to see it land soon — feel free to visit the repo and give it a star to help bring more attention to it! 😄
