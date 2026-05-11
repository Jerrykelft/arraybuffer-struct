/**
 * @license MIT
 * Copyright (c) 2025 Jerrykelft
 */

type StructType = 'i8' | 'u8' | 'u8c' | 'i16' | 'u16' | 'i32' | 'u32' | 'i64' | 'u64' | 'f16' | 'f32' | 'f64' | 'bool' | 'utf8';

type AnyTypedArray = Uint8Array | Uint16Array | Uint32Array | BigUint64Array | Int8Array | Int16Array | Int32Array | BigInt64Array | Float16Array | Float32Array | Float64Array;

// 擷取 path 中的維度數量
type CountDims<S extends string, A extends unknown[] = []> =
    S extends `${string}[${number}]${infer Rest}`
        ? CountDims<Rest, [unknown, ...A]>
        : A;

// 將 Count 長度套用為 T[][][]...[]
type ToArrayOf<T, Dims extends unknown[]> = Dims extends [] ? T : ToArrayOf<T[], Tail<Dims>>;

type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : [];

// 根據 Path 和 RefType 產生對應型別
type ArrayFromPath<S extends string, RefType = unknown> =
    RefType extends AnyTypedArray | string
        // 若是 TypedArray 或 string，少一層
        ? ToArrayOf<RefType, Tail<CountDims<S>>> & {
            /**
             * ⚠️注意: 只有多維陣列才會生成flatView屬性，單維陣列則沒有此屬性。
             * 
             * ⚠️Note: Only multi-dimensional arrays will generate the flatView property, single-dimensional arrays do not have this property.
             */
            flatView: RefType;
        }
        // 否則全數展開為 number[]...
        : ToArrayOf<RefType, CountDims<S>> & {
            /**
             * ⚠️注意: 只有多維陣列才會生成flatView屬性，單維陣列則沒有此屬性。
             * 
             * ⚠️Note: Only multi-dimensional arrays will generate the flatView property, single-dimensional arrays do not have this property.
             */
            flatView: RefType[];
        };

type DimTail = '' | `[${number}]` | `[${number}]${DimTail}`;

// type AnyDimType<T extends string, S extends string> =
//     S extends `${T}${infer Rest}` ?
//         Rest extends `${DimTail}` ? true : false
//     : false;
// type A = AnyDimType<'f', 'f[]'>; // true

type Defaultize<T, D> = {[K in keyof D]: K extends keyof T ? T[K] : D[K];};

