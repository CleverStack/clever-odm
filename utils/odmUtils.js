var inflect     = require( 'i' )()
  , injector    = require( 'injector' )
  , Promise     = require( 'bluebird' );

var odmUtils    = module.exports  = {
    supportSingleModule: function( env, moduleName ) {
        if ( moduleName ) {
            env.packageJson.bundledDependencies.length = 0
            env.packageJson.bundledDependencies.push( 'clever-odm', env );
            env.packageJson.bundledDependencies.push( moduleName, env );
        }
    },

    renameId: function( findOptions ) {
        if ( findOptions.where.id ) {
            findOptions.where._id = findOptions.where.id;
            delete findOptions.where.id;
        }
    },

    eagerLoad: function( findOptions ) {
        var populate = []
          , addToPopulate = function( modelInclude, index, array, parentInclude ) {
                var include = modelInclude.model.modelName || modelInclude.modelName;

                if ( parentInclude ) {
                    include = parentInclude + '.' + include;
                }

                populate.push( include );
                if ( modelInclude.include ) {
                    modelInclude.include.forEach( function() {
                        addToPopulate.apply( this, [ arguments[ 0 ], arguments[ 1 ], arguments[ 2 ], include ] );
                    });
                }
            };

        findOptions.include.forEach( addToPopulate );

        return populate.length ? populate : false;
    },

    afterEagerLoad: function( findOptions, callback, err, _model ) {
        if ( err === undefined || err === null ) {
            var model = !!_model && _model !== null ? new that( _model ) : null;

            if ( model !== null && findOptions.include && findOptions.include.length ) {
                findOptions.include.forEach( function( _include ) {
                    var modelName   = _include.model.modelName
                      , as          = modelName
                      , csModel     = models[ modelName ];

                    if ( !!csModel && !!model._model[ as ] ) {
                        if ( model._model[ as ] instanceof Array ) {
                            for ( var i = 0; i < model._model[ as ].length; i++ ) {
                                if ( !( model._model[ as ][ i ] instanceof csModel ) ) {
                                    model._model._doc[ as ][ i ] = new csModel( model._model[ as ][ i ] );
                                }
                            }
                        } else {
                            if ( !( model._model[ as ] instanceof csModel ) ) {
                                model._model._doc[ as ] = new csModel( model[ as ] );
                            }
                        }
                    }
                });
            }

            callback( null, model );
        } else {
            callback( err );
        }
    },

    find: function( findOptions, options, callback ) {
        var afterEagerLoad = this.proxy( odmUtils.afterEagerLoad, findOptions, callback )
          , eagerlyLoadedModels;

        odmUtils.renameId( findOptions );

        if ( ( eagerlyLoadedModels = odmUtils.eagerLoad( findOptions ) ) !== false ) {
            that._model.findOne( findOptions.where ).deepPopulate( eagerlyLoadedModels.join( ' ' ) ).exec( afterEagerLoad );
        } else {
            that._model.findOne( findOptions.where, afterEagerLoad );
        }
    },

    findAll: function( findOptions, options, callback ) {
        if ( findOptions.include ) {
            var populate = [];

            findOptions.include.forEach( function( modelInclude ) {
                populate.push( modelInclude.model.modelName );
            });

            that._model.find( findOptions.where ).deepPopulate( populate.join( ' ' ) ).exec( callback );

        } else {
            that._model.find( findOptions.where, callback );
        }
    },

    findAll: function( findOptions, options, callback ) {
        var that = this;

        ormUtils.eagerLoad( findOptions );

        this._model
        .findAll( findOptions, options )
        .then( function( _models ) {
            var models = [];
            
            _models = _models instanceof Array ? _models : [ _models ];

            _models.forEach(function( model ) {
                if ( model !== null ) {
                    model = new that( model );

                    ormUtils.afterEagerLoad.apply( that, [ findOptions, model ] );

                    models.push( model );
                }
            });

            callback( null, models );
        })
        .catch( callback );
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