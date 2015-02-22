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

    afterEagerLoad: function( findOptions, callback, err, entity ) {
        if ( err === undefined || err === null ) {
            var model = !!entity && entity !== null ? new that( entity ) : null;

            if ( model !== null && findOptions.include && findOptions.include.length ) {
                findOptions.include.forEach( function( _include ) {
                    var modelName   = _include.model.modelName
                      , as          = modelName
                      , csModel     = models[ modelName ];

                    if ( !!csModel && !!model.entity[ as ] ) {
                        if ( model.entity[ as ] instanceof Array ) {
                            for ( var i = 0; i < model.entity[ as ].length; i++ ) {
                                if ( !( model.entity[ as ][ i ] instanceof csModel ) ) {
                                    model.entity._doc[ as ][ i ] = new csModel( model.entity[ as ][ i ] );
                                }
                            }
                        } else {
                            if ( !( model.entity[ as ] instanceof csModel ) ) {
                                model.entity._doc[ as ] = new csModel( model[ as ] );
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
            that.entity.findOne( findOptions.where ).deepPopulate( eagerlyLoadedModels.join( ' ' ) ).exec( afterEagerLoad );
        } else {
            that.entity.findOne( findOptions.where, afterEagerLoad );
        }
    },

    findAll: function( findOptions, options, callback ) {
        if ( findOptions.include ) {
            var populate = [];

            findOptions.include.forEach( function( modelInclude ) {
                populate.push( modelInclude.model.modelName );
            });

            that.entity.find( findOptions.where ).deepPopulate( populate.join( ' ' ) ).exec( callback );

        } else {
            that.entity.find( findOptions.where, callback );
        }
    },

    findAll: function( findOptions, options, callback ) {
        var that = this;

        ormUtils.eagerLoad( findOptions );

        this.entity
        .findAll( findOptions, options )
        .then( function( entitys ) {
            var models = [];
            
            entitys = entitys instanceof Array ? entitys : [ entitys ];

            entitys.forEach(function( model ) {
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

        model.fields[ fieldName ]     = [
            {
                type    : mongoose.Schema.ObjectId,
                of      : assocTo
            }
        ];
        model.getters[ fieldName ]    = function() {
            return this.entity[ fieldName ];
        };
        model.setters[ fieldName ]    = function( val ) {
            this.entity[ fieldName ]   = val;

            return this;
        };
        proto[ 'add' + inflect.camelize( fieldName, true ) ] = function( val ) {
            if ( !( this.entity[ fieldName ] instanceof Array ) ) {
                this.entity[ fieldName ] = [];
            }
            this.entity[ fieldName ].push( val );

            return this.save();
        };
        proto[ 'set' + inflect.camelize( fieldName, true ) ] = function( val ) {
            this.entity[ fieldName ]   = val instanceof Array ? val : [ val ];

            return this.save();
        };
    },

    belongsTo: function( mongoose, model, proto, assocTo ) {
        var fieldName   = inflect.singularize( inflect.camelize( assocTo, true ) )
          , idName      = fieldName + 'Id';

        model.fields[ fieldName ]      = {
            type    : mongoose.Schema.ObjectId,
            of      : assocTo
        };
        model.getters[ fieldName ]     = function() {
            return this.entity[ fieldName ];
        };
        model.setters[ fieldName ]     = function( val ) {
            this.entity[ fieldName ]    = val;

            return this;
        };
        model.getters[ idName ]        = function() {
            return this.entity[ fieldName ] &&
                this.entity[ assocTo ].entity &&
                this.entity[ assocTo ].entity._id ? this.entity[ assocTo ].entity._id : this.entity[ assocTo ];
        };
        model.setters[ idName ]        = function( val ) {
            this.entity[ fieldName ]    = val.id || val;

            return this;
        };
        proto[ 'set' + fieldName ]      = function( val ) {
            this.entity[ fieldName ]    = val;

            return this.save();
        };
    }
};