interface StructOptions {
    /**
     * 是否建立SharedArrayBuffer，當指定 `options.buffer` 時，此選項無效。
     * 
     * Whether to create a SharedArrayBuffer. This option has no effect when `options.buffer` is specified.
     * 
     * @default false
     */
    shared?: boolean;
    /**
     * UTF-8 字串陣列是否採單一字串流格式。
     *
     * - `true`: 字串陣列的每個元素字串視為一個欄位，並以 '\0' 補齊到固定長度。
     *   結果會將每個元素填滿後串接成最終輸出。
     *   - 👉 輸入 `{value: ["a", "b", "c"], type: "utf8[4][10]"}` → 編碼為 `"a\0\0...b\0\0..."`，輸出`["a", "b", "c", ""]`
     *
     * - `false`: 字串陣列的所有元素字串串接為一個流，輸入字串會 array.join 成單一字串再 encode。
     *   - 👉 輸入 `{value: ["a", "b", "c"], type: "utf8[4][10]"}` → 編碼為 `"abc"`，輸出`["abc", "", "", ""]`
     * 
     * Whether UTF-8 arrays of strings are in single string stream format.
     *
     * - `true`: Each element of the array is treated as a field and padded with '\0' to a fixed length.
     *   The result is that each element is padded and concatenated into the final output.
     *   - 👉 Input `{value: ["a", "b", "c"], type: "utf8[4][10]"}` → Encodes to `"a\0\0...b\0\0..."`, Output `["a", "b", "c", ""]`
     *
     * - `false`: All elements of the array are concatenated into a stream, and the input strings are array.joined into a single string and then encoded.
     *   - 👉 Input `{value: ["a", "b", "c"], type: "utf8[4][10]"}` → encoded as `"abc"`, output `["abc", "", "", ""]`
     * 
     * @default true
     */
    utf8FixedSize?: boolean;
    /**
     * 是否啟用記憶體佈局最佳化。
     *
     * 設為 `true` 時，將依據型別對齊規則重新排列結構成員順序，
     * 以減少 padding 並優化記憶體使用。
     *
     * ⚠️ 注意: 若結構成員順序具有語意(如二進位序列化或 ABI 相容需求)，
     * 請勿啟用此選項。
     * 
     * Whether to enable memory layout optimization.
     *
     * When set to `true`, the order of structure members will be rearranged according to type alignment rules,
     * to reduce padding and optimize memory usage.
     *
     * ⚠️ Note: Do not enable this option if the order of structure members has semantics (such as binary serialization or ABI compatibility requirements).
     * 
     * @default false
     */
    layoutOpt?: boolean;
    /**
     * 是否對齊排列結構體成員，與 C struct 的對齊排列行為一致。
     * 
     * Whether to align structure members, consistent with the alignment behavior of C struct.
     * 
     * @warning
     * [!警告] 若設為 `false`，將不符合多數平台的 ABI (應用二進位介面) 對齊規範，可能導致與其他語言(如 C/C++)或 WebAssembly 的資料結構不相容(除非對方也採用未對齊的資料佈局)。
     * 此外，程式不會避免錯誤使用 TypedArray 操作未對齊資料，需明確設置 `options.useTypedArray = false;` 系統才會回退為 JS 標準陣列。
     * 
     * [!WARNING] If set to `false`, it will not comply with the ABI (Application Binary Interface) alignment specifications of most platforms, which may cause incompatibility with data structures of other languages (such as C/C++) or WebAssembly (unless the other party also uses unaligned data layout).
     * In addition, the program will not avoid incorrect use of TypedArray to operate unaligned data. You need to explicitly set `options.useTypedArray = false;` for the system to fall back to JS standard arrays.
     * 
     * @default true
     */
    align?: boolean;
    /**
     * 是否使用 TypedArray 存取陣列資料。設置為 `false` 將強制使用 JavaScript 標準陣列 `Array`。
     * 
     * Whether to use TypedArray to access array data. Setting it to `false` will force the use of JavaScript standard array `Array`.
     * 
     * @default true
     */
    useTypedArray?: boolean;
    /**
     * 輸入的緩衝區，若指定，則會使用此緩衝區，否則會建立新的緩衝區。
     * 
     * The input ArrayBuffer or SharedArrayBuffer, if specified, will be used, otherwise a new buffer will be created.
     * @default null
     */
    buffer?: ArrayBufferLike;
    /**
     * 輸入緩衝區的偏移量，只有當 `options.buffer` 存在時才會生效。
     * 
     * The offset into the input ArrayBuffer or SharedArrayBuffer. This only takes effect if `options.buffer` exists.
     * 
     * @warning
     * [!警告]
     * - 當值為非 8 的倍數時將導致 TypedArray 不可用(會 throw RangeError)，type陣列也就沒辦法使用
     * - 建議將 offset 設定為符合型別最大對齊需求的倍數(通常為 8)。
     * - 如果你仍希望在非 8 的倍數的偏移量上操作陣列的話，請將 `options.useTypedArray` 設為 `false`，
     * 這將回退為JavaScript Array。
     * 
     * [!WARNING]
     * - When the value is not a multiple of 8, TypedArray will be unavailable (will throw RangeError), and the type array cannot be used.
     * - It is recommended to set offset to a multiple that meets the maximum alignment requirement of the type (usually 8).
     * - If you still want to operate the array at an offset that is not a multiple of 8, set `options.useTypedArray` to `false`,
     * This will fall back to JavaScript Array.
     * 
     * @default 0
     */
    byteOffset?: number;
}

