var binary = require('binary');
var tables = require('./tables');

var sectionKeys = [
  'indicator', 'identification', 'localUse',
  'grid', 'product', 'representation', 'bitMap',
  'data',
];

// Parser for scale factor / scaled value. See 92.1.12
var scaledValueParser = function(key) { return (function(vars) { this
  .into('_scaledTmp', function() { this.word8bs('scale').word32bs('value'); })
  .tap(function(vars) {
    vars[key] = vars._scaledTmp.value * Math.pow(10, -vars._scaledTmp.scale);
    delete vars._scaledTmp;
  })
  ;
}); }

var basicAngleParser = function(key) { return (function(vars) { this
  .into('_tmp', function() { this.word32bs('basicAngle').word32bs('basicAngleSub'); })
  .tap(function(vars) {
      var basicAngle = ((vars._tmp.basicAngle == 0) || (vars._tmp.basicAngle == 0xffffffff)) ? 1 : vars._tmp.basicAngle;
      var basicAngleSub = ((vars._tmp.basicAngleSub == 0) || (vars._tmp.basicAngleSub == 0xffffffff)) ? 1e6 : vars._tmp.basicAngleSub;
      delete vars._tmp;
      vars[key] = basicAngle / basicAngleSub;
  })
  ;
}); }

// Grid definition parsers keyed by template number
var gridParsers = {
  // Grid Definition Template 3.0: Latitude/longitude (or equidistant cylindrical, or Plate Carree)
  0: function() { this
    .tap(function(vars) { vars.name = 'Latitude/longitude (or equidistant cylindrical, or Plate Carree)'; })
    .word8bs('earthShape')
    .tap(function(vars) { vars.earthShape = tables.lookup(tables.tables.EarthShape, vars.earthShape); })
    .tap(scaledValueParser('sphericalRadius'))
    .tap(scaledValueParser('majorAxis'))
    .tap(scaledValueParser('minorAxis'))
    .word32bs('ni').word32bs('nj')
    .tap(basicAngleParser('basicAngle'))
    .word32bs('la1').word32bs('lo1')
    .word8bs('resolutionAndComponentFlags')
    .word32bs('la2').word32bs('lo2')
    .word32bs('di').word32bs('dj')
    .tap(function(vars) {
      var scale = vars.basicAngle;
      vars.la1 *= scale; vars.lo1 *= scale;
      vars.la2 *= scale; vars.lo2 *= scale;
      vars.di *= scale; vars.dj *= scale;
    })
    .word8bs('scanningMode')
    ;
  },
  // Grid Definition Template 3.10: Mercator 
  10: function() { this
    .tap(function(vars) { vars.name = 'Mercator'; })
    .word8bs('earthShape')
    .tap(function(vars) { vars.earthShape = tables.lookup(tables.tables.EarthShape, vars.earthShape); })
    .tap(scaledValueParser('sphericalRadius'))
    .tap(scaledValueParser('majorAxis'))
    .tap(scaledValueParser('minorAxis'))
    .word32bs('ni').word32bs('nj')
    .word32bs('la1').word32bs('lo1')
    .word8bs('resolutionAndComponentFlags')
    .word32bs('lad')
    .word32bs('la2').word32bs('lo2')
    .word8bs('scanningMode')
    .word32bs('gridOrientation')
    .word32bs('di').word32bs('dj')
    .tap(function(vars) {
      var scale = 1e-6;
      vars.la1 *= scale; vars.lo1 *= scale;
      vars.lad *= scale;
      vars.la2 *= scale; vars.lo2 *= scale;
    })
    ;
  },
  // Grid Definition Template 3.20: Polar stereographic projection
  20: function() { this
    .tap(function(vars) { vars.name = 'Polar stereographic projection'; })
    .word8bs('earthShape')
    .tap(function(vars) { vars.earthShape = tables.lookup(tables.tables.EarthShape, vars.earthShape); })
    .tap(scaledValueParser('sphericalRadius'))
    .tap(scaledValueParser('majorAxis'))
    .tap(scaledValueParser('minorAxis'))
    .word32bs('nx').word32bs('ny')
    .word32bs('la1').word32bs('lo1')
    .word8bs('resolutionAndComponentFlags')
    .word32bs('lad').word32bs('lov')
    .word32bs('dx').word32bs('dy')
    .word8bs('projectionCenter')
    .word8bs('scanningMode')
    .tap(function(vars) {
      var scale = 1e-6;
      vars.la1 *= scale; vars.lo1 *= scale;
      vars.lad *= scale; vars.lov *= scale;
    })
    ;
  },
  // Grid Definition Template 3.30: Lambert conformal 
  30: function() { this
    .tap(function(vars) { vars.name = 'Polar stereographic projection'; })
    .word8bs('earthShape')
    .tap(function(vars) { vars.earthShape = tables.lookup(tables.tables.EarthShape, vars.earthShape); })
    .tap(scaledValueParser('sphericalRadius'))
    .tap(scaledValueParser('majorAxis'))
    .tap(scaledValueParser('minorAxis'))
    .word32bs('nx').word32bs('ny')
    .word32bs('la1').word32bs('lo1')
    .word8bs('resolutionAndComponentFlags')
    .word32bs('lad').word32bs('lov')
    .word32bs('dx').word32bs('dy')
    .word8bs('projectionCenter')
    .word8bs('scanningMode')
    .word32bs('latin1').word32bs('latin2')
    .word32bs('laSouthPole').word32bs('loSouthPole')
    .tap(function(vars) {
      var scale = 1e-6;
      vars.la1 *= scale; vars.lo1 *= scale;
      vars.lad *= scale; vars.lov *= scale;
      //vars.latin1 *= scale; vars.latin1 *= scale;
      //vars.laSouthPole *= scale; vars.loSouthPole *= scale;
    })
    ;
  },
  // Grid Definition Template 3.40: Gaussian latitude/longitude
  40: function() { this
    .tap(function(vars) { vars.name = 'Gaussian latitude/longitude'; })
    .word8bs('earthShape')
    .tap(function(vars) { vars.earthShape = tables.lookup(tables.tables.EarthShape, vars.earthShape); })
    .tap(scaledValueParser('sphericalRadius'))
    .tap(scaledValueParser('majorAxis'))
    .tap(scaledValueParser('minorAxis'))
    .word32bs('ni').word32bs('nj')
    .word32bs('basicAngle')
    .word32bs('la1').word32bs('lo1')
    .word8bs('resolutionAndComponentFlags')
    .word32bs('la2').word32bs('lo2')
    .word32bs('di')
    .word32bs('n')
    .word8bs('scanningMode')
    .tap(function(vars) {
      var basicAngle = ((vars.basicAngle == 0) || (vars.basicAngle == 0xffffffff)) ? 1 : vars.basicAngle;
      var scale = 1e-6/basicAngle;
      vars.la1 *= scale; vars.lo1 *= scale;
      vars.la2 *= scale; vars.lo2 *= scale;
      vars.di *= scale;
    })
    ;
  },
  // Grid Definition Template 3.90: Space view perspective or orthographic 
  // FIXME: implement properly
  90: function() { this
    .tap(function(vars) { vars.name = 'Space view perspective or orthographic'; })
    .word8bs('earthShape')
    .tap(function(vars) { vars.earthShape = tables.lookup(tables.tables.EarthShape, vars.earthShape); })
    .tap(scaledValueParser('sphericalRadius'))
    .tap(scaledValueParser('majorAxis'))
    .tap(scaledValueParser('minorAxis'))
    .word32bs('nx').word32bs('ny')
    .word32bs('basicAngle')
    .word32bs('lap').word32bs('lop')
    .word8bs('resolutionAndComponentFlags')
    .word32bs('dx').word32bs('dy')
    .word32bs('Xp').word32bs('Yp')
    .word8bs('scanningMode')
    .tap(function(vars) {
      var scale = 1e-6;
      vars.lap *= scale; vars.lop *= scale;
    })
    ;
  },
}

