'use strict';

var util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , inspect    = utils.helpers.debugInspect;

module.exports = function createModel(modelData, queryOptions, callback) {
  var ModelClass = this
    , data       = underscore.pick(modelData, Object.keys(this.entity.attributes));

  if (this.debug.enabled) {
    this.debug(util.format('odmUtils.create(%s)', inspect(underscore.clone(data))));
  }
  
  this.entity.create(data).then(this.callback(function(entity) {
    callback(null, new ModelClass(entity));
  }))
  .catch(callback);
}