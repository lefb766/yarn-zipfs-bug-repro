const fs = require('fs');
const { PassThrough } = require('stream');
const { createReadStreamFromBuffer } = require('./zipfs-readstream-impl');

(async function main() {
    const filePath = require.resolve('@yarnpkg/fslib/lib/ZipFS.js');
    const buffer = fs.readFileSync(filePath);

    console.log('Impl from ZipFS:');
    const readStream = createReadStreamFromBuffer(buffer, filePath);
    await test(readStream);

    console.log('PassThrough instance without member overwrite:');
    const stream = new PassThrough();
    setImmediate(() => stream.end(buffer));
    await test(stream);
})();

function test(stream) {
    return new Promise((resolve, reject) => {
        let endEmitted = false;
        stream.on('end', () => {
            console.log('  end');
            endEmitted = true;
        });

        stream.on('close', () => {
            console.log('  close');
            if (!endEmitted) {
                setTimeout(() => {
                    resolve();
                }, 1000);
            }
        });
        const piped = stream.pipe(nullStream());

        piped.on('finish', () => {
            resolve();
        });

        stream.on('error', error => reject(error));
        piped.on('error', error => reject(error));
    });
}

function nullStream() {
    const nullFile = process.platform === 'win32' ? '\\\\.\\NUL' : '/dev/null';
    return fs.createWriteStream(nullFile);
}
