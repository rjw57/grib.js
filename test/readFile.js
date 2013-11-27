var assert = require('assert');
var grib = require('../index');

describe('grib.readFile()', function() {
  it('should throw if no arguments given', function() {
    assert.throws(function() { grib.readFile(); });
  });

  it('should return the contents of a valid grib file', function(done) {
    grib.readFile('samples/safrica.grib2', function(err, msgs) {
      if(err) { done(err); return; }
      assert.ok(msgs.length);
      assert.ok(msgs.length >= 1);
      done();
    });
  });
});
