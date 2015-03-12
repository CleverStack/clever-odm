var path        = require('path')
  , injector    = require('injector')
  , Model       = injector.getInstance('Model')
  , underscore  = require('underscore')
  , expect      = require( 'chai' ).expect
  , odmModel    = path.resolve(path.join(__dirname, '..', 'assets', 'OdmModel.js'))
  , odmModel    = require(odmModel)
  , OdmModel;

describe('Object Document Mapper: (ODM)', function() {
  before(function(done) {
    injector.inject(odmModel, function(_OdmModel) {
      OdmModel = _OdmModel;
      injector.instance('OdmModel', OdmModel);
      
      done();
      // run a sync
      // injector
      //   .getInstance('sequelize')
      //   .sync({force:true})
      //   .then(function() {
      //     done();
      //   })
      //   .catch(done);
    });
  });

  describe('Extending', function() {
    it('Should have defined OdmModel as a Model', function(done) {
      expect(OdmModel.prototype instanceof Model).to.equal(true);

      done();
    });

    it.skip('Should have defined Odms collection in MongoDB');
  });

  describe('Options', function() {
    it.skip('type');
    it.skip('dbName');
    it.skip('engine');
    it.skip('charset');
    it.skip('comment');
    it.skip('collate');
    it.skip('indexes');
    it.skip('createdAt');
    it.skip('updatedAt');
    it.skip('deletedAt');
    it.skip('underscored');
    it.skip('versionable');
    it.skip('freezeDbName');
    it.skip('timeStampable');
    it.skip('softDeleteable');
  });

  describe('Fields', function() {
    describe('Types', function() {
      it('String', function(done) {
        expect(OdmModel.fields).to.have.property('str');
        expect(OdmModel.fields.str).to.eql(String);

        done();
      });

      it('Number', function(done) {
        expect(OdmModel.fields).to.have.property('num');
        expect(OdmModel.fields.num).to.eql(Number);
        
        done();
      });

      it('Boolean', function(done) {
        expect(OdmModel.fields).to.have.property('bool');
        expect(OdmModel.fields.bool).to.eql(Boolean);
        
        done();
      });

      it('Date', function(done) {
        expect(OdmModel.fields).to.have.property('date');
        expect(OdmModel.fields.date).to.eql(Date);
        
        done();
      });

      it('Buffer', function(done) {
        expect(OdmModel.fields).to.have.property('buf');
        expect(OdmModel.fields.buf).to.eql(Buffer);

        done();
      });
      
      it.skip('Types.ENUM');
      it.skip('Types.TINYINT');

      // it.skip('Should have Enum (defined by object notation) field');

      describe('BIGINT', function() {
        it('Should have bigint field', function(done) {
          expect(OdmModel.fields).to.have.property('bigint');
          expect(OdmModel.fields.bigint.toString()).to.equal('BIGINT');

          done();
        });

        it('Should have bigint with length field', function(done) {
          expect(OdmModel.fields).to.have.property('bigintLen');
          expect(OdmModel.fields.bigintLen).to.have.property('length');
          expect(OdmModel.fields.bigintLen.length).to.equal(11);
          expect(OdmModel.fields.bigintLen.type.toString()).to.equal('BIGINT');

          done();
        });
      });

      it.skip('Types.FLOAT');
      it.skip('Types.DECIMAL');
      it.skip('Types.TEXT');
    });
  });

  describe('Behaviours', function() {
    it.skip('softDeleteable');
    it.skip('timeStampable');
    it.skip('versionable');
  });

  describe('Methods', function() {
    describe('create()', function() {
      it('Should be able to create a new (basic) model instance', function(done) {
        var entity = {
          str             : 'String',
          bool            : true,
          date            : new Date(),
          buf             : new Buffer('foobar'),
          bigint          : 1000000001,
          bigintLen       : 1000000001,
          float           : 10.1,
          floatLen        : 100000000.1,
          floatLenAndDec  : 1.12345678911,
          dec             : 10,
          decPrec         : 10,
          decPrecAndScale : 10,
          text            : 'Text',
          textObj         : 'TextObj'
        };

        OdmModel
          .create(underscore.clone(entity))
          .then(function(model) {
            Object.keys(entity).forEach(function(key) {
              expect(model[ key ]).to.eql(entity[ key ]);
            });
            done();
          })
          .catch(done);
      });
    });
    it.skip('findOrCreate()');
    it.skip('update()');
    it.skip('findAndUpdate()');
    it.skip('destroy()');
    it.skip('findAndDestroy()');

    describe('finders', function() {
      it.skip('find()');
      it.skip('findAll()');
    });
  });

  describe('Associations', function() {
    it.skip('define');

    describe('belongsTo', function() {
      it.skip('define');

      describe('accessors', function() {
        it.skip('createAccessor');
        it.skip('getAccessor');
        it.skip('setAccessor');
      });

      describe('loaders', function() {
        it.skip('eager');
        it.skip('lazy');
      });

      describe('nestedOperations', function() {
        it.skip('beforeCreate');
        it.skip('afterCreate');
        it.skip('beforeUpdate');
        it.skip('afterUpdate');
      });
    });

    describe('hasOne', function() {
      it.skip('define');

      describe('accessors', function() {
        it.skip('createAccessor');
        it.skip('getAccessor');
        it.skip('setAccessor');
      });

      describe('loaders', function() {
        it.skip('eager');
        it.skip('lazy');
      });

      describe('nestedOperations', function() {
        it.skip('beforeCreate');
        it.skip('beforeUpdate');
      });
    });

    describe('hasMany', function() {
      it.skip('define');

      describe('accessors', function() {
        it.skip('createAccessor');
        it.skip('removeAccessor');
        it.skip('getAccessor');
        it.skip('setAccessor');
        it.skip('addAccessor');
      });

      describe('loaders', function() {
        it.skip('eager');
        it.skip('lazy');
      });

      describe('nestedOperations', function() {
        it.skip('afterCreate');
      });
    });
  });
});