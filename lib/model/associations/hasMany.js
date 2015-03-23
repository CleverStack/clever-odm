var inflect    = require('i')()
  , injector   = require('injector');

module.exports = function hasMany(mongoose, Klass, Proto, assocTo) {
  assocTo      = assocTo instanceof Array ? underscore.clone(assocTo) : [assocTo, {}];

  if (Klass.primaryKeys.length !== 1) {
    throw new Error('hasMany association not support without primaryKeys.');
  }

  var sourceModelName     = Klass.modelName
    , targetModelName     = assocTo.shift()
    , associationOptions  = assocTo.shift()
    , sourceModel         = Klass
    , association         = {};

  association.identifier  = inflect.pluralize(associationOptions.foreignKey ? associationOptions.foreignKey : (Klass.underscored === true ? inflect.foreign_key(targetModelName, Klass.primaryKey) : inflect.camelize(targetModelName + '_' + Klass.primaryKey, true)));
  association.sourceName  = sourceModelName;
  association.type        = 'hasMany';
  association.targetName  = associationOptions.through ? associationOptions.through : targetModelName;
  association.as          = inflect.pluralize(inflect.camelize((associationOptions.alias || associationOptions.as || targetModelName.replace('Model','')), true))
  association.target      = injector.getInstance(association.targetName + 'Model');
  association.source      = sourceModel ? sourceModel : sourceModelName;

  Klass.associations.push(association);

  Klass.fields[association.as] = [{
    type  : mongoose.Schema.ObjectId,
    of    : assocTo
  }];
  Klass.getters[association.as] = function getRelation() {
    return this.entity[association.as];
  };
  Klass.setters[association.as] = function setRelation(val) {
    this.entity[association.as] = val;

    return this;
  };
  Klass.getters[association.identifier] = function getRelationIdentifier() {
    return this.entity[association.as] &&
    this.entity[assocTo].entity &&
    this.entity[assocTo].entity._id ? this.entity[assocTo].entity._id : this.entity[assocTo];
  };
  Klass.setters[association.identifier] = function setRelationIdentifier(val) {
    this.entity[association.identifier] = val.id || val;
    return this;
  };
  Proto['get' + association.as] = function getRelationAs(val) {
    return this.entity[association.as];
  };
  Proto['set' + association.as] = function setRelationAs(val) {
    this.entity[association.as] = val;

    return this.save();
  };
}