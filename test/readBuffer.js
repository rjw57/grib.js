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
  it('should return null when no buffer given', function() {
    assert.strictEqual(null, grib.readBuffer());
  });

  it('should return an array of messages with a valid buffer', function() {
    var msgs = grib.readBuffer(tpcprblty_grib2);
    assert.ok(msgs.length >= 1);
    assert.ok(msgs[0]);
  });

  it('should throw an error with an invalid buffer', function() {
    assert.throws(function() { grib.readBuffer("one, two, three"); });
  });
});
