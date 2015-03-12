var util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , mongoose   = require('mongoose')
  , Exceptions = require('exceptions')
  , inspect    = utils.helpers.debugInspect;

module.exports = function destroyModel(queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('odmUtils.destroy(%s)', inspect(underscore.clone(queryOptions.where))));
  }

  if (queryOptions.where.id && /^[0-9a-fA-F]{24}$/.test(queryOptions.where.id)) {
    queryOptions.where.id = mongoose.Types.ObjectId.fromString(queryOptions.where.id);
  }

  // @todo implement softDeleteable

  this
    .entity
    .remove(queryOptions.where, this.callback(function(err, rowsAffected) {
      if (err !== null && err !== undefined) {
        callback(err);
      } else if (rowsAffected !== 0) {
        callback(null, {});
      } else {
        callback(new Exceptions.ModelNotFound(util.format('%s doesn\'t exist.', this.modelName)));
      }
    }));
};