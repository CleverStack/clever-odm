var util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , mongoose   = require('mongoose')
  , inspect    = utils.helpers.debugInspect;

module.exports = function createModel(modelData, queryOptions, callback) {
  var ModelClass = this
    , data       = underscore.pick(modelData, Object.keys(!this.Class ? this.fields : this.Class.fields));

  if (this.debug.enabled) {
    this.debug(util.format('odmUtils.create(%s)', inspect(underscore.clone(data))));
  }

  utils.model.behaviours.timeStampable.beforeCreate.apply(this, [data]);
  utils.model.behaviours.softDeleteable.beforeCreate.apply(this, [data]);

  data._id = new mongoose.Types.ObjectId();

  this
    .entity
    .create(data, function(err, entity) {
      if (err === null || err === undefined) {
        callback(null, new ModelClass(entity));
      } else {
        callback(err);
      }
    });
};