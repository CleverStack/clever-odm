'use strict';

var path       = require('path')
  , async      = require('async')
  , util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , inspect    = utils.helpers.debugInspect
  , hydrator   = require(path.resolve(path.join(__dirname, 'instance', 'hydrator')))
  , eager      = require(path.resolve(path.join(__dirname, 'associations', 'loaders', 'eager')));

module.exports = function findAllModels(findOptions, queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('odmUtils.findAll(%s)', inspect(underscore.clone(findOptions.where))));
  }

  this
    .entity
    .find(findOptions.where, findOptions.attributes, queryOptions)
    .deepPopulate(eager.load.apply(this, [findOptions, queryOptions]).join(' '))
    .exec(this.callback(function(err, results) {
      if (err === null || err === undefined) {
        results = async.map(
          results instanceof Array ? results : [results],
          this.callback(hydrator, findOptions),
          callback
        );
      } else {
        callback(err);
      }
    }));
}