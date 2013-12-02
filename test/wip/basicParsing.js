var assert = require('assert');
var grib = require('../index');
var files = require('./lib/fixtures').files;

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
