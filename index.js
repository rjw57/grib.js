var gribParse = require('./lib/parser');
var tables = require('./lib/tables');
var jBinary = require('jbinary');

for(var tableName in tables.tables) {
  exports[tableName] = tables.tables[tableName];
}

exports.readData = function(data, cb) {
  var msgs;
  var dataView = new jBinary(data).view;

  // Write the contents of the buffer catching any parse errors
  try {
    msgs = gribParse.parseDataView(dataView);
  } catch(e) {
    return cb(e, null);
  }

  // If no messages were parsed throw an error
  if(msgs.length == 0) { return cb(new Error('No GRIB messages could be decoded')); }

  cb(null, msgs);
}

exports.readUrl = function(url, cb) {
  jBinary.loadData(url, function(err, data) {
    if(err) return cb(err);
    exports.readData(data, cb);
  });
}
