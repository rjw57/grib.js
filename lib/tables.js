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
}
