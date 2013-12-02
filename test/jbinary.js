var assert = require('assert');
var jBinary = require('jbinary');
var files = require('./lib/fixtures').files;

describe('jbinary', function() {
  var typeSet = { 'jBinary.endian': 'littleEndian', 'jBinary.all': 'string' };

  it('should be present', function() {
    assert.ok(jBinary);
  });

  it('should load fixture URLs with correct length', function(done) {
    jBinary.load(files['gfs.grb'].url, typeSet, function(err, data) {
      if(err) return done(err);
      var all = data.readAll();
      assert.strictEqual(all.length, 3867577);
      done();
    });
  });

  it('should load fixture URLs with correct endianness', function(done) {
    jBinary.load(files['gfs.grb'].url, typeSet, function(err, data) {
      if(err) return done(err);
      var magic = data.read('uint32');
      assert.strictEqual(magic, 0x47524942); // 'GRIB'
      done();
    });
  });
});