// Functions which will parse a specific section number. They are passed a
// buffer and the *total* number of bytes in the section (i.e. including the 5
// bytes of header).
var sectionParsers = {
  1: function(buffer) { return binary.parse(buffer)
    .word16bs('originatingCenter')
    .word16bs('originatingSubCenter')
    .word8bs('masterTablesVersion')
    .word8bs('localTablesVersion')
    .word8bs('referenceTimeSignificance')
    .word16bs('referenceTime.year')
    .word8bs('referenceTime.month')
    .word8bs('referenceTime.day')
    .word8bs('referenceTime.hour')
    .word8bs('referenceTime.minute')
    .word8bs('referenceTime.second')
    .word8bs('productionStatus')
    .word8bs('type')
    .tap(function(vars) {
      // re-cast reference time to a standard JavaScript Date object
      var rt = vars.referenceTime;
      vars.referenceTime = new Date(
        rt.year, rt.month-1, rt.day, rt.hour, rt.minute, rt.second
      );

      // Lookup various tabulated values
      vars.referenceTimeSignificance = tables.lookup(tables.tables.ReferenceTimeSignificance, vars.referenceTimeSignificance);
      vars.productionStatus = tables.lookup(tables.tables.ProductionStatus, vars.productionStatus);
      vars.type = tables.lookup(tables.tables.Type, vars.type);
    });
  },
  3: function(buffer, sectionBytesLength) { return binary.parse(buffer)
    .word8bs('gridDefinitionSource')
    .word32bs('dataPointCount')
    .word8bs('pointCountOctets')
    .word8bs('pointCountInterpretation')
    .word16bs('templateNumber')
    .tap(function(vars) {
      if(vars.templateNumber == 0xffff) { return this.buffer('definition.points', vars.pointCountOctets); }

      var gridParser = gridParsers[vars.templateNumber];

      if(gridParser) {
        this.into('definition', gridParser);
      } else {
        // just record bytes to end of section
        console.warn('Unknown grid template:', vars.templateNumber);
        this.buffer('definition.bytes', sectionBytesLength - 14 - vars.pointCountOctets);
      }

      this.buffer('definition.points', vars.pointCountOctets);
    });
  },
  4: function(buffer) { return binary.parse(buffer)
    .word16bs('coordinateCount')
    .word16bs('templateNumber')
    // FIXME: remaining
  },
  5: function(buffer) { return binary.parse(buffer)
    .word32bs('dataPointCount')
    .word16bs('templateNumber')
    // FIXME: remaining
  },
  6: function(buffer) { return binary.parse(buffer)
    .word8bs('indicator')
    .tap(function(vars) {
      vars.indicator = tables.lookup(tables.tables.BitMapIndicator, vars.indicator);
      // FIXME: remaining
    })
  },
};

