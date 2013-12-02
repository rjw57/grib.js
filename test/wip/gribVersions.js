var assert = require('assert');
var grib = require('../index');

describe('A Grib1 file', function() {
  // Read in file before each test (to guard against modification)
  it('should fail to parse', function(done) {
    grib.readFile('samples/spherical_pressure_level.grib1', function(err, msgs_) {
      assert.ok(err);
      done();
    });
  });
});
