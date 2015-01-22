var mongoose        = require( 'mongoose' )
  , injector        = require( 'injector' )
  , Module          = require( 'classes' ).Module
  , Model           = require( 'classes' ).Model
  , odmUtils        = require( 'utils' ).odmUtils
  , dbRef           = require( 'mongoose-dbref' )
  , deepPopulate    = require( 'mongoose-deep-populate' );


module.exports      = Module.extend({

    models: {},

    mongoose: mongoose,

    preSetup: function() {
        this.debug( 'Opening database connection to Mongo ' + this.config.uri + '...' );

        if ( this.config.mongoose && undefined !== this.config.mongoose.debug ) {
            mongoose.set( 'debug', this.config.mongoose.debug );
        }
    },

    preInit: function() {
        this.debug( 'Adding mongoose to the injector...' );

        injector.instance( 'mongoose', mongoose );
        injector.instance( 'mongooseDbRef', dbRef );
        injector.instance( 'mongooseDeepPopulate', deepPopulate );
    },

    modulesLoaded: function() {
        mongoose.connect( this.config.uri, this.proxy( 'handleMongoConnect' ) );
    },

    defineModelsAssociations: function() {
        this.debug( 'Defining model assocations' );

        Object.keys( this.config.modelAssociations ).forEach( this.proxy( function( modelName ) {
            Object.keys( this.config.modelAssociations[ modelName ] ).forEach( this.proxy( 'defineModelAssociations', modelName ) );
        }));
    },

    defineModelAssociations: function( Static, Proto, assocType ) {
        var modelName = Static._name
          , associatedWith = this.config.modelAssociations[ modelName ][ assocType ];

        if ( ! associatedWith instanceof Array ) {
            associatedWith = [ associatedWith ];
        }

        associatedWith.forEach( this.proxy( 'associateModels', Static, Proto, assocType ) );
    },

    associateModels: function( Static, Proto, assocType, assocTo ) {
        var modelName   = Static._name
          , models      = require( 'models' );

        if ( Static.type.toLowerCase() === 'odm' ) {
            // Support second argument
            if ( assocTo instanceof Array ) {
                this.debug( '%s %s %s with second argument of ', modelName, assocType, assocTo[0], assocTo[1] );

                if ( assocTo[ 1 ].through ) {
                    assocTo[ 1 ].through =  models[ assocTo[ 1 ].through.replace( 'Model', '' ) ];
                }

                models[ modelName ][ assocType ]( models[ assocTo[0] ], assocTo[1] );
            } else {
                this.debug( '%s %s %s', modelName, assocType, assocTo );
                odmUtils[ assocType ]( mongoose, Static, Proto, assocTo );
            }
        }
    },

    handleMongoConnect: function( err ) {
        dbRef.install( mongoose );
        this.emit( 'ready', err );
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

        parseDebug( 'Parsing options...' );
        if ( !!Static.dbName ) {
            mongooseConf.collection = Static.dbName;
        }

        if ( this.config.modelAssociations[ Static._name ] ) {
            Object.keys( this.config.modelAssociations[ Static._name ] ).forEach( this.proxy( 'defineModelAssociations', Static, Proto ) );
        }

        parseDebug( 'Parsing schema...' );
        Object.keys( Static._schema ).forEach( this.proxy( 'parseSchemaField', Static, fields, mongooseConf ) );

        parseDebug( 'Set _db to mongoose...' );
        Static._db = mongoose;

        parseDebug( 'Generating mongoose schema...' );
        var schema = new mongoose.Schema( fields, mongooseConf );

        parseDebug( 'Generating new native model using computed schema...' );
        var model = mongoose.model( Static._name, schema );

        parseDebug( 'Registering deepPopulate plugin...' );
        schema.plugin( deepPopulate, {} );

        parseDebug( 'Caching completed model...' );
        this.models[ Static._name ] = model;

        return model;
    },

    parseSchemaField: function( Static, fields, mongooseConf, name ) {
        var options = Static._schema[ name ]
          , fieldDefinition = {};

        // Allow direct syntax
        if ( typeof options !== 'object' || options instanceof Array ) {
            options = {
                type: options
            }
        }

        // Handle array of "Something"
        if ( options.type instanceof Array || options.type === Array ) {
            options.of = ( options.type.length > 0 && options.type[ 0 ] !== undefined ) ? options.type[ 0 ] : String;
            options.type = Array;
        }

        // Map the primary key for mongoose
        if ( !!options.primaryKey ) {
            if ( name !== 'id' ) {
                throw new Error( [ 'You cannot have a primaryKey that is not called id with the ODM module.' ] );
            }
            Static.primaryKey = name;
            mongooseConf.id = true;
            mongooseConf._id = true;
            fieldDefinition = mongoose.Schema.Types.ObjectId;
        } else {
            fieldDefinition.type = this.getFieldType( Static, options );
        }

        // Handle options
        [ 'unique', 'default', 'lowercase', 'trim', 'uppercase' ].forEach(function( optionName ) {
            if ( options[ optionName ] !== undefined ) {
                fieldDefinition[ optionName ] = options[ optionName ];
            }
        });

        if ( typeof fieldDefinition.type === 'object' && fieldDefinition.type.type ) {
            fieldDefinition.ref     = fieldDefinition.type.ref;
            fieldDefinition.type    = fieldDefinition.type.type;
        }

        fields[ name ] = fieldDefinition;
    },

    getFieldType: function( Static, options ) {
        var field;

        switch( options.type ) {

        case mongoose.Schema.ObjectId:
            options.ref = options.of;
            delete options.of;
            field = options;
            break;
        case Number:
        case String:
        case Boolean:
        case Date:
        case Buffer:
            field = options.type;
            break;
        case Array:
            field = options.of ? [ this.getFieldType( Static, options.of ) ] : [ String ];
            break;
        case Model.Types.ENUM:
            throw new Error( 'ENUM is not supported for ODM (yet)' );
        case Model.Types.BIGINT:
        case Model.Types.FLOAT:
        case Model.Types.DECIMAL:
            field = Number;
            break;
        case Model.Types.TEXT:
            field = String;
            break;
        case undefined:
            throw new Error( [ 'You must define the type of field that', '"' + name + '"', 'is on the', '"' + Static.name + '" model' ].join( ' ' ) );
        default:
            throw new Error( [ 'You must define a valid type for the field named', '"' + name + '"', 'on the', '"' + Static.name + '" model' ].join( ' ' ) );
        }

        return field;
    },

    preShutdown: function() {
        this.debug( 'Closing database connection...' );
        mongoose.disconnect();
    }
});