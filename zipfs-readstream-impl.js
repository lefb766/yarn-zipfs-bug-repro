// code from https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-fslib/sources/ZipFS.ts#L438-L482
// with following modifications.
//
// 1. Drop type declarations
// 2. Skip read zip contents and create stream directly from buffer

const { PassThrough } = require('stream');

exports.createReadStreamFromBuffer = function (buffer, path) {
  const closeStream = () => {
    return;
  };

  const stream = Object.assign(new PassThrough(), {
    bytesRead: 0,
    path: path,
    close: () => {
      clearImmediate(immediate);
      closeStream();
    },
    _destroy: (error, callback) => {
      clearImmediate(immediate);
      closeStream();
      callback(error);
    },
  });

  const immediate = setImmediate(() => {
    try {
      const data = buffer;

      stream.bytesRead = data.length;
      stream.end(data);
      stream.destroy();
    } catch (error) {
      stream.emit(`error`, error);
      stream.end();
      stream.destroy();
    } finally {
      closeStream();
    }
  });

  return stream;
}
