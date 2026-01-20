var assert = require('assert');
var files = require('./lib/fixtures').files;
var grib = require('../index');
const loadData = require('../load-data');

var makeTests = function(fileName) { return (function() {
  var fileData, fileSpec = files[fileName];
  var parseErr, msgs, fileData;

  before(function(done) {
    loadData(fileSpec.url, function(err, data) {
      if(err) return done(err);
      fileData = data;
      grib.readData(fileData, function(err, msgs_) {
        parseErr = err; msgs = msgs_;
        if((fileSpec.count !== null) && err) return done(err);
        done();
      });
    });
  });

  it('should load some data', function() {
    assert.ok(fileData);
  });

  if(null === fileSpec.count) {
    it('should fail to parse', function() {
      assert.ok(parseErr);
    });

    return;
  }

  it('should not fail to parse', function(done) {
    done(parseErr);
  });

  if(fileSpec.count) {
    it('should give ' + fileSpec.count + ' record(s)', function(done) {
      assert.strictEqual(msgs.length, fileSpec.count);
      done();
    });
  }

  if(fileSpec.referenceTime) {
    it('should have a reference time of ' + fileSpec.referenceTime.toString(), function(done) {
      for(var idx in msgs) {
        assert.strictEqual(msgs[idx].referenceTime.getTime(), fileSpec.referenceTime.getTime());
      }
      done();
    });
  }

  if(fileSpec.referenceTimeSignificance) {
    it('should have a reference time significance of ' + fileSpec.referenceTimeSignificance.name, function(done) {
      for(var idx in msgs) {
        assert.strictEqual(msgs[idx].referenceTimeSignificance, fileSpec.referenceTimeSignificance);
      }
      done();
    });
  }
}); }

for(var fileName in files) {
  var fileSpec = files[fileName];
  describe('parsing fixture ' + fileName, makeTests(fileName));
}
