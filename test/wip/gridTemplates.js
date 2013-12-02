var assert = require('assert');
var grib = require('../index');

describe('grid template', function() {
  var msgs = null;

  describe('of gfs.grb', function() {
    before(function(done) {
      msgs = null;
      grib.readFile('samples/gfs.grb', function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });

    it('should be lat/lng', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.templateNumber, 0);
          assert.ok(field.grid.definition.earthShape);
        }
      }
    });

    it('should start at lat/lng = 0/90', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.definition.la1, 90);
          assert.strictEqual(field.grid.definition.lo1, 0);
        }
      }
    });
  });

  describe('of dspr.temp.bin', function() {
    before(function(done) {
      msgs = null;
      grib.readFile('samples/dspr.temp.bin', function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });

    it('should be mercator', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.templateNumber, 10);
        }
      }
    });

    it('should have 75936 points', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.definition.ni * field.grid.definition.nj, 75936);
        }
      }
    });
  });

  describe('of ngm.grb', function() {
    before(function(done) {
      msgs = null;
      grib.readFile('samples/ngm.grb', function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });

    it('should be polar stereographic', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.templateNumber, 20);
        }
      }
    });

    it('should have 2385 points', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.definition.nx * field.grid.definition.ny, 2385);
        }
      }
    });
  });

  describe('of ds.maxt.bin', function() {
    before(function(done) {
      msgs = null;
      grib.readFile('samples/ds.maxt.bin', function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });

    it('should be Lambert conformal', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.templateNumber, 30);
        }
      }
    });

    it('should have 739297 points', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.definition.nx * field.grid.definition.ny, 739297);
        }
      }
    });
  });

  describe('of ecmwf_tigge.grb', function() {
    before(function(done) {
      msgs = null;
      grib.readFile('samples/ecmwf_tigge.grb', function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });

    it('should be Gaussian latitude/longitude', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.templateNumber, 40);
        }
      }
    });

    // FIXME: grid parsing broken for the moment
    /*
    it('should have 213988 points', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          console.log(field.grid);
          assert.strictEqual(field.grid.definition.ni * field.grid.definition.nj, 213988);
        }
      }
    });
    */
  });

  describe('of eumetsat_precip.grb', function() {
    before(function(done) {
      msgs = null;
      grib.readFile('samples/eumetsat_precip.grb', function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });

    it('should be Space view perspective or orthographic', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.strictEqual(field.grid.templateNumber, 90);
        }
      }
    });

    it('should have 13778944 points in record 1', function() {
      var field = msgs[0].fields[0];
      assert.strictEqual(field.grid.definition.nx * field.grid.definition.ny, 13778944);
    });

    it('should have 5290000 points in record 2', function() {
      var field = msgs[1].fields[0];
      assert.strictEqual(field.grid.definition.nx * field.grid.definition.ny, 5290000);
    });
  });
});
