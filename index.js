var Dissolve = require('dissolve');

// NODE.js specific
exports.readFile = function(fileName, cb) {
  var fs = require('fs');
  fs.readFile(fileName, function(err, data) {
    if(err) { cb(err); return; }
    exports.readBuffer(data, cb);
  });
}

exports.readBuffer = function(buffer, cb) {
  var parser = createParser_(), msg, msgs = [];

  // Write the contents of the buffer catching any parse errors
  try {
    parser.write(buffer);
  } catch(e) {
    return cb(e, null);
  }

  // Read all the parsed messages
  while(msg = parser.read()) { msgs.push(msg); }
  cb(null, msgs);
}

var createParser_ = function() {
  return Dissolve().loop('messages', function() { this
    // GRIB indicator (section 0)
    .string('magic', 4)
    .tap('indicator', function() {
      if(this.vars.magic != "GRIB") throw new Error("Invalid magic number. Expected 'GRIB'.");

      this
        .buffer('reserved', 2)
        .uint8('discipline')
        .uint8('edition')
        .uint64be('byteLength');
    })

    // Individual sections
    .loop('sections', function(end) { this
      .uint32be('sectionByteLength')
      .tap(function() {
        // If the section length is 0x37373737, this is actually "7777" and is thus the
        // end section
        if(this.vars.sectionByteLength == 0x37373737) {
          return end(true);
        }

        // Otherwise, parse remainder of section
        this
          .uint8('sectionNumber')
          .tap(function() { this.buffer('sectionContents', this.vars.sectionByteLength-5); })
      })
    })

    // Finish off by pushing message and clearing state
    .tap(function() {
      this.push(this.vars);
      this.vars = {};
    });
  });
}
