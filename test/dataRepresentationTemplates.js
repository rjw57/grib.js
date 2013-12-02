var assert = require('assert');
var grib = require('../index');
var files = require('./lib/fixtures').files;

describe('data representation template', function() {
  var msgs = null;

  describe('of ngm.grb', function() {
    before(function(done) {
      msgs = null;
      grib.readUrl(files['ngm.grb'].url, function(err, msgs_) {
        if(err) return done(err);
        msgs = msgs_;
        done();
      });
    });

    it('should be template 0', function() {
      var msg, field;
      for(var m_idx in msgs) {
        msg = msgs[m_idx];
        for(var f_idx in msg.fields) {
          field = msg.fields[f_idx];
          assert.ok(field.representation.representation);
          assert.strictEqual(0, field.representation.representation.templateNumber);
        }
      }
    });
  });
});
