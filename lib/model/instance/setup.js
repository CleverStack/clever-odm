var utils      = require('utils')
  , underscore = require('underscore')
  , defineProp = utils.helpers.defineProperty;

module.exports = function setupModel(model) {
  if (!model instanceof this.Class.entity.model) {
    model = new this.Class.entity.model(model);
  }
  defineProp(this, 'entity',  {value: model});
  defineProp(this, 'isDirty', this.proxy(function(path) {
    return this.entity.isModified(path);
  }));
  defineProp(this, 'isNewRecord', this.proxy(function() {
    return this.entity.isNew;
  }));
  defineProp(this, 'isDeleted',  {value: false});
  defineProp(this, 'attributes', this.proxy(function() {
    return this.entity.schema.paths;
  }));
  defineProp(this, 'values', this.proxy(function() {
    return underscore.pick(this.entity, Object.keys(this.attributes));
  }));
  defineProp(this, 'changed', this.proxy(function() {
    return this.entity.modifiedPaths();
  }));

  return this._super.apply(this, [model]);
};