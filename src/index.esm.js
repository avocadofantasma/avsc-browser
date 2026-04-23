'use strict';

var containers = require('./containers');
var services = require('./services');
var specs = require('./specs');
var types = require('./types');
var utils = require('./utils');

function parse(any, opts) {
  var schemaOrProtocol = specs.read(any);
  return schemaOrProtocol.protocol
    ? services.Service.forProtocol(schemaOrProtocol, opts)
    : types.Type.forSchema(schemaOrProtocol, opts);
}

module.exports = {
  Type: types.Type,
  Service: services.Service,
  parse: parse,
  streams: containers.streams,
  avroTypes: types.builtins,
  assembleProtocol: specs.assembleProtocol,
  readProtocol: specs.readProtocol,
  readSchema: specs.readSchema,
  discoverProtocol: services.discoverProtocol,
  createBlobDecoder: containers.createBlobDecoder,
  createBlobEncoder: containers.createBlobEncoder,
  Protocol: services.Service,
  assemble: utils.deprecate(specs.assembleProtocol, 'use `assembleProtocol` instead'),
  combine: utils.deprecate(types.Type.forTypes, 'use `Type.forTypes` instead'),
  infer: utils.deprecate(types.Type.forValue, 'use `Type.forValue` instead'),
};
