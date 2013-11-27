var assert = require('assert');
var fs = require('fs');

var grib = require('../grib');

var tpcprblty_grib2 = null;

// Load some sample data into a buffer
beforeEach(function(done) {
  fs.readFile('samples/tpcprblty.grib2', function(err, data) {
    tpcprblty_grib2 = data;
    done(err);
  });
});

describe('grib.readBuffer()', function() {
  it('should return throw when no buffer given', function() {
    assert.throws(function() { grib.readBuffer(); });
  });

  it('should return an array of messages with a valid buffer', function(done) {
    grib.readBuffer(tpcprblty_grib2, function(err, msgs) {
      if(err) { done(err); return; }
      assert.ok(msgs.length >= 1);
      assert.ok(msgs[0]);
      done();
    });
  });

  it('should throw an error with an invalid buffer', function(done) {
    grib.readBuffer(new Buffer("one, two, three"), function(err, msgs) {
      assert.ok(err);
      done();
    });
  });
});
