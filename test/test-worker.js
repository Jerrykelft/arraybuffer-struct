import Struct from 'arraybuffer-struct';
import {parentPort} from 'worker_threads';
parentPort.on('message', data => {
    const {sharedStructSerialized, increments} = data;
    const {data: shared} = new Struct(sharedStructSerialized);
    for (let i = 0; i < increments; i++) {
        Atomics.add(shared.counter, 0, 1);
    }
    parentPort.postMessage('done');
});
