'use strict';

var path       = require('path')
  , util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , inspect    = utils.helpers.debugInspect
  , hydrator   = require(path.resolve(path.join(__dirname, 'instance', 'hydrator')))
  , eager      = require(path.resolve(path.join(__dirname, 'associations', 'loaders', 'eager')));

module.exports = function findModel(findOptions, queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('odmUtils.find(%s)', inspect(underscore.clone(findOptions.where))));
  }
  
  this
    .entity
    .findOne(findOptions.where, findOptions.attributes, queryOptions)
    .deepPopulate(eager.load.apply(this, [findOptions, queryOptions]).join(' '))
    .exec(this.callback(function(err, model) {
      if (err === null || err === undefined) {
        hydrator.apply(this, [ findOptions, model, callback ]);
      } else {
        callback(err);
      }
    }));
}