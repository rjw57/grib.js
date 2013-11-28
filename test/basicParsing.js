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
  'flux.grb': {
    count: 4,
    referenceTime: new Date(2004, 1, 29, 12, 0, 0),
    referenceTimeSignificance: grib.ReferenceTimeSignificance.START_OF_FORECAST,
  },
  'gfs.grb': {
    count: 308,
    referenceTime: new Date(2011, 9, 8, 0, 0, 0),
    referenceTimeSignificance: grib.ReferenceTimeSignificance.START_OF_FORECAST,
  },
  'gfs.t12z.pgrbf120.2p5deg.grib2': { count: 307 },
  'ngm.grb': { count: 5 },
  'reduced_latlon_surface.grib2': { count: 1 },
  'regular_latlon_surface.grib1': null,
  'regular_latlon_surface.grib2': { count: 1 },
  'rotated_ll.grib1': null,
  'safrica.grib2': { count: 75 },
  'spherical_pressure_level.grib1': null,
  'tigge.grb': { count: 10 },
  'tpcprblty.grib2': {
      count: 69,
      referenceTime: new Date(2009, 10, 9, 12, 0, 0),
      referenceTimeSignificance: grib.ReferenceTimeSignificance.ANALYSIS,
  },
}

function makeTest(fileName) {
  var desc = files[fileName];

  if(!desc) { 
    describe('parsing ' + fileName, function() {
      it('should fail', function(done) {
        grib.readFile('samples/' + fileName, function(err, msgs) {
          assert.ok(err);
          done();
        })
      });
    });

    return;
  }

  describe('parsing ' + fileName, function() {
    var msgs;

    beforeEach(function(done) {
      grib.readFile('samples/' + fileName, function(err, msgs_) {
        if(err) { return done(err); }
        msgs = msgs_;
        done();
      });
    });

    if(desc.count) {
      it('should give ' + desc.count + ' record(s)', function(done) {
        assert.strictEqual(msgs.length, desc.count);
        done();
      });
    }

    if(desc.referenceTime) {
      it('should have a reference time of ' + desc.referenceTime.toString(), function(done) {
        for(var idx in msgs) {
          assert.strictEqual(msgs[idx].referenceTime.getTime(), desc.referenceTime.getTime());
        }
        done();
      });
    }

    if(desc.referenceTimeSignificance) {
      it('should have a reference time significance of ' + desc.referenceTimeSignificance.name, function(done) {
        for(var idx in msgs) {
          assert.strictEqual(msgs[idx].referenceTimeSignificance, desc.referenceTimeSignificance);
        }
        done();
      });
    }
  });
}

for(var f in files) {
  makeTest(f);
}
