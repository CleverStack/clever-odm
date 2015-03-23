var inflect    = require('i')()
  , injector   = require('injector');

module.exports = function belongsTo(mongoose, Klass, Proto, assocTo) {
  assocTo      = assocTo instanceof Array ? underscore.clone(assocTo) : [assocTo, {}];

  if (Klass.primaryKeys.length !== 1) {
    throw new Error('belongsTo association not support without primaryKeys.');
  }

  var sourceModelName     = Klass.modelName
    , targetModelName     = assocTo.shift()
    , associationOptions  = assocTo.shift()
    , sourceModel         = Klass
    , association         = {};

  association.identifier  = inflect.singularize(associationOptions.foreignKey ? associationOptions.foreignKey : (Klass.underscored === true ? inflect.foreign_key(targetModelName, Klass.primaryKey) : inflect.camelize(targetModelName + '_' + Klass.primaryKey, true)));
  association.sourceName  = sourceModelName;
  association.type        = 'belongsTo';
  association.targetName  = associationOptions.through ? associationOptions.through : targetModelName;
  association.as          = inflect.singularize(inflect.camelize((associationOptions.alias || associationOptions.as || targetModelName.replace('Model','')), true))
  association.target      = injector.getInstance(association.targetName + 'Model');
  association.source      = sourceModel ? sourceModel : sourceModelName;

  Klass.associations.push(association);

  Klass.fields[association.identifier] = {
    of    : association.sourceName,
    type  : mongoose.Schema.ObjectId
  };

  Klass.getters[association.as] = function getRelation() {
    return this.entity[association.as];
  };
  Klass.setters[association.as] = function setRelation(val) {
    this.entity[association.as] = val;
    this.entity[association.identifier] = val.id || val._id;

    return this;
  };
  Klass.getters[association.identifier] = function getRelationIdentifier() {
    return this.entity[association.as] &&
    this.entity[association.as].entity &&
    this.entity[association.as].entity._id ? this.entity[association.as].entity._id : this.entity[association.as];
  };
  Klass.setters[association.identifier] = function setRelationIdentifier(val) {
    this.entity[association.as] = val.id || val;

    return this;
  };
  Proto['get' + association.as] = function getRelationAs(val) {
    return this.entity[association.as];
  };
  Proto['set' + association.as] = function setRelationAs(val) {
    // console.dir(association);
    // console.dir(this.Class);
    // console.dir(this.entity);
    console.dir(this.Class.entity);

    this[association.identifier] = val._id || val.id;

    console.dir(this);

    console.dir(val);
    console.dir(this.entity);
    process.exit(1);

    return this.save();
  };
}