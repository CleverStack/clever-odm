var inflect    = require('i')()
  , underscore = require('underscore');

module.exports = function hasOne(mongoose, model, proto, assocTo) {
  assocTo      = assocTo instanceof Array ? underscore.clone(assocTo) : [assocTo, {}];

  var targetModelName    = assocTo.shift()
    , associationOptions = assocTo.shift()
    , sourceModel        = injector.getInstance(sourceModelName + 'Model')
    , targetModel        = injector.getInstance((associationOptions.through ? associationOptions.through : targetModelName) + 'Model')
    , alias              = associationOptions.alias || associationOptions.as || targetModelName.replace('Model','')
    , association;

  console.dir([targetModelName, associationOptions, sourceModel, targetModel, alias, association]);
  process.exit(1);

  var fieldName = inflect.singularize(inflect.camelize(assocTo, true))
    , idName    = fieldName + 'Id';

  model.fields[fieldName]  = {
    type  : mongoose.Schema.ObjectId,
    of    : assocTo
  };
  console.dir(model);
  console.dir(assocTo);
  process.exit(1);
  model.getters[fieldName] = function() {
    return this.entity[fieldName];
  };
  model.setters[fieldName] = function(val) {
    this.entity[fieldName] = val;

    return this;
  };
  model.getters[idName]    = function() {
    return this.entity[fieldName] &&
    this.entity[assocTo].entity &&
    this.entity[assocTo].entity._id ? this.entity[assocTo].entity._id : this.entity[assocTo];
  };
  model.setters[idName]    = function(val) {
    this.entity[fieldName] = val.id || val;

    return this;
  };
  proto['set' + fieldName] = function(val) {
    this.entity[fieldName] = val;

    return this.save();
  };
}