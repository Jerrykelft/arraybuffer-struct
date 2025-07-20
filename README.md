> ⚠️ Disclaimer:  
> The English here might be pretty rough.  
> This README was created with AI assistance + Google Translate,  
> so please forgive any awkward phrasing!  
> Also, if you're a beginner struggling with GitHub/NPM, you're not alone — this stuff can be a real headache. 😅

# ⚠ Expected Lifespan Notice: Potential Future Retirement
🧭 This package is designed to provide a flexible workaround for memory structure typing (`struct`) in JavaScript, which currently lacks native support for such features.

However, there is an official proposal underway: https://github.com/tc39/proposal-structs  
If this proposal is successfully adopted and implemented across environments, native `Struct` support will eventually offer a cleaner, faster, and more integrated solution.

Therefore:  
📌 This project is **not intended as a long-term stable solution**, but rather as a **transitional utility**.  
📅 If the proposal is accepted and broadly implemented, this package may be **officially retired** or repurposed as a compatibility layer.

💬 Personally, I'm very excited about this proposal and would love to see it land soon — feel free to visit the repo and give it a star to help bring more attention to it! 😄
# arraybuffer-struct

A JavaScript library for working with memory buffers as struct types.

# Usage

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
    i32Arr2D_1: {value: [[1, 2], [3, 4]], type: 'i32[2][2]'},
    i32Arr2D_2: {value: new Int32Array([1, 2, 3, 4]), type: 'i32[2][2]'},
    i32Arr2D_3: {value: [1, 2, 3, 4], type: 'i32[2][2]'},

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

f16: Chrome 135+ or Node.js 24+,  
See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float16Array#browser_compatibility

i64 & u64: Chrome 67+ or Node.js 10.4+,  
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
/*
Explanation:

When `align: true` and `layoutOpt: false`, the structure follows C-like natural alignment:
- `i8` (1 byte) is placed at offset 0
- `i64` (8 bytes) requires 8-byte alignment, so 7 bytes of padding are inserted
- Total size becomes: 1 (i8) + 7 (padding) + 8 (i64) = 16 bytes

When `align: false`, no padding is applied regardless of type alignment.
- The structure becomes tightly packed: 1 (i8) + 8 (i64) = 9 bytes
- However, this layout is incompatible with C/wasm and cannot safely use TypedArray slicing for certain fields.

When `layoutOpt: true`, member reordering is enabled (e.g., large fields come first) to minimize padding.
- With both `align: true` and `layoutOpt: true`, the struct is aligned but members are reordered to reduce size.
- In this case, `i64` comes first, followed by `i8`, producing a total size of 9 bytes without breaking alignment.

Summary:
✅ `align: true` ensures ABI compatibility with C/C++/WebAssembly memory layout  
✅ TypedArray slicing works reliably only when proper alignment is preserved  
⚠ Disabling alignment may reduce size but breaks compatibility and causes potential slicing errors
⚠ Enabling `layoutOpt` reorders fields, so offsets may not match original field order — this is not ideal if field layout must match exactly (e.g., in wasm interop)
*/

```

## shared
```javascript
const shared = new Struct({
    counter: {value: 0, type: 'i32'},
    lock: {value: 0, type: 'i32'}
}, {shared: true});
shared.view.buffer; // SharedArrayBuffer
```

## utf8FixedSize
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

# SharedArrayBuffer & Worker

Please make sure you have enabled COOP/COEP, otherwise SharedArrayBuffer will not be available.

main.js:
```javascript
import Struct from "arraybuffer-struct";
import { Worker } from "worker_threads";
const shared = new Struct({
    counter: {value: 0, type: 'i32'}
}, {
    shared: true
});
```

worker.js:
```javascript
import { Struct } from 'arraybuffer-struct';

const struct = new Struct({}, {});
```


Not finished yet awa