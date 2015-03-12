var utils      = require('utils')
  , util       = require('util')
  , underscore = require('underscore')
  , Exceptions = require('exceptions')
  , mongoose   = require('mongoose')
  , inspect    = utils.helpers.debugInspect;

module.exports = function updateModel(values, queryOptions, callback) {
  var data     = underscore.pick(values, Object.keys(!this.Class ? this.fields : this.Class.fields))
    , helpers  = utils.model.helpers;

  if (!Object.keys(data).length) {
    return callback(null, helpers.alias.fields.forOutput.apply(this, [helpers.alias.associations.forOutput.apply(this, [values])]));
  }

  if (this.debug.enabled) {
    this.debug(util.format('odmUtils.update(%s)', inspect(underscore.clone(data))));
  }

  utils.model.behaviours.timeStampable.beforeUpdate.apply(this, [data]);

  if (queryOptions.where.id && /^[0-9a-fA-F]{24}$/.test(queryOptions.where.id)) {
    queryOptions.where.id = mongoose.Types.ObjectId.fromString(queryOptions.where.id);
  }

  this
    .entity
    .update(queryOptions.where, data, underscore.omit(queryOptions, 'where'), this.callback(function(err, rowsAffected) {
      if (err !== null && err !== undefined) {
        callback(err);
      } else if (rowsAffected !== 0) {
        callback(null, helpers.alias.fields.forOutput.apply(this, [helpers.alias.associations.forOutput.apply(this, [underscore.extend(data, queryOptions.where)])]));
      } else {
        callback(new Exceptions.ModelNotFound(util.format('%s doesn\'t exist.', this.modelName)));
      }
    }));
};