var tables = require('./tables');
var jBinary = require('jbinary');

exports.parseDataView = function(dataView) {
  var msgs = [], offset,
      binary = jBinary(dataView, { 'jBinary.littleEndian': false }),
      indicator, sections;

  // GRIB messages start with 'GRIB'
  for(offset=0; offset <= dataView.byteLength-4; offset++) {
    if(binary.read('uint32', offset) == 0x47524942) {
      // This is the start of a GRIB message, parse the indicator section
      binary.seek(offset);
      indicator = parseIndicator(binary);

      // FIXME: support >4GiB GRIBS
      if(indicator.byteLength.hi !== 0) {
        throw new Error('GRIB messages longer than 4GiB are not yet supported');
      }

      // If we found a message, parse it into sections and add to messages
      sections = parseSections(binary);
      msgs.push(new Grib2Message(sections));

      // Move to last byte of message (the offset++ in the for loop will move us to next one)
      offset += indicator.byteLength.lo - 1;
    }
  }

  return msgs;
}

var sectionKeys = [
  'indicator', 'identification', 'localUse',
  'grid', 'product', 'representation', 'bitMap',
  'data',
];

// An object representing a GRIB message
var Grib2Message = function(sections) {
  var currentField = { }, sectionIdx, section, key;

  this.fields = [];

  for(sectionIdx in sections) {
    section = sections[sectionIdx];

    // Is this the identification?
    if(section.number == 1) {
      // Move fields from identification to this object.
      for(key in section.contents) { this[key] = section.contents[key]; }
    } else {
      // Otherwise, add to the current field
      currentField[sectionKeys[section.number]] = section.contents;
    }

    if(section.number == 7) {
      // This is the data section, the last one in a repeated set
      this.fields.push(new Field(currentField));
    }
  }
}

var Field = function(sections) {
  var key;

  // Move fields from sections to this object
  for(key in sections) { this[key] = sections[key]; }
}

// Parse a GRIB 2 Indicator (0) section
var parseIndicator = function(binary) {
  var rv = {};

  rv.magic = binary.read('uint32');
  if(rv.magic != 0x47524942) { throw new Error('Invalid magic number for indicator: ' + rv.magic); }

  rv.reserved = binary.read(['array', 'uint8', 2]);
  rv.discipline = binary.read('uint8');
  rv.edition = binary.read('uint8');
  if(rv.edition != 2) { throw new Error('Unknown GRIB edition: ' + rv.edition); }
  rv.byteLength = binary.read('uint64');

  return rv;
};

// Parse sections until end marker
var parseSections = function(binary) {
  var rv = [], section;

  // While we're not at a section 8 marker
  while(binary.read('uint32', binary.tell()) != 0x37373737) {
    // Parse a section
    section = parseSection(binary);
    rv.push(section);
  }

  // Seek past the '7777' marker
  binary.skip(4);

  return rv;
}

// Parse a single section and advance binary to the section's end
var parseSection = function(binary) {
  var section = {}, startOffset = binary.tell(),
      sectionParseFunc;

  section.byteLength = binary.read('uint32'),
  section.number = binary.read('uint8');

  // Do we have a parse function for this section?
  sectionParseFunc = sectionParsers[section.number];
  if(!sectionParseFunc) {
    // ... no, copy bytes verbatim
    section.contents = binary.read(['blob', section.byteLength-5]);
  } else {
    // ... yes, make use of it
    section.contents = sectionParseFunc(binary, section.byteLength);
  }

  // Seek to end of section
  binary.seek(startOffset + section.byteLength);

  return section;
}

var sectionParsers = {
  1: function(binary) {
    var rv = {};
    rv.originatingCenter = binary.read('uint16');
    rv.originatingSubCenter = binary.read('uint16');
    rv.masterTablesVersion = binary.read('uint8');
    rv.localTablesVersion = binary.read('uint8');
    rv.referenceTimeSignificance = tables.lookup(
        tables.tables.ReferenceTimeSignificance,
        binary.read('uint8'));
    rv.referenceTime = new Date(
        binary.read('uint16'), // year
        binary.read('uint8') - 1, // month
        binary.read('uint8'), // day
        binary.read('uint8'), // hour
        binary.read('uint8'), // minute
        binary.read('uint8') // second
    );
    rv.productionStatus = tables.lookup(
        tables.tables.ProductionStatus,
        binary.read('uint8'));
    rv.type = tables.lookup(
        tables.tables.Type,
        binary.read('uint8'));
    return rv;
  },
  3: function(binary) {
    var rv = {};
    rv.source = binary.read('uint8');
    rv.dataPointCount = binary.read('uint32');
    rv.pointCountOctets = binary.read('uint8');
    rv.pointCountInterpretation = binary.read('uint8');
    rv.templateNumber = binary.read('uint16');

    // Parse grid definition
    var gridDefnParser = gridParsers[rv.templateNumber];
    if(!gridDefnParser) {
      console.warn('Unknown grid definiton template: ' + rv.templateNumber);
      return rv;
    }
    rv.definition = gridDefnParser(binary);

    // FIXME: point counts

    return rv;
  },
  5: function(binary) {
    var rv = {};
    rv.dataPointCount = binary.read('uint32');
    rv.templateNumber = binary.read('uint16');
    
    // Parse representation
    var dataReprParser = dataRepresentationParsers[rv.templateNumber];
    if(!dataReprParser) {
      console.warn('Unknown data representation template: ' + rv.templateNumber);
      return rv;
    }
    rv.representation = dataReprParser(binary);
    return rv;
  },
};

