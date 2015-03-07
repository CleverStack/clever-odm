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

  findOptions.include.forEach( addToPopulate );

  return populate.length ? populate : false;
}

module.exports.afterLoad = function hydrateAfterEagerLoad(findOptions, callback, err, entity) {
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
}