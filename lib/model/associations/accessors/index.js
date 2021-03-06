var path       = require('path')
  , injector   = require('injector')
  , underscore = require('underscore')
  , inflect    = injector.getInstance('inflect')
  // , get        = require(path.resolve(path.join(__dirname, 'get')))
  // , set        = require(path.resolve(path.join(__dirname, 'set')))
  // , create     = require(path.resolve(path.join(__dirname, 'create')))
  // , accessor   = require(path.resolve(path.join(__dirname, 'default')));

function defineAssociationAccessors(sourceModel, assocType, targetModel, alias, association) {
  console.dir(arguments);
  process.exit(1);
  var accessors   = this[assocType]
    , singular    = inflect.singularize(alias)
    , plural      = inflect.pluralize(alias);

  sourceModel.getters[association.identifier] = function getRelationIdentifier() {
    return this.entity[association.identifier];
  };
  sourceModel.getters[association.as] = function getRelation() {
    return this.entity[association.as];
  };

  sourceModel.setters[association.identifier] = function setRelationIdentifer(val) {
    this.entity[association.identifier] = val;
  };
  sourceModel.setters[association.as] = function setRelation(val) {
    this.entity[association.as] = val;
  };

  Object.keys(accessors).forEach(function(accessorName) {
    var accessor   = accessors[accessorName]
      , accessorAs = accessorName.replace('Singular', inflect.camelize(singular, true)).replace('Plural', inflect.camelize(plural, true));

    if (typeof sourceModel.entity.DAO.prototype[accessorAs] === 'function') {
      sourceModel.prototype[accessorAs] = (function getRelationAccessor() {
        return function getCriteriaAndOptions() {
          var args = [].slice.call(arguments)
            , where
            , options;

          if (/set/i.test(accessorName) || /get/i.test(accessorName) || /add/i.test(accessorName)) {
            where = args[0] || {};
            options = options ? underscore.clone(args[1]) : {};
            
            if (where.entity) {
              where = where.entity;
            } else if (where instanceof Array && where[0].entity) {
              where = where.map(function(entity) {
                return entity.entity;
              });
            }
          }

          return accessor.apply(this, [accessorAs, association.as, targetModel].concat(args));
        };
      })();
    }
  });
}

module.exports = {
  define: defineAssociationAccessors,
  hasOne: {
    // getSingular    : get,
    // setSingular    : set,
    // createSingular : create
  },
  belongsTo: {
    // getSingular    : get,
    // setSingular    : set,
    // createSingular : create
  },
  hasMany: {
    // getPlural      : get,
    // setPlural      : set,
    // createSingular : create,
    // removeSingular : get,
    // removePlural   : get,
    // addSingular    : accessor,
    // addPlural      : accessor,
    // hasPlural      : accessor,
    // hasSingular    : accessor
  }
};