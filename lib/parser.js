var Dissolve = require('dissolve');
var tables = require('./tables');

// Functions which will parse a specific section number
var sectionParsers = {
  1: function() { return Dissolve()
    .uint16be('originatingCenter')
    .uint16be('originatingSubCenter')
    .uint8('masterTablesVersion')
    .uint8('localTablesVersion')
    .uint8('referenceTimeSignificance')
    .tap('referenceTime', function() { this
      .uint16be('year')
      .uint8('month')
      .uint8('day')
      .uint8('hour')
      .uint8('minute')
      .uint8('second');
    })
    .uint8('productionStatus')
    .uint8('type')
    .tap(function() {
      // re-cast reference time to a standard JavaScript Date object
      var rt = this.vars.referenceTime;
      this.vars.referenceTime = new Date(
        rt.year, rt.month-1, rt.day, rt.hour, rt.minute, rt.second
      );

      // Lookup various tabulated values
      this.vars.referenceTimeSignificance = tables.lookup(
        tables.tables.ReferenceTimeSignificance, this.vars.referenceTimeSignificance
      );
      this.push(this.vars);
    });
  },
  3: function() { return Dissolve()
    .uint8('gridDefinitionSource')
    .uint32be('dataPointCount')
    .uint8('rowPointCountOctets')
    .uint8('rowPointCountInterpretation')
    .uint8('gridDefinitionTemplateNumber')
    .tap(function() { this.push(this.vars); });
  },
};

exports.createParser = function() { return Dissolve()
  .loop('messages', function(endMessages) { this
    // GRIB indicator (section 0)
    .string('magic', 4)
    .tap('indicator', function() {
      // Check for magic number
      if(this.vars.magic != "GRIB") { throw new Error('Invalid magic number.'); }

      this
        .buffer('reserved', 2)
        .uint8('discipline')
        .uint8('edition')
        .tap(function() {
          if(this.vars.edition !== 2) {
            throw new Error("Unknown Grib edition: " + this.vars.edition);
          }
        })
        .uint64be('byteLength');
    })

    // Initialise state which is kept from one repeated section to the next.
    // This is an array of sections keyed by section number.
    .tap(function() {
      this.vars.records = [];
      this.vars.currentRecord = {};
      this.vars.state = {
        lastSeenSectionNumber: null
      };
    })

    // Individual sections
    .loop('sections', function(end) { this
      .uint32be('sectionByteLength')
      .tap(function() {
        // If the section length is 0x37373737 *and* the previous section was
        // 7, this is actually "7777" and is thus the end of file.
        if((this.vars.sectionByteLength == 0x37373737) && (this.vars.state.lastSeenSectionNumber == 7)) {
          return end(true);
        }

        // Otherwise, parse remainder of section
        this
        .uint8('sectionNumber')
        .tap(function() { this.vars.state.lastSeenSectionNumber = this.vars.sectionNumber; })
        .buffer('sectionBytes', this.vars.sectionByteLength-5)
        .tap(function() {
          // Record this section in the state.
          var parserFunc = sectionParsers[this.vars.sectionNumber],
              section = this.vars.sectionBytes,
              parser, newRecord;

          // Parse the section or record the raw bytes if there is no parser
          if(parserFunc) {
            parser = parserFunc(this.vars.sectionByteLength-5);
            parser.write(this.vars.sectionBytes);
            section = parser.read();
          }

          this.vars.currentRecord[this.vars.sectionNumber] = section;

          // Have we reached section 7, the last section of a repetition?
          if(this.vars.sectionNumber === 7) {
            this.vars.records.push(this.vars.currentRecord);

            // Create a new current record and copy sections 2 and 3 over
            newRecord = { };
            newRecord[2] = this.vars.currentRecord[2];
            newRecord[3] = this.vars.currentRecord[3];
            this.vars.currentRecord = newRecord;
          }
        });
      })
    })

    // Finish off by pushing message and clearing state
    .tap(function() {
      this.push(new Grib2(this.vars.records));
    });
  })
}

var Grib2 = function(records) {
  // Move fields from identification to this object. N.B. all identification
  // sections of all records are identical.
  for(var k in records[0][1]) { this[k] = records[0][1][k]; }
}
