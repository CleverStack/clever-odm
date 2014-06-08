var mongoose    = require( 'mongoose' )
  , injector    = require( 'injector' )
  , Module      = require( 'classes' ).Module;

module.exports = Module.extend({

    models: {},

    mongoose: mongoose,

    preSetup: function() {
        this.debug( 'Opening database connection to Mongo ' + this.config.uri + '...' );

        mongoose.connect( this.config.uri );
        mongoose.set( 'debug', this.config.mongoose.debug );
    },

    preInit: function() {
        this.debug( 'Adding mongoose to the injector...' );

        injector.instance( 'mongoose', mongoose );
    },

    parseModelSchema: function( Static, Proto ) {
        var parseDebug = this.proxy(function( msg ) { 
                this.debug( Static._name + 'Model: ' + msg ); 
            })
          , mongooseConf = {}
          , fields = {};

        if ( this.models[ Static._name ] !== undefined ) {
            parseDebug( 'Returning previously parsed, generated and cached model...' );
            return this.models[ Static._name ];
        }

        parseDebug( 'Parsing schema...' );
        Object.keys( Static._schema ).forEach(function( name ) {
            var options = Static._schema[ name ]
              , fieldDefinition = {};

            // If a type has been specified outside of the object, handle that
            if ( typeof options !== 'object' ) {
                options = {
                    type: options
                }
            }

            // Figure out the type mapping for mongoosejs
            switch( options.type ) {
                case Number:
                    if ( !!options.primaryKey ) {
                        if ( name !== 'id' ) {
                            throw new Error( [ 'You cannot have a primaryKey that is not called id with the ODM module.' ] );
                        }
                        Static.primaryKey = name;
                        mongooseConf.id = true;
                        mongooseConf._id = true;
                        fieldDefinition = mongoose.Schema.Types.ObjectId;
                        break;
                    }
                case String:
                case Boolean:
                case Date:
                    fieldDefinition.type = options.type;

                    // Handle options
                    [ 'unique', 'required', 'default' ].forEach(function( optionName ) {
                        if ( options[ optionName ] !== undefined ) {
                            fieldDefinition[ optionName ] = options[ optionName ];
                        }
                    });
                    break;
                case mongoose.Schema.Types.ObjectId:
                    fieldDefinition = mongoose.Schema.Types.ObjectId;
                    break;
                case undefined:
                    throw new Error( [ 'You must define the type of field that', '"' + name + '"', 'is on the', '"' + Static.name + '" model' ].join( ' ' ) );
                    break;
                default:
                    throw new Error( [ 'You must define a valid type for the field named', '"' + name + '"', 'on the', '"' + Static.name + '" model' ].join( ' ' ) );
                    break;
            }

            if ( fieldDefinition !== null ) {
                fields[ name ] = fieldDefinition;
            }
        });

        parseDebug( 'Set _db to mongoose...' );
        Static._db = mongoose;

        parseDebug( 'Generating new native model using computed schema...' );
        var model = mongoose.model( Static._name, new mongoose.Schema( fields, mongooseConf ) );

        parseDebug( 'Caching completed model...' );
        this.models[ Static._name ] = model;

        return model;
    },

    preShutdown: function() {
        this.debug( 'Closing database connection...' );
        mongoose.disconnect();
    }
});