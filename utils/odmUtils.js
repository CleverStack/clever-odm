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

    hasMany: function( mongoose, model, proto, assocTo ) {
        var fieldName = inflect.singularize( inflect.camelize( assocTo, true ) )

        model._schema[ fieldName ]     = [
            {
                type    : mongoose.Schema.ObjectId,
                of      : assocTo
            }
        ];
        model._getters[ fieldName ]    = function() {
            return this._model[ fieldName ];
        };
        model._setters[ fieldName ]    = function( val ) {
            this._dirty                = true;
            this._model[ fieldName ]   = val;
            this._changed.push( fieldName );

            return this;
        };
        proto[ 'add' + inflect.camelize( fieldName, true ) ] = function( val ) {
            if ( !( this._model[ fieldName ] instanceof Array ) ) {
                this._model[ fieldName ] = [];
            }
            this._dirty                = true;
            this._model[ fieldName ].push( val );
            this._changed.push( fieldName );

            return this.save();
        };
        proto[ 'set' + inflect.camelize( fieldName, true ) ] = function( val ) {
            this._dirty                = true;
            this._model[ fieldName ]   = val instanceof Array ? val : [ val ];
            this._changed.push( fieldName );

            return this.save();
        };
    },

    belongsTo: function( mongoose, model, proto, assocTo ) {
        var fieldName   = inflect.singularize( inflect.camelize( assocTo, true ) )
          , idName      = fieldName + 'Id';

        model._schema[ fieldName ]      = {
            type    : mongoose.Schema.ObjectId,
            of      : assocTo
        };
        model._getters[ fieldName ]     = function() {
            return this._model[ fieldName ];
        };
        model._setters[ fieldName ]     = function( val ) {
            this._dirty                 = true;
            this._model[ fieldName ]    = val;
            this._changed.push( fieldName );

            return this;
        };
        model._getters[ idName ]        = function() {
            return this._model[ fieldName ] &&
                this._model[ assocTo ]._model &&
                this._model[ assocTo ]._model._id ? this._model[ assocTo ]._model._id : this._model[ assocTo ];
        };
        model._setters[ idName ]        = function( val ) {
            this._dirty                 = true;
            this._model[ fieldName ]    = val.id || val;
            this._changed.push( fieldName );

            return this;
        };
        proto[ 'set' + fieldName ]      = function( val ) {
            this._dirty                 = true;
            this._model[ fieldName ]    = val;
            this._changed.push( fieldName );

            return this.save();
        };
    }
};