type StructConstructor = {
    noWarn: boolean;
    new <T extends StructBaseData>(rebuildData: T): StructInstance<{[key: string]: {value: any; type: string;};}, T['useTypedArray']>;
    /**
     * @param obj 結構化的對象，包含型別資訊
     * @param options 建構設置
     */
    new <T extends StructInputData, U extends StructOptions>(obj: T, options?: U & StructOptions): StructInstance<T, U['useTypedArray'] extends false ? false : true>;
};

interface StructInputData {
    [key: string]:
        {value: StructInputData; type: 'struct';} |
        {value?: unknown; type: StructType;} |
        {value?: unknown; type: `i8[${DimTail}]`;} |
        {value?: unknown; type: `u8[${DimTail}]`;} |
        {value?: unknown; type: `u8c[${DimTail}]`;} |
        {value?: unknown; type: `i16[${DimTail}]`;} |
        {value?: unknown; type: `u16[${DimTail}]`;} |
        {value?: unknown; type: `i32[${DimTail}]`;} |
        {value?: unknown; type: `u32[${DimTail}]`;} |
        {value?: unknown; type: `i64[${DimTail}]`;} |
        {value?: unknown; type: `u64[${DimTail}]`;} |
        {value?: unknown; type: `f16[${DimTail}]`;} |
        {value?: unknown; type: `f32[${DimTail}]`;} |
        {value?: unknown; type: `f64[${DimTail}]`;} |
        {value?: unknown; type: `bool[${DimTail}]`;} |
        {value?: unknown; type: `utf8[${DimTail}]`;};
}

type StructBaseData<B extends boolean = true> = {
    layout: {
        name: string[];
        isArray: boolean[];
        offset: number;
        type: StructType;
        length: number;
        dims: number[];
    }[];
    useTypedArray: B;
    view: DataView;
    [key: string]: never;
};

type TypedArrayMap = {
    [k: `i8[${DimTail}]`]: Int8Array;
    [k: `u8[${DimTail}]`]: Uint8Array;
    [k: `u8c[${DimTail}]`]: Uint8ClampedArray;
    [k: `i16[${DimTail}]`]: Int16Array;
    [k: `u16[${DimTail}]`]: Uint16Array;
    [k: `i32[${DimTail}]`]: Int32Array;
    [k: `u32[${DimTail}]`]: Uint32Array;
    [k: `i64[${DimTail}]`]: BigInt64Array;
    [k: `u64[${DimTail}]`]: BigUint64Array;
    [k: `f16[${DimTail}]`]: Float16Array;
    [k: `f32[${DimTail}]`]: Float32Array;
    [k: `f64[${DimTail}]`]: Float64Array;
}

type StructData<
    T extends {[key: string]: {value: unknown; type: unknown;};} = {[key: string]: {value: unknown; type: string;};},
    B extends boolean = true
> = {
    [K in keyof T]:
        T[K]['type'] extends 'struct'
        ? StructData<T[K]['value'], B>
        : T[K]['type'] extends 'i8' | 'u8' | 'u8c' | 'i16' | 'u16' | 'i32' | 'u32' | 'f16' | 'f32' | 'f64'
        ? number
        : T[K]['type'] extends 'i64' | 'u64'
        ? BigInt
        : T[K]['type'] extends 'bool'
        ? boolean
        : T[K]['type'] extends 'utf8'
        ? string
        : T[K]['type'] extends keyof TypedArrayMap
        ? ArrayFromPath<T[K]['type'], B extends false ? number : TypedArrayMap[T[K]['type']]>
        : T[K]['type'] extends `bool[${DimTail}]`
        ? ArrayFromPath<T[K]['type'], boolean>
        : T[K]['type'] extends `utf8[${DimTail}]`
        ? ArrayFromPath<T[K]['type'], string>
        : any;
};

type StructInstance<
    T extends {[key: string]: {value: unknown; type: unknown;};} = {[key: string]: {value: unknown; type: string;};},
    B extends boolean = true
> = {data: StructData<T, B>;} & StructBaseData<B>;

declare var Struct: StructConstructor;

export = Struct;
export as namespace Struct;
export type {StructType, StructOptions, StructInputData, StructBaseData, StructData, StructInstance};
