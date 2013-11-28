var assert = require('assert');
var grib = require('../index');

describe('sample file gfs.grb', function() {
  var msgs = null;

  beforeEach(function(done) {
    msgs = null;
    grib.readFile('samples/gfs.grb', function(err, msgs_) {
      if(err) return done(err);
      msgs = msgs_;
      done();
    });
  });

  it('should have 308 records', function() { assert.strictEqual(msgs.length, 308); });

  it('should have one or two fields per record', function() {
    var msg
    for(var idx in msgs) {
      msg = msgs[idx];
      assert.ok((msg.fields.length == 1) || (msg.fields.length == 2));
    }
  });
});
