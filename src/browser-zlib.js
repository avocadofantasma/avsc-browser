'use strict';

/**
 * Browser zlib shim using the native CompressionStream / DecompressionStream APIs.
 * Exposes only the subset avsc needs: inflateRaw and deflateRaw as streaming
 * Transform-compatible objects via readable-stream.
 */

var stream = require('readable-stream');
var utils = require('./utils');

// --- inflateRaw ---

function InflateRaw() {
  stream.Transform.call(this);
  this._cs = new DecompressionStream('deflate-raw');
  this._writer = this._cs.writable.getWriter();
  this._reader = this._cs.readable.getReader();
  this._draining = false;
}
utils.inherits(InflateRaw, stream.Transform);

InflateRaw.prototype._transform = function (chunk, _enc, cb) {
  var self = this;
  self._writer.write(chunk).then(function () {
    return self._reader.read();
  }).then(function (result) {
    if (result.value) self.push(Buffer.from(result.value));
    cb();
  }).catch(cb);
};

InflateRaw.prototype._flush = function (cb) {
  var self = this;
  self._writer.close().then(function read() {
    return self._reader.read().then(function (result) {
      if (result.done) return cb();
      if (result.value) self.push(Buffer.from(result.value));
      return read();
    });
  }).catch(cb);
};

// --- deflateRaw ---

function DeflateRaw() {
  stream.Transform.call(this);
  this._cs = new CompressionStream('deflate-raw');
  this._writer = this._cs.writable.getWriter();
  this._reader = this._cs.readable.getReader();
}
utils.inherits(DeflateRaw, stream.Transform);

DeflateRaw.prototype._transform = function (chunk, _enc, cb) {
  var self = this;
  self._writer.write(chunk).then(function () {
    return self._reader.read();
  }).then(function (result) {
    if (result.value) self.push(Buffer.from(result.value));
    cb();
  }).catch(cb);
};

DeflateRaw.prototype._flush = function (cb) {
  var self = this;
  self._writer.close().then(function read() {
    return self._reader.read().then(function (result) {
      if (result.done) return cb();
      if (result.value) self.push(Buffer.from(result.value));
      return read();
    });
  }).catch(cb);
};

module.exports = {
  inflateRaw: function () { return new InflateRaw(); },
  deflateRaw: function () { return new DeflateRaw(); }
};
