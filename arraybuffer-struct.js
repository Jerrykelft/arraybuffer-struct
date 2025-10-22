/**
 * @license MIT
 * Copyright (c) 2025 Jerrykelft
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory); // AMD
    } else if (typeof module === 'object' && module.exports) {
        const f = factory();
        module.exports = f; // CommonJS / Node.js
        module.exports.default = f;
    } else {
        root.Struct = factory(); // Browser global
    }
})(
    typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this,
    function () {
        'use strict';
        const {
            DataView, TextEncoder, TextDecoder, Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, BigInt64Array, BigUint64Array, Float16Array, Float32Array, Float64Array, SharedArrayBuffer, ArrayBuffer
        } = /**@type {globalThis}*/(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : Function('return this')());
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        /**@param {string} str*/
        const cString = str => {const nulIndex = str.indexOf('\0'); return nulIndex >= 0 ? str.slice(0, nulIndex) : str;};
        const typeMap = {
            i8: {
                get: DataView.prototype.getInt8,
                set: DataView.prototype.setInt8,
                array: Int8Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            u8: {
                get: DataView.prototype.getUint8,
                set: DataView.prototype.setUint8,
                array: Uint8Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            u8c: {
                get: DataView.prototype.getUint8,
                set: DataView.prototype.setUint8,
                array: Uint8ClampedArray,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            i16: {
                get: DataView.prototype.getInt16,
                set: DataView.prototype.setInt16,
                array: Int16Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            u16: {
                get: DataView.prototype.getUint16,
                set: DataView.prototype.setUint16,
                array: Uint16Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            i32: {
                get: DataView.prototype.getInt32,
                set: DataView.prototype.setInt32,
                array: Int32Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            u32: {
                get: DataView.prototype.getUint32,
                set: DataView.prototype.setUint32,
                array: Uint32Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            i64: {
                get: DataView.prototype.getBigInt64,
                set: DataView.prototype.setBigInt64,
                array: BigInt64Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            u64: {
                get: DataView.prototype.getBigUint64,
                set: DataView.prototype.setBigUint64,
                array: BigUint64Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            f16: {
                get: DataView.prototype.getFloat16,
                set: DataView.prototype.setFloat16,
                array: Float16Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            f32: {
                get: DataView.prototype.getFloat32,
                set: DataView.prototype.setFloat32,
                array: Float32Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            f64: {
                get: DataView.prototype.getFloat64,
                set: DataView.prototype.setFloat64,
                array: Float64Array,
                arrayLogic(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            bool: {
                /**@this {DataView}*/
                get: function(byteOffset) {return Boolean(DataView.prototype.getUint8.call(this, byteOffset));},
                /**@this {DataView}*/
                set: function(byteOffset, value) {DataView.prototype.setUint8.call(this, byteOffset, value ? 1 : 0);},
                array: Uint8Array,
                arrayLogic: null
            },
            utf8: {
                /**@this {DataView}*/
                get: function(byteOffset) {return decoder.decode(new Uint8Array([DataView.prototype.getUint8.call(this, byteOffset)]));},
                /**@this {DataView}*/
                set: function(byteOffset, value) {DataView.prototype.setUint8.call(this, byteOffset, encoder.encode(value)[0]);},
                array: Uint8Array,
                arrayLogic(view, offset, length) {
                    const typedArray = new this.array(view.buffer, offset, length);
                    return {
                        get: () => cString(decoder.decode(this.array.from(typedArray))),
                        set: value => typedArray.set(encoder.encode(value + '\0'))
                    };
                },
                arrayLogicUint8(view, offset, length) {return {value: new this.array(view.buffer, offset, length), writable: true};}
            },
            utf16: {},
            utf32: {}
        };
        return class Struct {
            static noWarn = false;
            /**@type {StructInstance['layout']}*/
            layout = []; // 記憶體結構布局紀錄
            /**
             * @param {StructBaseData | StructInstance} obj
             * @param {{shared?: boolean; utf8FixedSize?: boolean; layoutOpt?: boolean; align?: boolean; useTypedArray?: boolean; buffer?: ArrayBufferLike; byteOffset?: number;}} options
             */
            constructor(obj, options = {}) {
                const {shared = false, utf8FixedSize = true, layoutOpt = false, align = true, useTypedArray = true, buffer = null, byteOffset = 0} = options;
                Object.defineProperty(this, 'data', {value: {}, writable: true, configurable: true, enumerable: false});
                const thisCls = this;
                if (Array.isArray(obj.layout) && obj.view instanceof DataView) {
                    /**@type {StructBaseData}*/
                    const {layout, view, useTypedArray} = obj;
                    this.layout = layout;
                    this.view = view;
                    this.useTypedArray = useTypedArray;
                    // 重建結構體(用於共享結構)
                    for (const info of layout) {
                        defineProperty(this.data, info);
                    }
                } else {
                    if (!Struct.noWarn && useTypedArray) {
                        if (!align) console.warn('Warning: useTypedArray is enabled but align is off. TypedArray view may throw due to misalignment. If you don\'t want to see this warning, set Struct.noWarn = true;');
                        if (buffer && byteOffset % 8 !== 0) console.warn('Warning: byteOffset is not aligned to 8 bytes but useTypedArray is enabled. TypedArray view may throw due to misalignment. If you don\'t want to see this warning, set Struct.noWarn = true;');
                    }
                    this.useTypedArray = useTypedArray;
                    const items = [];
                    // 記憶體堆疊偏移量
                    let offset = 0;

                    /**@type {({value: any; name: string[]; isArray: boolean[];} & ReturnType<typeof parseType>)[]}*/
                    const parseObj = [];
                    // 解析巢狀結構
                    const parseStruct = (o, prefix = [], isArray = []) => Object.entries(o).forEach(([name, value]) =>
                        value.type === 'struct'
                            ? parseStruct(value.value, [...prefix, name], [...isArray, Array.isArray(value.value)])
                            : parseObj.push({name: [...prefix, name], value: value.value, isArray: [...isArray, Array.isArray(value.value)], ...parseType(value.type)})
                    );
                    parseStruct(obj);

                    // 由大到小排序以減少對齊padding
                    if (layoutOpt) parseObj.sort((a, b) => b.totalSize - a.totalSize);
                    for (const {byteSize, totalSize, name, value, type, length, dims, isArray} of parseObj) {
                        // 自動對齊: 對齊到該類型的 byteSize
                        if (align) offset = alignOffset(offset, byteSize);

                        this.layout.push({name, offset, type, length, dims, isArray});
                        items.push({name, offset, type, length, dims, isArray, value});
                        offset += totalSize;
                    }

                    // 建立視圖
                    this.view = buffer
                        ? new DataView(buffer, byteOffset, offset)
                        : new DataView(new (shared ? SharedArrayBuffer : ArrayBuffer)(offset));

                    // 設定初始值
                    for (const {value, ...info} of items) {
                        const {type, offset, length, dims} = info;
                        // value 為 null 或 undefined 代表不設定初始值
                        if (value != null) {
                            if (dims.length > 0) {
                                // 先攤平多維度陣列
                                let input = value;
                                if (Array.isArray(input)) {
                                    input = input.flat(Infinity);
                                } else if (typeof input !== 'object') {
                                    input = [input];
                                }
                                // 處理utf8
                                if (type === 'utf8') {
                                    input = encoder.encode(
                                        Array.isArray(input)
                                            ? (utf8FixedSize ? fillMultiDimsUtf8(input, dims[dims.length - 1]) : input.join(''))
                                            : input
                                    );
                                }
                                new typeMap[type].array(this.view.buffer, this.view.byteOffset + offset, length).set(input);
                            } else {
                                typeMap[type].set.call(this.view, offset, value, true);
                            }
                        }
                        defineProperty(this.data, info);
                    }
                }
                /**
                 * @param {string[]} strArr
                 * @param {number} spacing
                 */
                function fillMultiDimsUtf8(strArr, spacing) {
                    return strArr.map(str => {
                        const paddingLen = spacing - str.length;
                        const padding = '\0'.repeat(Math.max(0, paddingLen));
                        return str + padding;
                    }).join('');
                }
                /**
                 * @param {object} target
                 * @param {{name: string[]; isArray: boolean[]; offset: number; type: StructType; length: number; dims: number[];}} info
                 */
                function defineProperty(target, info) {
                    const {
                        name: [head, ...rest], // namespace嵌套
                        isArray: [isHeadArray, ...restIsArray], // 當前namespace欄位是否是陣列
                        offset, // 精確一維位置(bytes偏移量)
                        type, // 型別
                        length, // 一維總長度
                        dims // 維度
                    } = info;

                    if (rest.length > 0) {
                        target[head] ||= isHeadArray ? [] : {};
                        defineProperty(target[head], {name: rest, offset, type, length, dims, isArray: restIsArray});
                    } else {
                        // 這邊檢測value是否為某TypedArray的實例，因為可能輸入長度只有1的陣列
                        if (dims.length > 0) {
                            const isMultiDims = dims.length > 1;
                            if (isMultiDims) {
                                target[head] = [];
                                defineReshape(target[head], {offset, type, dims});
                            }
                            const define = isMultiDims
                                ? {target: target[head], head: 'flatView', enumerable: false}
                                : {target, head, enumerable: true};
                            defineArrayProperty({target: define.target, name: define.head, offset, type, length, enumerable: define.enumerable});
                        } else {
                            Object.defineProperty(target, head, {
                                get: () => typeMap[type].get.call(thisCls.view, offset, true),
                                set: value => typeMap[type].set.call(thisCls.view, offset, value, true),
                                enumerable: true,
                                configurable: true
                            });
                        }
                    }
                }
                /**
                 * @param {any[]} target 多維目標
                 * @param {{offset: number; type: StructType; dims: number[];}} info
                 * @param {{i: number;}} state 用來追蹤一維位置
                 */
                function defineReshape(target, info, state = {i: 0}) {
                    const {offset, type, dims: [head, ...rest]} = info;
                    for (let i = 0; i < head; i++) {
                        if (rest.length === 1) {
                            const byteOffset = offset + state.i * typeMap[type].array.BYTES_PER_ELEMENT;
                            const length = rest[0];
                            defineArrayProperty({target, name: i, offset: byteOffset, type, length});
                            state.i += length;
                        } else {
                            target[i] = [];
                            defineReshape(target[i], {offset, type, dims: rest}, state);
                        }
                    }
                }
                /**
                 * @param {{target: object; name: string; offset: number; type: StructType; length: number; enumerable: boolean; configurable: boolean;}} info
                 */
                function defineArrayProperty(info) {
                    const {target, name, offset, type, length, enumerable = true, configurable = true} = info;
                    const typeInfo = typeMap[type];
                    if ((thisCls.useTypedArray && typeInfo.arrayLogic) || type === 'utf8') {
                        const arrayLogic = typeInfo.arrayLogic(thisCls.view, thisCls.view.byteOffset + offset, length);
                        Object.defineProperty(target, name, {...arrayLogic, enumerable, configurable});
                    } else {
                        // fallback: 不對齊模式
                        target[name] = [];
                        const elementBytes = typeInfo.array.BYTES_PER_ELEMENT;
                        for (let i = 0; i < length; i++) {
                            Object.defineProperty(target[name], i, {
                                get: () => typeInfo.get.call(thisCls.view, offset + i * elementBytes, true),
                                set: value => typeInfo.set.call(thisCls.view, offset + i * elementBytes, value, true),
                                enumerable,
                                configurable
                            });
                        }
                    }
                }
                /**@param {string} typeName*/
                function parseType(typeName) {
                    /**@type {StructType}*/
                    const type = typeName.match(/^([a-zA-Z_$][\w$]*)/)?.[0];
                    const dims = [...typeName.matchAll(/\[\s*(\d+)\s*\]/g)].map(m => parseInt(m[1]));
                    const byteSize = typeMap[type].array.BYTES_PER_ELEMENT;
                    if (!byteSize) throw new Error(`Invalid type: ${typeName}`);
                    const length = dims.length > 0 ? dims.reduce((total, value) => total * value, 1) : 1;
                    const totalSize = byteSize * length;
                    return {type, length, dims, byteSize, totalSize};
                }
                /**
                 * @param {number} offset 
                 * @param {number} alignment 
                 */
                function alignOffset(offset, alignment) {
                    return (offset + alignment - 1) & ~(alignment - 1);
                }
            }
        };
    }
);
