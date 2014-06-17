var injector    = require( 'injector' )
  , utils       = require( 'utils' )
  , async       = require( 'async' )
  , path        = require( 'path' )
  , odmUtils    = require( path.resolve( path.join( __dirname, '..', 'lib', 'utils.js' ) ) )
  , env         = utils.bootstrapEnv()
  , moduleLdr   = env.moduleLoader;

// Rebase once our modules have loaded
moduleLdr.on( 'modulesLoaded', function() {
    var mongoose = injector.getInstance( 'mongoose' );

    console.log('Forcing Database to be created! (Note: All your data will disapear!)');
    async.waterfall(
        [
            function dropDatabase( callback ) {
                mongoose.connection.db.dropDatabase( function( err ) {
                    callback( err );
                });
            },

            function createDatabase( callback ) {
                var schemas = Object.keys( mongoose.connections[ 0 ].base.modelSchemas );

                async.each(
                    schemas,
                    function createCollection( key, done ) {
                        mongoose.model( key, schemas[ key ] ).ensureIndexes( done )
                    },
                    callback
                );
            }
        ],
        function shutdown( err ) {
            if ( err === null ) {
                console.log( 'Mongo Database is rebased' );
                env.moduleLoader.shutdown();
            } else {
                console.error('Error ' + env.config['clever-odm'].uri, err);
                env.moduleLoader.shutdown();
            }
        }
    );
});

odmUtils.supportSingleModule( env, process.argv && process.argv[ 2 ] != 'null' ? process.argv[ 2 ] : false );

// Load
moduleLdr.loadModules();