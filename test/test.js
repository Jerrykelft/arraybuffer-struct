import * as fs from "fs";
import Struct from "arraybuffer-struct";
import {Worker} from "worker_threads";

const wasmBuffer = fs.readFileSync("./test/test.wasm");

const wasmModule = await WebAssembly.instantiate(wasmBuffer);

const {instance: {exports: {get, memory}}} = wasmModule;

var test = async() => {
    console.log('--- 開始測試 ---');
    const complexNesting = new Struct({
        a: {
            value: [
                {value: 1, type: 'i32'},
                {value: 2, type: 'i32'},
                {
                    value: {
                        b: {value: 3, type: 'i32'}
                    },
                    type: 'struct'
                },
            ],
            type: 'struct'
        },
        c: {value: 4, type: 'i32'},
        d: {value: {
            e: {value: 5, type: 'i32'},
            f: {
                value: [
                    {value: 6, type: 'i32'},
                ],
                type: 'struct'
            },
        }, type: 'struct'}
    });
    console.log(complexNesting.data);
    // console.log(complexNesting.layout);

    const struct = new Struct({
        a: {value: null, type: 'i32'},
        b: {value: null, type: 'f32'},
        c: {value: null, type: 'utf8[10]'},
        d: {value: null, type: 'i64'},
        e: {value: null, type: 'u8'}
    }, {
        buffer: memory.buffer,
        byteOffset: get()
    });
    const data = struct.data;
    console.log([data.a, data.b, data.c, data.d, data.e]);

    var obj1 = {
        a: Object.freeze({value: 1, type: 'i8'}),
        b: Object.freeze({value: 2n, type: 'i64'})
    };
    var o1 = new Struct(obj1, {align: true, layoutOpt: false});
    var o2 = new Struct(obj1, {align: true, layoutOpt: false});
    var o3 = new Struct(obj1, {align: false});
    console.log(`
有對齊、無最佳佈局: ${o1.view.byteLength}, 正確為: 16
有對齊、有最佳佈局: ${o2.view.byteLength}, 正確為: 9
無對齊: ${o3.view.byteLength}, 正確為: 9
`);
    var obj2 = {
        a: Object.freeze({value: ['123', '456789'], type: 'utf8[2][6]'})
    };
    var o4 = new Struct(obj2, {utf8FixedSize: false});
    var o5 = new Struct(obj2, {utf8FixedSize: true});
    console.log(`
utf8FixedSize: false => utf8: [0]: ${o4.data.a[0]}, [1]: ${o4.data.a[1]}
utf8FixedSize: true => utf8: [0]: ${o5.data.a[0]}, [1]: ${o5.data.a[1]}
`);

    var obj3 = {
        a: Object.freeze({value: [1, 2, 3], type: 'i32[3]'}),
    };
    var o6 = new Struct(obj3, {useTypedArray: true});
    console.log(`結果: ${o6.data.a.constructor.name} [${o6.data.a}], 預期: {a: Int32Array [1, 2, 3]}`);

    var o7 = new Struct(obj3, {useTypedArray: false});
    console.log(`結果: ${o7.data.a.constructor.name} [${o7.data.a}], 預期: {a: Array [1, 2, 3]}`);

    var o8 = new Struct({
        a: {value: {
            b: {value: {
                c: {value: 1, type: 'i32'}
            }, type: 'struct'}
        }, type: 'struct'}
    });
    console.log(`結果: ${o8.data.a.b.c}, 預期: 1`);

    const shared = new Struct({
        counter: {value: new Int32Array(1), type: 'i32[1]'},
        lock: {value: new Int32Array(1), type: 'i32[1]'}
    }, {shared: true});
    const NUM_WORKERS = 8;
    const INCREMENTS_PER_WORKER = 10000;

    const workers = Array.from({length: NUM_WORKERS}, () => new Worker('./test/test-worker.js'));

    await Promise.all(
        workers.map(worker => {
            return new Promise(resolve => {
                worker.on('message', resolve);
                worker.postMessage({
                    sharedStructSerialized: shared,
                    increments: INCREMENTS_PER_WORKER
                });
            });
        })
    );
    workers.forEach(worker => worker.terminate());

    console.log(`結果: ${shared.data.counter[0]}`);
    console.log('--- 測試結束 ---');
};
await test();
