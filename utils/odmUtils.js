var inflect     = require( 'i' )()
  , injector    = require( 'injector' )
  , Promise     = require( 'bluebird' );

module.exports  = {
    supportSingleModule: function( env, moduleName ) {
        if ( moduleName ) {
            env.packageJson.bundledDependencies.length = 0
            env.packageJson.bundledDependencies.push( 'clever-odm', env );
            env.packageJson.bundledDependencies.push( moduleName, env );
        }
    },

    hasMany: function( mongoose, owningModel, owningProto, inverseModel ) {
        var pluralName = inflect.pluralize( inverseModel );

        owningModel._schema[ pluralName ] = [ { type: mongoose.Schema.ObjectId, of: inverseModel } ];
        owningModel._getters[ pluralName ] = function() {
            return this._model[ pluralName ];
        };
        owningModel._setters[ pluralName ] = function( val ) {
            this._model[ pluralName ] = val;
        };
        owningProto[ 'add' + inflect.camelize( pluralName, true ) ] = function( val ) {
            if ( !( this._model[ pluralName ] instanceof Array ) ) {
                this._model[ pluralName ] = [];
            }
            this._model[ pluralName ].push( val );
            return this.save();
        };
        owningProto[ 'set' + inflect.camelize( pluralName, true ) ] = function( val ) {
            this._model[ pluralName ] = val instanceof Array ? val : [ val ];
            return this.save();
        };
    },

    belongsTo: function( mongoose, owningModel, owningProto, inverseModel ) {
        var idName = inverseModel + 'Id';

        owningModel._schema[ inverseModel ] = { type: mongoose.Schema.ObjectId, of: inverseModel };
        owningModel._getters[ inverseModel ] = function() {
            return this._model[ inverseModel ];
        };
        owningModel._setters[ inverseModel ] = function( val ) {
            console.log('setting ' + inverseModel + ' to ');
            console.dir( val );
            this._model[ inverseModel ] = val;
        };
        owningModel._getters[ idName ] = function() {
            return this._model[ inverseModel ] && this._model[ inverseModel ]._model && this._model[ inverseModel ]._model._id ? this._model[ inverseModel ]._model._id : this._model[ inverseModel ];
        };
        owningModel._setters[ idName ] = function( val ) {
            this._model[ inverseModel ] = val.id || val;
        };
        owningProto[ 'set' + inflect.singularize( inflect.camelize( inverseModel, true ) ) ] = function( val ) {
            this._model[ inverseModel ] = val;
            return this.save();
        };
    }
};