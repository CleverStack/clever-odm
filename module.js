var mongoose    = require( 'mongoose' )
  , injector    = require( 'injector' )
  , Module      = require( 'classes' ).Module;

module.exports = Module.extend({

    models: {},

    mongoose: mongoose,

    preSetup: function() {
        this.debug( 'Opening database connection to Mongo ' + this.config.uri + '...' );

        mongoose.set( 'debug', this.config.mongoose.debug );
    },

    modulesLoaded: function() {
        mongoose.connect( this.config.uri, this.proxy( 'handleMongoConnect' ) );
    },

    handleMongoConnect: function( err ) {
        this.emit( 'ready', err );
    },

    preInit: function() {
        this.debug( 'Adding mongoose to the injector...' );

        injector.instance( 'mongoose', mongoose );
    },

    parseModelSchema: function( Static ) {
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

        parseDebug( 'Parsing schema...' );
        Object.keys( Static._schema ).forEach( this.proxy( 'parseSchemaField', Static, fields, mongooseConf ) );

        parseDebug( 'Set _db to mongoose...' );
        Static._db = mongoose;

        parseDebug( 'Generating new native model using computed schema...' );
        var model = mongoose.model( Static._name, new mongoose.Schema( fields, mongooseConf ) );

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
        [ 'unique', 'required', 'default', 'min', 'max', 'lowercase', 'match', 'trim', 'uppercase' ].forEach(function( optionName ) {
            if ( options[ optionName ] !== undefined ) {
                fieldDefinition[ optionName ] = options[ optionName ];
            }
        });

        fields[ name ] = fieldDefinition;
    },

    getFieldType: function( Static, options ) {
        var field;

        switch( options.type ) {

        case Number:
        case String:
        case Boolean:
        case Date:
        case Buffer:
            field = options.type;
            break;
        case Array:
            field = options.of ? [ this.getFieldType( Static, { type: options.of } ) ] : [ String ];
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