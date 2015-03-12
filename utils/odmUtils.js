var path     = require('path')
  , odmLib   = require(path.resolve(path.join(__dirname, '..', 'lib')));

module.exports  = {
  find            : odmLib.model.find,
  save            : odmLib.model.instance.save,
  create          : odmLib.model.create,
  update          : odmLib.model.update,
  destroy         : odmLib.model.destroy,
  destroyInstance : odmLib.model.instance.destroy,
  findAll         : odmLib.model.findAll,
  wrapModel       : odmLib.model.instance.hydrator,
  setup           : odmLib.model.instance.setup,
  eagerLoad       : odmLib.model.associations.loaders.eager.load,
  afterEagerLoad  : odmLib.model.associations.loaders.eager.afterLoad,
  softDeleteable  : odmLib.model.behaviours.softDeleteable.criteria
};

// var inflect     = require( 'i' )()
//   , injector    = require( 'injector' )
//   , Promise     = require( 'bluebird' );

// var odmUtils    = module.exports  = {

//     renameId: function( findOptions ) {
//         if ( findOptions.where.id ) {
//             findOptions.where._id = findOptions.where.id;
//             delete findOptions.where.id;
//         }
//     },

//     eagerLoad: ,

//     afterEagerLoad: ,

//     find: ,

//     findAll: ,

//     hasMany: function( mongoose, model, proto, assocTo ) {
//         var fieldName = inflect.singularize( inflect.camelize( assocTo, true ) )

//         model.fields[ fieldName ]     = [
//             {
//                 type    : mongoose.Schema.ObjectId,
//                 of      : assocTo
//             }
//         ];
//         model.getters[ fieldName ]    = function() {
//             return this.entity[ fieldName ];
//         };
//         model.setters[ fieldName ]    = function( val ) {
//             this.entity[ fieldName ]   = val;

//             return this;
//         };
//         proto[ 'add' + inflect.camelize( fieldName, true ) ] = function( val ) {
//             if ( !( this.entity[ fieldName ] instanceof Array ) ) {
//                 this.entity[ fieldName ] = [];
//             }
//             this.entity[ fieldName ].push( val );

//             return this.save();
//         };
//         proto[ 'set' + inflect.camelize( fieldName, true ) ] = function( val ) {
//             this.entity[ fieldName ]   = val instanceof Array ? val : [ val ];

//             return this.save();
//         };
//     },

//     belongsTo: function( mongoose, model, proto, assocTo ) {
//         var fieldName   = inflect.singularize( inflect.camelize( assocTo, true ) )
//           , idName      = fieldName + 'Id';

//         model.fields[ fieldName ]      = {
//             type    : mongoose.Schema.ObjectId,
//             of      : assocTo
//         };
//         model.getters[ fieldName ]     = function() {
//             return this.entity[ fieldName ];
//         };
//         model.setters[ fieldName ]     = function( val ) {
//             this.entity[ fieldName ]    = val;

//             return this;
//         };
//         model.getters[ idName ]        = function() {
//             return this.entity[ fieldName ] &&
//                 this.entity[ assocTo ].entity &&
//                 this.entity[ assocTo ].entity._id ? this.entity[ assocTo ].entity._id : this.entity[ assocTo ];
//         };
//         model.setters[ idName ]        = function( val ) {
//             this.entity[ fieldName ]    = val.id || val;

//             return this;
//         };
//         proto[ 'set' + fieldName ]      = function( val ) {
//             this.entity[ fieldName ]    = val;

//             return this.save();
//         };
//     }
// };