var assert = require('assert');
var jBinary = require('jbinary');
var files = require('./lib/fixtures').files;

// A fairly dirty way to determine if this is running under node or in the browser
var underNode = !!(require('fs').readFile);

var makeTests = function(fileName) { return (function() {
  var fileData;
  before(function(done) {
    var url = files[fileName].url;
    console.log('Loading ' + url);
    jBinary.loadData(url, function(err, data) {
      if(err) return done(err);
      fileData = data;
      done();
    });
  });

  it('should load from a URL', function() {
    assert.ok(fileData);
  });

  if(null === fileSpec) {
    // fail to parse
    return;
  }
}); }

for(var fileName in files) {
  var fileSpec = files[fileName];
  describe('fixture ' + fileName, makeTests(fileName));
}
