var injector   = require('injector')
  , utils      = require('utils')
  , modelUtils = utils.modelUtils;

module.exports.load = function eagerLoad(findOptions) {
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

  if (findOptions.include) {
    findOptions.include.forEach( addToPopulate );
  }

  return populate.length ? populate : false;
};

module.exports.afterLoad = function hydrateAfterEagerLoad(findOptions, entity) {
  var model = !!entity && entity !== null ? new this( entity ) : null;

  if ( model !== null && findOptions.include && findOptions.include.length ) {
    findOptions.include.forEach(function( _include ) {
      var modelName   = _include.model.modelName
        , as          = modelName
        , CsModel     = this.models[ modelName ];

      if ( !!CsModel && !!model.entity[ as ] ) {
        if ( model.entity[ as ] instanceof Array ) {
          for ( var i = 0; i < model.entity[ as ].length; i++ ) {
            if ( !( model.entity[ as ][ i ] instanceof CsModel ) ) {
              model.entity._doc[ as ][ i ] = new CsModel( model.entity[ as ][ i ] );
            }
          }
        } else {
          if ( !( model.entity[ as ] instanceof CsModel ) ) {
            model.entity._doc[ as ] = new CsModel( model[ as ] );
          }
        }
      }
    }
    .bind(this));
  }
};