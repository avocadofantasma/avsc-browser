'use strict';

/** Browser shim — file system operations are not available. */

function createError() { return new Error('File system operations are not supported in the browser'); }

function createImportHook() {
  return function (fpath, kind, cb) { cb(createError()); };
}

function createSyncImportHook() {
  return function () { throw createError(); };
}

module.exports = {
  createImportHook: createImportHook,
  createSyncImportHook: createSyncImportHook,
  existsSync: function () { return false; },
  readFileSync: function () { throw createError(); }
};
