var tables = require('./tables');
var BinaryDataView = require('./BinaryDataView');

exports.parseDataView = function(dataView) {
  var msgs = [], offset,
      binary = new BinaryDataView(dataView),
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
      sections = [indicator, ...parseSections(binary, indicator)];
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

  rv.reserved = binary.readArray('uint8', 2);
  rv.discipline = binary.read('uint8')
  rv.edition = binary.read('uint8');
  if(rv.edition != 2) { throw new Error('Unknown GRIB edition: ' + rv.edition); }
  rv.byteLength = binary.read('uint64');

  // for display
  rv.number = 0;
  rv.contents = {
    length: rv.byteLength.lo,
    edition: rv.edition,
    discipline: tables.lookup(
      tables.tables.Discipline,
      rv.discipline
    ),
  }

  return rv;
};

// Parse sections until end marker
var parseSections = function(binary, indicator) {
  var rv = [], section;

  // While we're not at a section 8 marker
  while(binary.read('uint32', binary.tell()) != 0x37373737) {
    // Parse a section
    section = parseSection(binary, indicator, rv);
    rv.push(section);
  }

  // Seek past the '7777' marker
  binary.skip(4);

  return rv;
}

// Parse a single section and advance binary to the section's end
var parseSection = function(binary, indicator, sections) {
  var section = {}, startOffset = binary.tell(),
      sectionParseFunc;

  section.byteLength = binary.read('uint32'),
  section.number = binary.read('uint8');

  // Do we have a parse function for this section?
  sectionParseFunc = sectionParsers[section.number];
  if(!sectionParseFunc) {
    // ... no, copy bytes verbatim
    section.contents = binary.readBlob(section.byteLength-5);
  } else {
    // ... yes, make use of it
    if (7 == section.number) {
        section.contents = sectionParseFunc(binary, sections[3]);
    } else {
        section.contents = sectionParseFunc(binary, section.byteLength, indicator);
    }
  }

  // Seek to end of section
  binary.seek(startOffset + section.byteLength);

  return section;
}