// Parser for scale factor / scaled value. See 92.1.12
var parseScaledValue = function(binary) {
  var scale = binary.read('uint8'), value = binary.read('uint32');
  return value * Math.pow(10, -scale);
}

// Parser for basic angle
var parseBasicAngle = function(binary) {
  var basicAngle = binary.read('uint32'), basicAngleSub = binary.read('uint32');
  
  basicAngle = ((basicAngle == 0) || (basicAngle == 0xffffffff)) ? 1 : basicAngle;
  basicAngleSub = ((basicAngleSub == 0) || (basicAngleSub == 0xffffffff)) ? 1e6 : basicAngleSub;

  return basicAngle / basicAngleSub;
}

var gridParsers = {
  // Grid Definition Template 3.0: Latitude/longitude (or equidistant cylindrical, or Plate Carree)
  0: function(binary) { var rv = {}
    rv.name = 'Latitude/longitude (or equidistant cylindrical, or Plate Carree)';
    rv.earthShape = tables.lookup(tables.tables.EarthShape, binary.read('uint8'));
    rv.sphericalRadius = parseScaledValue(binary);
    rv.majorAxis = parseScaledValue(binary);
    rv.minorAxis = parseScaledValue(binary);
    rv.ni = binary.read('uint32'); rv.nj = binary.read('uint32');
    rv.basicAngle = parseBasicAngle(binary);
    rv.la1 = binary.read('int32'); rv.lo1 = binary.read('int32');
    rv.resolutionAndComponentFlags = binary.read('uint8');
    rv.la2 = binary.read('int32'); rv.lo2 = binary.read('int32');
    rv.di = binary.read('int32'); rv.dj = binary.read('int32');
    rv.scanningMode = binary.read('uint8');

    var scale = rv.basicAngle;
    rv.la1 *= scale; rv.lo1 *= scale;
    rv.la2 *= scale; rv.lo2 *= scale;
    rv.di *= scale; rv.dj *= scale;

    return rv;
  },
  // Grid Definition Template 3.10: Mercator 
  10: function(binary) { var rv={};
    rv.name = 'Mercator';
    rv.earthShape = tables.lookup(tables.tables.EarthShape, binary.read('uint8'));
    rv.sphericalRadius = parseScaledValue(binary);
    rv.majorAxis = parseScaledValue(binary);
    rv.minorAxis = parseScaledValue(binary);
    rv.ni = binary.read('uint32'); rv.nj = binary.read('int32');
    rv.la1 = binary.read('int32'); rv.lo1 = binary.read('int32');
    rv.resolutionAndComponentFlags = binary.read('uint8');
    rv.lad = binary.read('int32');
    rv.la2 = binary.read('int32'); rv.lo2 = binary.read('int32');
    rv.scanningMode = binary.read('uint8');
    rv.gridOrientation = binary.read('uint32');
    rv.di = binary.read('int32'); rv.dj = binary.read('int32');

    var scale = 1e-6;
    rv.la1 *= scale; rv.lo1 *= scale;
    rv.lad *= scale;
    rv.la2 *= scale; rv.lo2 *= scale;
    return rv;
  },
  // Grid Definition Template 3.20: Polar stereographic projection
  20: function(binary) { var rv={};
    rv.name = 'Polar stereographic projection';
    rv.earthShape = tables.lookup(tables.tables.EarthShape, binary.read('uint8'));
    rv.sphericalRadius = parseScaledValue(binary);
    rv.majorAxis = parseScaledValue(binary);
    rv.minorAxis = parseScaledValue(binary);
    rv.nx = binary.read('uint32'); rv.ny = binary.read('uint32');
    rv.la1 = binary.read('int32'); rv.lo1 = binary.read('int32');
    rv.resolutionAndComponentFlags = binary.read('uint8');
    rv.lad = binary.read('int32'); rv.lov = binary.read('int32');
    rv.dx = binary.read('int32'); rv.dy = binary.read('int32');
    rv.projectionCenter = binary.read('uint8');
    rv.scanningMode = binary.read('uint8');
    var scale = 1e-6;
    rv.la1 *= scale; rv.lo1 *= scale;
    rv.lad *= scale; rv.lov *= scale;
    return rv;
  },
  // Grid Definition Template 3.30: Lambert conformal 
  30: function(binary) { var rv={};
    rv.name = 'Polar stereographic projection';
    rv.earthShape = tables.lookup(tables.tables.EarthShape, binary.read('uint8'));
    rv.sphericalRadius = parseScaledValue(binary);
    rv.majorAxis = parseScaledValue(binary);
    rv.minorAxis = parseScaledValue(binary);
    rv.nx = binary.read('uint32'); rv.ny = binary.read('uint32');
    rv.la1 = binary.read('int32'); rv.lo1 = binary.read('int32');
    rv.resolutionAndComponentFlags = binary.read('uint8');
    rv.lad = binary.read('int32'); rv.lov = binary.read('int32');
    rv.dx = binary.read('int32'); rv.dy = binary.read('int32');
    rv.projectionCenter = binary.read('uint8');
    rv.scanningMode = binary.read('uint8');
    rv.latin1 = binary.read('uint32');rv.latin2 = binary.read('uint32');
    rv.laSouthPole = binary.read('uint32');rv.loSouthPole = binary.read('uint32');
    var scale = 1e-6;
    rv.la1 *= scale; rv.lo1 *= scale;
    rv.lad *= scale; rv.lov *= scale;
    //rv.latin1 *= scale; rv.latin1 *= scale;
    //rv.laSouthPole *= scale; rv.loSouthPole *= scale;
    return rv;
  },
  // Grid Definition Template 3.40: Gaussian latitude/longitude
  40: function(binary) { var rv={};
    rv.name = 'Gaussian latitude/longitude';
    rv.earthShape = tables.lookup(tables.tables.EarthShape, binary.read('uint8'));
    rv.sphericalRadius = parseScaledValue(binary);
    rv.majorAxis = parseScaledValue(binary);
    rv.minorAxis = parseScaledValue(binary);
    rv.earthShape = binary.read('uint8');
    rv.ni = binary.read('uint32');rv.nj = binary.read('uint32');
    rv.basicAngle = binary.read('uint32');
    rv.la1 = binary.read('int32');rv.lo1 = binary.read('int32');
    rv.resolutionAndComponentFlags = binary.read('uint8');
    rv.la2 = binary.read('int32');rv.lo2 = binary.read('int32');
    rv.di = binary.read('int32');
    rv.n = binary.read('uint32');
    rv.scanningMode = binary.read('uint8');
    var basicAngle = ((rv.basicAngle == 0) || (rv.basicAngle == 0xffffffff)) ? 1 : rv.basicAngle;
    var scale = 1e-6/basicAngle;
    rv.la1 *= scale; rv.lo1 *= scale;
    rv.la2 *= scale; rv.lo2 *= scale;
    rv.di *= scale;
    return rv;
  },
  // Grid Definition Template 3.90: Space view perspective or orthographic 
  // FIXME: implement properly
  90: function(binary) { var rv={};
    rv.name = 'Space view perspective or orthographic';
    rv.earthShape = tables.lookup(tables.tables.EarthShape, binary.read('uint8'));
    rv.sphericalRadius = parseScaledValue(binary);
    rv.majorAxis = parseScaledValue(binary);
    rv.minorAxis = parseScaledValue(binary);
    rv.nx = binary.read('uint32');rv.ny = binary.read('uint32');
    rv.basicAngle = binary.read('uint32');
    rv.lap = binary.read('int32');rv.lop = binary.read('int32');
    rv.resolutionAndComponentFlags = binary.read('uint8');
    rv.dx = binary.read('uint32');rv.dy = binary.read('uint32');
    rv.Xp = binary.read('uint32');rv.Yp = binary.read('uint32');
    rv.scanningMode = binary.read('uint8');
    var scale = 1e-6;
    rv.lap *= scale; rv.lop *= scale;
    return rv;
  },
};

var dataRepresentationParsers = {
  // Grid point data - simple packing
  0: function(binary) {
    var rv = {};
    rv.name = 'Grid point data - simple packing';
    rv.referenceValue = binary.read('float32');
    rv.binaryScale = binary.read('uint16');
    rv.decimalScale = binary.read('uint16');
    rv.bitCount = binary.read('uint8');
    rv.dataType = tables.lookup(tables.tables.OriginalFieldType, binary.read('uint8'));
    return rv;
  },
};
