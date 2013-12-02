// Work around older JS's w/out freeze()
if(Object.freeze === undefined) { Object.freeze = function(x) { return x; } }

// Attempt to lookup a value in the specified table. If the optional
// throwIfNotFound is truthy throw an error if no match is found otherwise
// return the original value. FIXME: This is needlessly slow!
exports.lookup = function(table, value, throwIfNotFound) {
  for(var k in table) {
    if(table[k].value === value) { return table[k]; }
  }
  return value;
}

exports.tables = {
  // Code Table 1.2
  ReferenceTimeSignificance: Object.freeze({
    ANALYSIS:           { name: 'Analysis', value: 0 },
    START_OF_FORECAST:  { name: 'Start of Forecast', value: 1 },
    VERIFICATION:       { name: 'Verification time of forecast', value: 2 },
    OBSERVATION:        { name: 'Observations time', value: 3 },
    MISSING:            { name: 'Missing', value: 255 },
  }),

  // Code Table 1.3
  ProductionStatus: Object.freeze({
    OPERATIONAL:        { name: 'Operational products', value: 0 },
    OPERATIONAL_TEST:   { name: 'Operational test products', value: 1 },
    RESEARCH:           { name: 'Research products', value: 2 },
    REANALYSIS:         { name: 'Re-analysis', value: 3 },
    MISSING:            { name: 'Missing', value: 255 },
  }),

  // Code Table 1.4
  Type: Object.freeze({
    ANALYSIS:           { name: 'Analysis products', value: 0 },
    FORECAST:           { name: 'Forecast products', value: 1 },
    ANALYSIS_AND_FORECAST:  { name: 'Analysis and forecast products', value: 2 },
    CONTROL:            { name: 'Control forecast products', value: 3 },
    PERTURBED:          { name: 'Perturbed forecast products', value: 4 },
    CONTROL_AND_PERTURBED:  { name: 'Control and perturbed forecast products', value: 5 },
    SATELLITE:          { name: 'Processed satellite observations', value: 6 },
    RADAR:              { name: 'Processed radar observations', value: 7 },
    MISSING:            { name: 'Missing', value: 255 },
  }),

  // Code Table 3.2
  EarthShape: Object.freeze({
    STD_SPHERICAL_1:    { name: 'Earth assumed spherical with radius = 6,367,470.0 m', value: 0 },
    SPHERICAL:          { name: 'Earth assumed spherical with radius specified by data producer', value: 1 },
    IAU_SPHEROID:       { name: 'Earth assumed oblate spheroid with size as determined by IAU in 1965 (major axis = 6,378,160.0 m, minor axis = 6,356,775.0 m, f = 1/297.0)', value: 2 },
    SPHEROID:           { name: 'Earth assumed oblate spheroid with major and minor axes specified by data producer', value: 3 },
    IAG_SPHEROID:       { name: 'Earth assumed oblate spheroid as defined in IAG-GRS80 model (major axis = 6,378,137.0 m, minor axis = 6,356,752.314 m, f = 1/298.257222101)', value: 4 },
    WGS84_SPHEROID:     { name: 'Earth assumed represented by WGS84 (as used by ICAO since 1998)', value: 5 },
    STD_SPHERICAL_2:    { name: 'Earth assumed spherical with radius of 6,371,229.0 m', value: 6 },
    MISSING:            { name: 'Missing', value: 255 },
  }),

  // Code Table 5.1
  OriginalFieldType: Object.freeze({
    FLOAT:              { name: 'Floating point', value: 0 },
    INTEGER:            { name: 'Integer', value: 1 },
    MISSING:            { name: 'Missing', value: 255 },
  }),

  // Code Table 6.0
  BitMapIndicator: Object.freeze({
    SPECIFIED:          { name: 'Use specified bit-map', value: 0 },
    PREVIOUS:           { name: 'Use bit-map defined previously', value: 254 },
    MISSING:            { name: 'Missing', value: 255 },
  }),
}