var sectionParsers = {
  1: function(binary) {
    var rv = {};
    rv.originatingCenter =tables.lookup(
      tables.tables.Center,
      binary.read('uint16')
    );
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
  4: function(binary, byteLength, indicator) { // product
    var rv = {}
    rv.coordinateValues = binary.read('uint16');
    rv.templateNumber = tables.lookup(
      tables.tables.ProductDefinition,
      binary.read('uint16')
    );

    if (dataProductTemplateParsers[rv.templateNumber.value]) {
      rv.details = dataProductTemplateParsers[rv.templateNumber.value](binary, indicator);
    }
    else
    {
      // unknown.
      rv.data =  binary.readBlob(byteLength-5-4-2);
    }
    return rv;
  },
  5: function(binary, byteLength) { // representation
    var rv = {}
    rv.dataPointCount = binary.read('uint32');
    rv.templateNumber = tables.lookup(
      tables.tables.DataRepresentationTemplateNumber,
      binary.read('uint16'));

    if(dataRepresentationTemplateParsers[rv.templateNumber.value]) {
      rv.details = dataRepresentationTemplateParsers[rv.templateNumber.value](binary);
    }
    else
    {
      // unknown.
      rv.data =  binary.readBlob(byteLength-5-4-2);
    }
    return rv;
  },
  6: function(binary, byteLength, indicator, section5) { // bitMap
    var rv = {};
    rv.indicator = tables.lookup(
      tables.tables.BitMapIndicator,
      binary.read('uint8'));
    if(rv.indicator == 0) {
      // has bitmap data.
      rv.data = "NOT IMPLEMENTED. YOUR DATA IS HERE";
      // will look something like:
      ///rv.data = binary.read(['blob', byteLength-5-1]);

    }
    return rv;
  },
  7: function(binary, section5) { // data
    // Complex packing and spatial differencing
    if (3 == section5.contents.templateNumber.value) {
        // values from section 5
        const mvm = section5.contents.details.missingValueManagementUsed.value
        const R = section5.contents.details.referenceValue
        const DD = 10**section5.contents.details.decimalScaleFactor
        const EE = 2**section5.contents.details.binaryScaleFactor
        const ref_val = R / DD
        const NG = section5.contents.details.numberOfGroupsOfDataValues
        const orderSpatial = section5.contents.details.orderOfSpatialDifferencing.value
        const descriptorSpatial = section5.contents.details.numberOfOctetsExtraDescriptors
        const nb = section5.contents.details.bitsPerValue
        const nbgw = section5.contents.details.numberOfBitsUsedForTheGroupWidths
        const nbsgl = section5.contents.details.numberOfBitsForScaledGroupLengths
        const len_inc = section5.contents.details.lengthIncrementForTheGroupLengths
        const len_last = section5.contents.details.trueLengthOfLastGroup
        const totalNPoints = section5.contents.dataPointCount
        const referenceGroupWidths = section5.contents.details.referenceForGroupWidths
        const referenceGroupLength = section5.contents.details.referenceForGroupLengths

        // [6-ww] 1st values of undifferenced scaled values and minimums
        let gribSigned = 'grib8';
        if (2 == descriptorSpatial) {
          gribSigned = 'grib16'
        }

        const ival1 = binary.read(gribSigned);
        const ival2 = binary.read(gribSigned);
        const minsd = binary.read(gribSigned);

        // [ww +1]-xx Get reference values for groups (X1's)
        let X1 = []
        for (let i = 0; i < NG; i++) {
          X1.push(binary.view.getUnsigned(nb))
        }
        binary.incrByte();

        // [xx +1 ]-yy Get number of bits used to encode each group
        let NB = []
        for (let i = 0; i < NG; i++) {
            NB.push(binary.view.getUnsigned(nbgw))
        }
        for (let i = 0; i < NG; i++) {
          NB[i] += referenceGroupWidths;
        }
        binary.incrByte();

        // [yy +1 ]-zz Get the scaled group lengths using formula
        // Ln = ref + Kn * len_inc, where n = 1-NG,
        // ref = referenceGroupLength, and len_inc = lengthIncrement
        let L = []
        for (let i = 0; i < NG; i++) {
          L.push(binary.view.getUnsigned(nbsgl))
        }
        binary.incrByte();

        let totalL = 0;
        for (let i = 0; i < NG; i++) {
          L[i] = L[i] * len_inc + referenceGroupLength
          totalL += L[i];
        }

        totalL -= L[NG - 1];
        totalL += len_last
        L[NG - 1] = len_last

        if (totalL != totalNPoints) {
          return
        }

        // [zz +1 ]-nn get X2 values and calculate the results Y using formula
        // formula used to create values, Y * 10**D = R + (X1 + X2) * 2**E

        // Y = (R + (X1 + X2) * (2 ** E) ) / (10 ** D)]
        // WHERE:
        // Y = THE VALUE WE ARE UNPACKING
        // R = THE REFERENCE VALUE (FIRST ORDER MINIMA)
        // X1 = THE PACKED VALUE
        // X2 = THE SECOND ORDER MINIMA
        // E = THE BINARY SCALE FACTOR
        // D = THE DECIMAL SCALE FACTOR
        let count = 0;
        let data = [];

        for (let i = 0; i < NG; i++) {
          if (NB[i] != 0) {
            for (let j = 0; j < L[i]; j++) {
              data[count++] = binary.view.getUnsigned(NB[i]) + X1[i];
            }
          } else {
            for (let j = 0; j < L[i]; j++) {
              data[count++] = X1[i];
            }
          }
        } // end for i

        binary.incrByte();

        data[0] = ival1;
        data[1] = ival2;
        let itemp;
        itemp = totalNPoints;
        for (let i = 2; i < itemp; i++) {
          data[i] += minsd;
          data[i] = data[i] + 2 * data[i - 1] - data[i - 2];
        }

        // formula used to create values, Y * 10**D = R + (X1 + X2) * 2**E

        // Y = (R + (X1 + X2) * (2 ** E) ) / (10 ** D)]
        // WHERE:
        // Y = THE VALUE WE ARE UNPACKING
        // R = THE REFERENCE VALUE (FIRST ORDER MINIMA)
        // X1 = THE PACKED VALUE
        // X2 = THE SECOND ORDER MINIMA
        // E = THE BINARY SCALE FACTOR
        // D = THE DECIMAL SCALE FACTOR

        for (let i = 0; i < data.length; i++) {
          data[i] = (R + (data[i] * EE)) / DD;
        }

        return data
    }
  }
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

var dataRepresentationTemplateParsers = {
  // Grid point data - simple packing
  0 : function(binary) {
    var rv = {}
    rv.name = "Grid point data - simple packing";
    rv.referenceValue = binary.read('float32');
    rv.binaryScaleFactor = binary.read('int16');
    rv.decimalScaleFactor = binary.read('int16');
    rv.numberOfBitsUsed = binary.read('uint8');
    rv.originalType = binary.read('uint8');
    return rv;
  },
  // Grid point data - complex packing
  3 : function(binary) {
    var rv = {}
    rv.name = "Grid point data - complex packing and spatial differencing";
    rv.referenceValue = binary.read('float32');
    rv.binaryScaleFactor = binary.read('int16');
    rv.decimalScaleFactor = binary.read('int16');
    rv.bitsPerValue = binary.read('uint8');
    rv.typeOfOriginalField = tables.lookup(
        tables.tables.DataRepresentationFiedValueType,
        binary.read('uint8')
    )
    rv.groupSplittingMethodUsed = tables.lookup(
        tables.tables.DataRepresentationGroupSplitting,
        binary.read('uint8')
    )
    rv.missingValueManagementUsed = tables.lookup(
        tables.tables.DataRepresentationMissingValueManagement,
        binary.read('uint8')
    )
    rv.primaryMissingValueSubstitute = binary.read('uint32')
    rv.secondaryMissingValueSubstitute = binary.read('uint32')
    rv.numberOfGroupsOfDataValues = binary.read('uint32')
    rv.referenceForGroupWidths = binary.read('uint8')
    rv.numberOfBitsUsedForTheGroupWidths = binary.read('uint8')
    rv.referenceForGroupLengths = binary.read('uint32')
    rv.lengthIncrementForTheGroupLengths = binary.read('uint8')
    rv.trueLengthOfLastGroup = binary.read('uint32')
    rv.numberOfBitsForScaledGroupLengths = binary.read('uint8')
    rv.orderOfSpatialDifferencing = tables.lookup(
        tables.tables.DataRepresentationOrder,
        binary.read('uint8')
    )
    rv.numberOfOctetsExtraDescriptors = binary.read('uint8')

    return rv;
  }
}

var dataProductTemplateParsers = {
  // Analysis or forecast at a horizontal level or in
  // a horizontal layer at a point in time
  0 : function(binary, indicator) {
    var rv = {}
    var category = categoryByDiscipline[indicator.contents.discipline.value];
    if (category) {
      rv.category = category(binary);
    }
    else {
      rv.category = { value: binary.read('int8') };
    }
    category = parameterByCategory[indicator.contents.discipline.value];
    if (category) {
      var parameter = category[rv.category.value];
      if (parameter) {
        rv.parameter = parameter(binary)
      }
    }
    if (!rv.hasOwnProperty("parameter")) {
      rv.parameter = { value: binary.read('int8') };
    }
    rv.generatingProcessType = tables.lookup(
      tables.tables.GeneratingProcessType,
      binary.read('uint8')
    )
    rv.backgroundGeneratingProcess = binary.read('uint8')
    rv.generatingProcessIdentified = tables.lookup(
      tables.tables.GeneratingProcessOrModelFromCenter7,
      binary.read('uint8')
    )
    rv.hours = binary.read('uint16')
    rv.minutes = binary.read('uint8')
    rv.timeRange = tables.lookup(
      tables.tables.TimeRange,
      binary.read('uint8')
    )
    rv.forecastTime = binary.read('uint32')
    rv.surfaceType = tables.lookup(
      tables.tables.SurfaceType,
      binary.read('uint8')
    )
    rv.surfaceTypeScale = binary.read('uint8')
    rv.surfaceTypeValue = binary.read('uint32')
    rv.secondSurfaceType = tables.lookup(
      tables.tables.SurfaceType,
      binary.read('uint8')
    )
    rv.secondSurfaceTypeScale = binary.read('uint8')
    rv.secondSurfaceTypeValue = binary.read('uint32')

    return rv;
  }
}

const categoryByDiscipline = {
  0 : (binary) => tables.lookup(
      tables.tables.MeteorologicalProducts,
      binary.read('int8')
  )
}

const parameterByCategory = {
  0 : {
    2 :(binary) => tables.lookup(
      tables.tables.MeteorologicalProductsMomentumParameter,
      binary.read('int8')
    ),
    6 :(binary) => tables.lookup(
      tables.tables.MeteorologicalProductsCloudsCategory,
      binary.read('int8')
    ),
  }
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
    rv.la1 = binary.read('grib32'); rv.lo1 = binary.read('grib32');
    rv.resolutionAndComponentFlags = binary.read('uint8');
    rv.la2 = binary.read('grib32'); rv.lo2 = binary.read('grib32');
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