var parseSection = function(vars) {
  // Record this section in the state.
  var parserFunc = sectionParsers[vars.sectionNumber],
      section = vars.sectionBytes,
      parser, newRecord;

  // Parse the section or record the raw bytes if there is no parser
  if(parserFunc) {
    section = parserFunc(vars.sectionBytes, vars.sectionByteLength).vars;
  }

  if(vars.sectionNumber === 1) {
    vars.identification = section;
  } else {
    vars.currentRecord[sectionKeys[vars.sectionNumber]] = section;
  }

  // Have we reached section 7, the last section of a repetition?
  if(vars.sectionNumber === 7) {
    vars.records.push(vars.currentRecord);

    // Create a new current record and copy sections 2 and 3 over
    newRecord = { };
    if(vars.currentRecord[sectionKeys[2]]) {
      newRecord[sectionKeys[2]] = vars.currentRecord[sectionKeys[2]];
    }
    if(vars.currentRecord[sectionKeys[3]]) {
      newRecord[sectionKeys[3]] = vars.currentRecord[sectionKeys[3]];
    }
    vars.currentRecord = newRecord;
  }
}

exports.parseBuffer = function(buffer) { return binary.parse(buffer)
  .tap(function(vars) { vars.messages = []; })

  // Keep scanning file for the start of a GRIB message
  .loop(function(endMessages, vars) { this
    .scan('magic', 'GRIB')

    .tap(function(vars) {
      // If we don't find one, end the loop
      if(this.eof()) { return endMessages(); }

      // GRIB indicator (section 0)
      this
      .into('indicator', function(vars) { this
        .buffer('reserved', 2)
        .word8bs('discipline')
        .word8bs('edition')
        .tap(function(vars) { if(vars.edition !== 2) { throw new Error("Unknown Grib edition: " + vars.edition); } })
        .word64bs('byteLength');
      })

      // Initialise state which is kept from one repeated section to the next.
      // This is an array of sections keyed by section number.
      .tap(function(vars) {
        vars.records = [];
        vars.identification = null;
        vars.currentRecord = {};
      })

      // Individual sections
      .loop(function(end, vars) { this
        .word32bs('sectionByteLength')
        .tap(function(vars) {
          // If the section length is 0x37373737, this is actually "7777" and is thus the end of file.
          if(vars.sectionByteLength == 0x37373737) { return end(); }

          // Otherwise, parse remainder of section
          this
          .word8bs('sectionNumber')
          .buffer('sectionBytes', vars.sectionByteLength-5)
          .tap(parseSection);
        })
      })

      // After all the sections have been found, construct a Grib message from
      // the parsed sections.
      .tap(function(vars) {
        vars.messages.push(new Grib2(vars.identification, vars.records));
      });
    })
  })
  .vars.messages;
}

var Grib2 = function(identification, records) {
  // Move fields from identification to this object.
  for(key in identification) { this[key] = identification[key]; }

  this.fields = records;
}
