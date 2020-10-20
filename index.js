const fs = require('fs');
const path = require('path');
const { getLibzipSync } = require('@yarnpkg/libzip');
const { ZipFS, ppath } = require('@yarnpkg/fslib');

const ZIP_PATH = '.yarn/cache/@yarnpkg-fslib-npm-2.3.0-177ea80af4-0969bd6b12.zip';

(async function main() {
    const libzip = getLibzipSync();
    const zipFile = fs.readFileSync(
        path.join(__dirname, ZIP_PATH)
    );
    const zipFs = new ZipFS(zipFile, { libzip });

    for await (const file of listFiles(zipFs, '/')) {
        console.log(file);
        const stream = zipFs.createReadStream(file);
        const p = stream.pipe(nullStream());

        await new Promise((resolve, reject) => {
            let end;
            stream.on('end', () => {
                console.log('end');
                end = true;
            });
            stream.on('close', () => {
                console.log('close');
                if (!end) {
                    console.log('NG');
                }
            })

            // Note that the stream emits finish because
            // it is actually a PassThrough instance.
            stream.on('finish', () => {
                console.log('finish');
            })
            ;

            stream.on('error', error => reject(error))
            p.on('error', error => reject(error));
            p.on('finish', () => resolve());
        });
    }
    console.log('done');
})();

function nullStream() {
    const nullFile = process.platform === 'win32' ? '\\\\.\\NUL' : '/dev/null';
    return fs.createWriteStream(nullFile);
}

async function *listFiles(fs, dir) {
    const entries = await fs.readdirPromise(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isFile()) {
            yield ppath.join(dir, entry.name);
        } else if (entry.isDirectory()) {
            const subdir = ppath.join(dir, entry.name);
            yield *listFiles(fs, subdir);
        } else {
            throw new Error();
        }
    }
}
