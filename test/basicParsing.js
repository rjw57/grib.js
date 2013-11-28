var assert = require('assert');
var grib = require('../index');

describe('safrica.grib2', function() {
  var msgs;

  // Read in file before each test (to guard against modification)
  beforeEach(function(done) {
    grib.readFile('samples/safrica.grib2', function(err, msgs_) {
      if(err) return done(err);
      msgs = msgs_;
      done();
    });
  });

  it('should have 75 records', function() {
    assert.strictEqual(msgs.length, 75);
  });
});

describe('reduced_latlon_surface.grib2', function() {
  var msgs;

  // Read in file before each test (to guard against modification)
  beforeEach(function(done) {
    grib.readFile('samples/reduced_latlon_surface.grib2', function(err, msgs_) {
      if(err) return done(err);
      msgs = msgs_;
      done();
    });
  });

  it('should have 1 record', function() {
    assert.strictEqual(msgs.length, 1);
  });
});

describe('tpcprblty.grib2', function() {
  var msgs;

  // Read in file before each test (to guard against modification)
  beforeEach(function(done) {
    grib.readFile('samples/tpcprblty.grib2', function(err, msgs_) {
      if(err) return done(err);
      msgs = msgs_;
      done();
    });
  });

  it('should have 69 records', function() {
    assert.strictEqual(msgs.length, 69);
  });

  it('should have Analysis records for 2009-11-09 12:00:00', function() {
    for(var m_idx in msgs) {
      var msg = msgs[m_idx];
      assert.strictEqual(msg.referenceTime.value, new Date(2009, 10, 09, 12, 00, 00).value);
      assert.strictEqual(msg.referenceTimeSignificance, grib.ReferenceTimeSignificance.ANALYSIS);
    }
  });
});

describe('flux.grb', function() {
  var msgs;

  // Read in file before each test (to guard against modification)
  beforeEach(function(done) {
    grib.readFile('samples/flux.grb', function(err, msgs_) {
      if(err) return done(err);
      msgs = msgs_;
      done();
    });
  });

  it('should have 4 records', function() {
    assert.strictEqual(msgs.length, 4);
  });

  it('should have Start of Forecast records for 2004-02-29 12:00:00', function() {
    for(var m_idx in msgs) {
      var msg = msgs[m_idx];
      assert.strictEqual(msg.referenceTime.value, new Date(2004, 02, 29, 12, 00, 00).value);
      assert.strictEqual(msg.referenceTimeSignificance, grib.ReferenceTimeSignificance.START_OF_FORECAST);
    }
  });
});
