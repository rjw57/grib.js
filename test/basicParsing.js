var assert = require('assert');
var grib = require('../index');

// null if file should not be parse-able, otherwise the number of sections
var files = {
  'cl00010000_ecoclimap_rot.grib1': null,
  'CMC_reg_WIND_ISBL_300_ps60km_2010052400_P012.grib': null,
  'ds.maxt.bin': { count: 4 },
  'dspr.temp.bin': { count: 4 },
  'ecmwf_tigge.grb': { count: 25 },
  'eta.grb': { count: 154 },
  'eumetsat_precip.grb': { count: 2 },
  'flux.grb': { count: 4 },
  'gfs.grb': { count: 308 },
  'gfs.t12z.pgrbf120.2p5deg.grib2': { count: 307 },
  'ngm.grb': { count: 5 },
  'reduced_latlon_surface.grib2': { count: 1 },
  'regular_latlon_surface.grib1': null,
  'regular_latlon_surface.grib2': { count: 1 },
  'rotated_ll.grib1': null,
  'safrica.grib2': { count: 75 },
  'spherical_pressure_level.grib1': null,
  'tigge.grb': { count: 10 },
  'tpcprblty.grib2': { count: 69 },
}

function makeTest(fileName) {
  var desc = files[fileName];

  if(!desc) { 
    describe(fileName, function() {
      it('should not parse', function(done) {
        grib.readFile('samples/' + fileName, function(err, msgs) {
          assert.ok(err);
          done();
        })
      });
    });

    return;
  }

  describe(fileName, function() {
    it('should have ' + desc.count + ' record(s)', function(done) {
      grib.readFile('samples/' + fileName, function(err, msgs) {
        if(err) { return done(err); }
        assert.strictEqual(msgs.length, desc.count);
        done();
      });
    });
  });
}

for(var f in files) {
  makeTest(f);
}

/*
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
*/
