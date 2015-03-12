var mongoose     = require('mongoose')
  , injector     = require('injector')
  , inflect      = require('i')()
  , Module       = require('classes').Module
  , Model        = require('classes').Model
  , debug        = require('debug')
  , odmUtils     = require('utils').odmUtils
  , lifecycle    = require('mongoose-lifecycle')
  , dbRef        = require('mongoose-dbref')
  , deepPopulate = require('mongoose-deep-populate');

module.exports   = Module.extend({

  models: {},

  mongoose: mongoose,

  preSetup: function() {
    var dbConfig     = this.config.mongoose
      , queryLogger  = debug('cleverstack:queryLog');

    if (!!dbConfig.debug || queryLogger.enabled) {
      if (!queryLogger.enabled) {
        debug.enable('cleverstack:queryLog');
        queryLogger  = debug('cleverstack:queryLog');
      }
      dbConfig.debug = queryLogger;
    }

    this.debug('Opening database connection to Mongo ' + this.config.uri + '...');

    // Setup mongoose-bird (bluebird)
    require('mongoose-bird')(mongoose);

    if (this.config.mongoose && undefined !== this.config.mongoose.debug) {
      mongoose.set('debug', this.config.mongoose.debug);
    }

    this.debug('Adding mongoose to the injector...');

    injector.instance('mongoose', mongoose);
    injector.instance('mongooseDbRef', dbRef);
    injector.instance('mongooseDeepPopulate', deepPopulate);
  },

  modulesLoaded: function() {
    mongoose.connect(this.config.uri, this.proxy('handleMongoConnect'));
  },

  defineModelsAssociations: function() {
    this.debug('Defining model assocations');

    Object.keys(this.config.modelAssociations).forEach(this.proxy(function(modelName) {
      Object.keys(this.config.modelAssociations[ modelName ]).forEach(this.proxy('defineModelAssociations', modelName));
    }));
  },

  defineModelAssociations: function(Klass, Proto, assocType) {
    var modelName = Klass.modelName
      , associatedWith = this.config.modelAssociations[ modelName ][ assocType ];

    if (! associatedWith instanceof Array) {
      associatedWith = [ associatedWith ];
    }

    associatedWith.forEach(this.proxy('associateModels', Klass, Proto, assocType));
  },

  associateModels: function(Klass, Proto, assocType, assocTo) {
    var modelName   = Klass.modelName
      , models      = require('models');

    if (Klass.type.toLowerCase() === 'odm') {
      // Support second argument
      if (assocTo instanceof Array) {
        this.debug('%s %s %s with second argument of ', modelName, assocType, assocTo[0], assocTo[1]);

        if (assocTo[ 1 ].through) {
          assocTo[ 1 ].through =  models[ assocTo[ 1 ].through.replace('Model', '') ];
        }

        models[ modelName ][ assocType ](models[ assocTo[0] ], assocTo[1]);
      } else {
        this.debug('%s %s %s', modelName, assocType, assocTo);
        odmUtils[ assocType ](mongoose, Klass, Proto, assocTo);
      }
    }
  },

  handleMongoConnect: function(err) {
    dbRef.install(mongoose);
    this.emit('ready', err);
  },

  parseModelSchema: function(Klass, Proto) {
    var parseDebug = this.proxy(function(msg) {
          this.debug(Klass.modelName + 'Model: ' + msg);
        })
      , mongooseConf = {}
      , fields = {};

    if (this.models[ Klass.modelName ] !== undefined) {
      parseDebug('Returning previously parsed, generated and cached model...');
      return this.models[ Klass.modelName ];
    }

    parseDebug('Parsing options...');
    if (!!Klass.dbName) {
      mongooseConf.collection = Klass.dbName;
    }

    if (this.config.modelAssociations[ Klass.modelName ]) {
      Object.keys(this.config.modelAssociations[ Klass.modelName ]).forEach(this.proxy('defineModelAssociations', Klass, Proto));
    }

    parseDebug('Parsing schema...');
    Object.keys(Klass.fields).forEach(this.proxy('defineField', Klass, fields, mongooseConf));

    parseDebug('Set connection to mongoose...');
    Klass.connection = mongoose;

    parseDebug('Generating mongoose schema...');
    var schema = new mongoose.Schema(fields, mongooseConf);

    parseDebug('Generating new native model using computed schema...');
    var model = mongoose.model(Klass.modelName, schema);

    parseDebug('Registering deepPopulate plugin...');
    schema.plugin(deepPopulate, {});

    parseDebug('Registering lifecycle events plugin...');
    schema.plugin(lifecycle);

    parseDebug('Caching completed model...');
    this.models[ Klass.modelName ] = model;

    return model;
  },

  defineField: function(Klass, fields, mongooseConf, name) {
    var fieldDefinition = {}
      , columnName      = name
      , options         = Klass.fields[name];

    // Allow direct syntax
    if (typeof options !== 'object' || options instanceof Array) {
      options = {
        type: options
      };
    }

    // Handle array of "Something"
    if (options.type instanceof Array || options.type === Array) {
      options.of = (options.type.length > 0 && options.type[ 0 ] !== undefined) ? options.type[ 0 ] : String;
      options.type = Array;
    }

    // Map the primary key for mongoose
    if (!!options.primaryKey) {
      if (name !== 'id') {
        throw new Error([ 'You cannot have a primaryKey that is not called id with the ODM module.' ]);
      }

      Klass.aliases.push({
        fieldName: 'id',
        columnName: '_id'
      });

      if (!Klass.primaryKey) {
        Klass.primaryKey = name;
        Klass.primaryKeys.push(name);
        Klass.singlePrimaryKey = true;
      } else {
        Klass.singlePrimaryKey = false;
      }

      mongooseConf.id = true;
      mongooseConf._id = true;

      fieldDefinition.type = mongoose.Schema.Types.ObjectId;
      Klass.fields[name].columnName = '_id';
    } else {
      fieldDefinition.type = this.getFieldType(Klass, options, name);
    }

    if (options.columnName) {
      columnName      = options.columnName;
      options.field   = columnName;
    } else if (!!Klass.underscored && inflect.underscore(name).split('_').length > 1) {
      columnName      = inflect.underscore(name);
      options.field   = columnName;
    }

    // Handle options
    [ 'unique', 'default', 'lowercase', 'trim', 'uppercase' ].forEach(function(optionName) {
      if (options[ optionName ] !== undefined) {
        fieldDefinition[ optionName ] = options[ optionName ];
      }
    });

    if (typeof fieldDefinition.type === 'object' && fieldDefinition.type.type) {
      fieldDefinition.ref     = fieldDefinition.type.ref;
      fieldDefinition.type    = fieldDefinition.type.type;
    }

    fields[columnName] = fieldDefinition;
  },

  getFieldType: function(Klass, options, name) {
    var field;

    switch(options.type) {

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
      field = options.of ? [ this.getFieldType(Klass, options.of) ] : [ String ];
      break;
    case Model.Types.ENUM:
      throw new Error('ENUM is not supported for ODM (yet)');
    case Model.Types.BIGINT:
    case Model.Types.FLOAT:
    case Model.Types.DECIMAL:
      field = Number;
      break;
    case Model.Types.TEXT:
      field = String;
      break;
    case undefined:
      throw new Error([ 'You must define the type of field that', '"' + name + '"', 'is on the', '"' + Klass.modelName + '" model' ].join(' '));
    default:
      throw new Error([ 'You must define a valid type for the field named', '"' + name + '"', 'on the', '"' + Klass.modelName + '" model' ].join(' '));
    }

    return field;
  },

  preShutdown: function() {
    this.debug('Closing database connection...');
    mongoose.disconnect();
  }
});
