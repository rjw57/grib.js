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
  ReferenceTimeSignificance: Object.freeze({
    ANALYSIS:           { name: 'Analysis', value: 0 },
    START_OF_FORECAST:  { name: 'Start of Forecast', value: 1 },
    VERIFICATION:       { name: 'Verification time of forecast', value: 2 },
    OBSERVATION:        { name: 'Observations time', value: 3 },
    MISSING:            { name: 'Missing', value: 255 },
  }),

  ProductionStatus: Object.freeze({
    OPERATIONAL:        { name: 'Operational products', value: 0 },
    OPERATIONAL_TEST:   { name: 'Operational test products', value: 1 },
    RESEARCH:           { name: 'Research products', value: 2 },
    REANALYSIS:         { name: 'Re-analysis', value: 3 },
    MISSING:            { name: 'Missing', value: 255 },
  }),

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
}
