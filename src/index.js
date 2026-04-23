'use strict';

var containers = require('./containers'),
    services = require('./services'),
    specs = require('./specs'),
    types = require('./types'),
    utils = require('./utils');

/** Parse a schema and return the corresponding type or service. */
function parse(any, opts) {
  var schemaOrProtocol = specs.read(any);
  return schemaOrProtocol.protocol ?
    services.Service.forProtocol(schemaOrProtocol, opts) :
    types.Type.forSchema(schemaOrProtocol, opts);
}

module.exports = {
  Service: services.Service,
  Type: types.Type,
  assembleProtocol: specs.assembleProtocol,
  createBlobDecoder: containers.createBlobDecoder,
  createBlobEncoder: containers.createBlobEncoder,
  discoverProtocol: services.discoverProtocol,
  parse: parse,
  readProtocol: specs.readProtocol,
  readSchema: specs.readSchema,
  streams: containers.streams,
  types: types.builtins,
  Protocol: services.Service,
  assemble: utils.deprecate(specs.assembleProtocol, 'use `assembleProtocol` instead'),
  combine: utils.deprecate(types.Type.forTypes, 'use `Type.forTypes` instead'),
  infer: utils.deprecate(types.Type.forValue, 'use `Type.forValue` instead'),
};
