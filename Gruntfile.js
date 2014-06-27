'use strict';

var fs          = require( 'fs' )
  , path        = require( 'path' )
  , pkgJson     = require( path.resolve( path.join( __dirname, '..', '..', 'package.json') ) )
  , ormEnabled  = pkgJson.bundledDependencies.indexOf( 'clever-orm' ) !== -1
  , _           = require( 'underscore' );

module.exports = function( grunt ) {
    var dbTarget        = grunt.option( 'module' ) || null
      , defaultConfig   = require( path.join( __dirname, 'config', 'default.json' ) )
      , configFile      = null
      , config          = {};

    return [{
        prompt: {
            odmConfigPrompt: {
                options: {
                    questions: [
                        {
                            config: 'cleverstackodm.environment',
                            type: 'list',
                            message: 'What environment is this configuration for?',
                            choices: [
                                { name: 'LOCAL' },
                                { name: 'TEST' },
                                { name: 'DEV' },
                                { name: 'STAG' },
                                { name: 'PROD' }
                            ],
                            default: function() {
                                return process.env.NODE_ENV ? process.env.NODE_ENV.toUpperCase() : 'LOCAL';
                            },
                            filter: function( env ) {
                                _.extend( config, defaultConfig );

                                configFile = path.resolve( path.join( __dirname, '..', '..', 'config', env.toLowerCase() + '.json' ) );

                                if ( fs.existsSync( configFile ) ) {
                                    _.extend( config, require( configFile ) );
                                    
                                    Object.keys( defaultConfig[ 'clever-odm' ] ).forEach( function( key ) {
                                        if ( typeof config[ 'clever-odm' ][ key ] === 'undefined' ) {
                                            config[ 'clever-odm' ][ key ] = defaultConfig[ 'clever-odm' ][ key ];
                                        }
                                    });
                                }

                                return true;
                            }
                        },
                        {
                            config: 'cleverstackodm.uri',
                            type: 'input',
                            message: 'Mongo URI',
                            default: function() {
                                return config[ 'clever-odm' ].uri !== '' ? config[ 'clever-odm' ].uri : 'mongodb://localhost/nodeseed';
                            }
                        },
                        {
                            config: 'cleverstackodm.mongoose.debug',
                            type: 'confirm',
                            message: 'Enable debugging',
                            default: function() {
                                return config[ 'clever-odm' ].mongoose.debug !== '' ? config[ 'clever-odm' ].mongoose.debug : 'mongodb://localhost/nodeseed';
                            }
                        }
                    ]
                }
            }
        },
        exec: {
            odmRebase: {
                cmd: "node modules/clever-odm/bin/rebase.js " + dbTarget
            },
            odmSeed: {
                cmd: "node modules/clever-odm/bin/seedModels.js " + dbTarget
            }
        }
    }, function( grunt ) {
        grunt.loadNpmTasks( 'grunt-prompt' );

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
        });

        grunt.registerTask( 'prompt:cleverOdmConfig', [ 'prompt:odmConfigPrompt', 'cleverOdmCreateConfig' ] );
        grunt.registerTask( 'cleverOdmCreateConfig', 'Creates a .json config file for database credentials', function() {
            var conf = grunt.config( 'cleverstackodm' );

            delete conf.environment;

            config[ 'clever-odm' ] = _.extend( config[ 'clever-odm' ], conf );

            fs.writeFileSync( configFile, JSON.stringify( config, null, '    ' ) );
        });
    }];
};