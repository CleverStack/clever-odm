'use strict';

var fs          = require( 'fs' )
  , path        = require( 'path' )
  , pkgJson     = require( path.resolve( path.join( __dirname, '..', '..', 'package.json') ) )
  , ormEnabled  = pkgJson.bundledDependencies.indexOf( 'clever-orm' ) !== -1;

module.exports = function( grunt ) {
    // Arguments for individual module rebase/seed
    var dbTarget = grunt.option( 'module' ) || null;

    return [{
        prompt: {
            cleverOdmConfig: {
                options: {
                    questions: [
                        {
                            config: 'cleverOdm.uri',
                            type: 'input',
                            message: 'Mongo URI',
                            default: '',
                        },
                        {
                            config: 'cleverOdm.debug',
                            type: 'boolean',
                            message: 'Enable mongoose debug mode?',
                            default: true
                        }
                    ]
                }
            }
        },
        exec: {
            odmRebase: {
                cmd: "NODE_PATH=./lib/:./modules/; node modules/clever-odm/bin/rebase.js " + dbTarget
            },
            odmSeed: {
                cmd: "NODE_PATH=./lib/:./modules/; node modules/clever-odm/bin/seedModels.js " + dbTarget
            }
        }
    }, function( grunt ) {
        grunt.loadNpmTasks('grunt-prompt');

        // Register each command
        grunt.registerTask( 'db:odmRebase', [ 'exec:odmRebase' ] );
        grunt.registerTask( 'db:odmSeed', [ 'exec:odmSeed' ] );
        
        // Register grouped command
        grunt.registerTask( 'db:odm', [ 'db:odmRebase', 'db:odmSeed' ] );

        if ( ormEnabled ) {
            grunt.registerTask( 'db', [ 'db:orm', 'db:odm' ] );
            grunt.registerTask( 'db:rebase', [ 'db:ormRebase', 'db:odmRebase' ] );
            grunt.registerTask( 'db:seed', [ 'db:ormSeed', 'db:odmSeed' ] );
        } else {
            grunt.registerTask( 'db:rebase', [ 'db:odmRebase' ] );
            grunt.registerTask( 'db:seed', [ 'db:odmSeed' ] );
            grunt.registerTask( 'db', [ 'db:odm' ] );
        }

        // Register readme task
        grunt.registerTask( 'readme', 'Displays helpful infodmation', function ( ) {
            console.log( 'Installation instructions:' );
            console.log( '1. In the config file for your desired environment (ie. backend/config/local.json), update the clever-odm object with the details for your database.' );
            console.log( '' );
            console.log( '2. From your project\'s `backend` folder, run `NODE_ENV=local grunt db`.' );
            console.log( 'The database tables for your modules should now be installed and seeded with data!' );
        } );

        grunt.registerTask( 'prompt:cleverOdm', [ 'prompt:cleverOdmConfig', 'cleverOdmCreateConfig' ] );
        grunt.registerTask( 'cleverOdmCreateConfig', 'Creates a .json config file for database credentials', function ( ) {
            var conf = grunt.config( 'cleverOdm' )
              , obj  = {
                    'clever-odm': { mongoose: {} }
                }
              , env  = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'local'
              , file = path.join( process.cwd( ), 'config', env + '.json' );

            if ( fs.existsSync( file ) ) {
                obj = require( file );
            }

            obj[ 'clever-odm' ] = obj[ 'clever-odm' ] || {};
            obj[ 'clever-odm' ].uri = conf.uri;
            obj[ 'clever-odm' ].mongoose.debug = conf.debug;

            fs.writeFileSync( file, JSON.stringify( obj, null, '  ' ) );
        } );
    }];
};