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

// Get a big endian 16-bit integer from the specified dataview
var getUint16 = function(dv, offset) {
  return dv.getUint16(offset, false);
}

// Get a big endian 32-bit integer from the specified dataview
var getUint32 = function(dv, offset) {
  return dv.getUint32(offset, false);
}

// Get a big endian 64-bit integer from the specified dataview
var getUint64 = function(dv, offset) {
  return (dv.getUint32(offset, false) * (1<<32)) + dv.getUint32(offset+4, false);
}

exports.Grib2 = function(buffer) {
  var octetOffset = 0;
  var buffer = new Uint8Array(buffer).buffer;

  this.indicator = this.readIndicator(new DataView(buffer, octetOffset));
  octetOffset += this.indicator.length;

  this.identification = this.readSection(new DataView(buffer, octetOffset));
  octetOffset += this.identification.length;
  if(this.identification.number != 1) { throw "Expected identification section"; }

  var currentGriddedData = { };
  this.grids = [];
  while(true) {
    dv = new DataView(buffer, octetOffset);
    if(isEndSection(dv)) { break; }

    section = this.readSection(dv);
    octetOffset += section.length;
    
    switch(section.number) {
      case 2: // Local-use
        currentGriddedData.local = section;
        break;
      case 3: // Grid
        currentGriddedData.grid = section;
        break;
      case 4: // Product
        currentGriddedData.product = section;
        break;
      case 5: // Data Representation
        currentGriddedData.representation = section;
        break;
      case 6: // Bit-map
        currentGriddedData.bitmap = section;
        break;
      case 7: // Data
        currentGriddedData.data = section;
        this.grids.push(new Grid(currentGriddedData));
        currentGriddedData = shallowClone(currentGriddedData);
        break;
    }
  }
}

exports.Grib2.prototype.readIndicator = function(dv) {
  if(String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) != 'GRIB') {
    throw "Indicator of GRIB file does not start with 'GRIB'.";
  }

  return { 
    length: 16,
    number: 0,
    contents: {
      discipline: dv.getUint8(6), edition: dv.getUint8(7), fileLength: getUint64(dv, 8),
    }
  };
}

exports.Grib2.prototype.readSection = function(dv) {
  var section = {
    length: getUint32(dv, 0),
    number: dv.getUint8(4),
  };

  switch(section.number) {
    case 1:
      // Identification
      section.content = readIdentification(dv);
      break;
    case 2:
      // Local section use (just copy through the dataview)
      section.content = dv;
      break;
    case 3:
      // Grid definition
      section.content = readGrid(dv);
      break;
    case 4:
      // Product definition
      break;
    case 5:
      // Data representation
      break;
    case 6:
      // Bit-map
      break;
    case 7:
      // Data
      break;
    default:
      throw "Invalid section: " + section.number;
  }

  return section;
}

var readIdentification = function(dv) {
  return {
    originatingCenter: getUint16(dv, 5),
    originatingSubCenter: getUint16(dv, 7),
    masterTablesVersion: dv.getUint8(9),
    localTablesVersion: dv.getUint8(10),
    referenceTimeSignificance: dv.getUint8(11),
    referenceTime: new Date(Date.UTC(getUint16(dv, 12), dv.getUint8(14)-1, dv.getUint8(15), dv.getUint8(16), dv.getUint8(17), dv.getUint8(18), 0)),
    productionStatus: dv.getUint8(19),
    type: dv.getUint8(20),
  };
}

var readGrid = function(dv) {
  return {
    source: dv.getUint8(5),
    dataPointCount: getUint32(dv, 6),
  };
}

var isEndSection = function(dv) {
  return (dv.byteLength >= 4) && (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) == '7777');
}

var shallowClone = function(obj) {
  var rv = {};
  for(var k in obj) { rv[k] = obj[k]; }
  return rv;
}

var Grid = function(definition) {
  for(var k in definition) { this[k] = definition[k]; }
}
