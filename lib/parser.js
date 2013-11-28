var binary = require('binary');
var tables = require('./tables');

// Functions which will parse a specific section number
var sectionParsers = {
  1: function(buffer) { return binary.parse(buffer)
    .word16bu('originatingCenter')
    .word16bu('originatingSubCenter')
    .word8bu('masterTablesVersion')
    .word8bu('localTablesVersion')
    .word8bu('referenceTimeSignificance')
    .word16bu('referenceTime.year')
    .word8bu('referenceTime.month')
    .word8bu('referenceTime.day')
    .word8bu('referenceTime.hour')
    .word8bu('referenceTime.minute')
    .word8bu('referenceTime.second')
    .word8bu('productionStatus')
    .word8bu('type')
    .tap(function(vars) {
      // re-cast reference time to a standard JavaScript Date object
      var rt = vars.referenceTime;
      vars.referenceTime = new Date(
        rt.year, rt.month-1, rt.day, rt.hour, rt.minute, rt.second
      );

      // Lookup various tabulated values
      vars.referenceTimeSignificance = tables.lookup(tables.tables.ReferenceTimeSignificance, this.vars.referenceTimeSignificance);
      vars.productionStatus = tables.lookup(tables.tables.ProductionStatus, this.vars.productionStatus);
      vars.type = tables.lookup(tables.tables.Type, this.vars.type);
    });
  },
  3: function(buffer) { return binary.parse(buffer)
    .word8bu('gridDefinitionSource')
    .word32bu('dataPointCount')
    .word8bu('rowPointCountOctets')
    .word8bu('rowPointCountInterpretation')
    .word8bu('gridDefinitionTemplateNumber')
  },
};

var parseSection = function(vars) {
  // Record this section in the state.
  var parserFunc = sectionParsers[vars.sectionNumber],
      section = vars.sectionBytes,
      parser, newRecord;

  // Parse the section or record the raw bytes if there is no parser
  if(parserFunc) {
    section = parserFunc(vars.sectionBytes).vars;
  }

  if(vars.sectionNumber === 1) {
    vars.identification = section;
  } else {
    vars.currentRecord[vars.sectionNumber] = section;
  }

  // Have we reached section 7, the last section of a repetition?
  if(vars.sectionNumber === 7) {
    vars.records.push(vars.currentRecord);

    // Create a new current record and copy sections 2 and 3 over
    newRecord = { };
    newRecord[2] = vars.currentRecord[2];
    newRecord[3] = vars.currentRecord[3];
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
        .word8bu('discipline')
        .word8bu('edition')
        .tap(function(vars) { if(vars.edition !== 2) { throw new Error("Unknown Grib edition: " + vars.edition); } })
        .word64bu('byteLength');
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
        .word32bu('sectionByteLength')
        .tap(function(vars) {
          // If the section length is 0x37373737, this is actually "7777" and is thus the end of file.
          if(vars.sectionByteLength == 0x37373737) { return end(); }

          // Otherwise, parse remainder of section
          this
          .word8bu('sectionNumber')
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
  for(var k in identification) { this[k] = identification[k]; }
}
