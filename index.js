var gribParse = require('./lib/parser');

var tables = require('./lib/tables');
for(var tableName in tables.tables) {
  exports[tableName] = tables.tables[tableName];
}

// NODE.js specific
exports.readFile = function(fileName, cb) {
  var fs = require('fs');
  fs.readFile(fileName, function(err, data) {
    if(err) { cb(err); return; }
    exports.readBuffer(data, cb);
  });
}

exports.readBuffer = function(buffer, cb) {
  var parser = gribParse.createParser(), msg, msgs = [];

  // Write the contents of the buffer catching any parse errors
  try {
    parser.write(buffer);
  } catch(e) {
    return cb(e, null);
  }

  // Read all the parsed messages
  while(msg = parser.read()) { msgs.push(msg); }

  // If no messages were parsed throw an error
  if(msgs.length == 0) { return cb(new Error('No GRIB messages could be decoded')); }

  cb(null, msgs);
}

