var assert = require('assert');
var grib = require('../index');
var files = require('./lib/fixtures').files;
const loadData = require('../load-data');

describe('sample file gfs.t12z.pgrb2.1p00.f000', function() {
  var msgs = null;

  beforeEach(function(done) {
    msgs = null;
    loadData(files['gfs.t12z.pgrb2.1p00.f000'].url, function(err, data) {
      if(err) return done(err);
      grib.readData(data, function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });
  });

  it('should have 2 records', function() { assert.strictEqual(msgs.length, 2); });

  it('should have one field per record', function() {
    var msg;
    for(var idx in msgs) {
      msg = msgs[idx];
      assert.ok(msg.fields.length == 1);
    }
  });

  it('should have 65160 points per field', function() {
    var msg;
    for(var idx in msgs) {
      msg = msgs[idx];
      assert.ok(msg.fields[0].data.length == 65160);
    }
  });

  it('should have correct unpacked values', function() {
    var data = [[
        1.9095386,
        1.8295386,
        1.7495385,
        1.6795386,
        1.5995386,
        1.5195385,
        1.4395386,
        1.3595386,
        1.2795386,
        1.1995386,
    ], [
        -4.3582544,
        -4.388254,
        -4.4282546,
        -4.4582543,
        -4.4782543,
        -4.5082545,
        -4.5382543,
        -4.5582542,
        -4.5882545,
        -4.6082544,
    ]];
    for(var idx in msgs) {
      for(var i = 0; i < data[idx].length; i++)
      assert.ok(msgs[idx].fields[0].data[i].toFixed(5) == data[idx][i].toFixed(5));
    }
  });

});
