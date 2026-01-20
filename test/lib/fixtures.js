var grib = require('../../index');

// A fairly dirty way to determine if this is running under node or in the browser
var underNode = !!(require('fs').readFile);

// count is null if file should not be parse-able, otherwise the number of sections
exports.files = {
  'cl00010000_ecoclimap_rot.grib1': { count: null },
  'CMC_reg_WIND_ISBL_300_ps60km_2010052400_P012.grib': { count: null },
  'ds.maxt.bin': { count: 4 },
  'dspr.temp.bin': { count: 4 },
  'ecmwf_tigge.grb': { count: 25 },
  'eta.grb': { count: 154 },
  'eumetsat_precip.grb': { count: 2 },
  'flux.grb': {
    count: 4,
    referenceTime: new Date(2004, 1, 29, 12, 0, 0),
    referenceTimeSignificance: grib.ReferenceTimeSignificance.START_OF_FORECAST,
  },
  'gfs.grb': {
    count: 308,
    referenceTime: new Date(2011, 9, 8, 0, 0, 0),
    referenceTimeSignificance: grib.ReferenceTimeSignificance.START_OF_FORECAST,
  },
  'gfs.t12z.pgrbf120.2p5deg.grib2': { count: 307 },
  'gfs.t12z.pgrb2.1p00.f000':  {
    count: 2,
    referenceTime: new Date(2023, 5, 1, 12, 0, 0),
    referenceTimeSignificance: grib.ReferenceTimeSignificance.START_OF_FORECAST,
  },
  'ngm.grb': { count: 5 },
  'reduced_latlon_surface.grib2': { count: 1 },
  'regular_latlon_surface.grib1': { count: null },
  'regular_latlon_surface.grib2': { count: 1 },
  'rotated_ll.grib1': { count: null },
  'safrica.grib2': { count: 75 },
  'spherical_pressure_level.grib1': { count: null },
  'tigge.grb': { count: 10 },
  'tpcprblty.grib2': {
      count: 69,
      referenceTime: new Date(2009, 10, 9, 12, 0, 0),
      referenceTimeSignificance: grib.ReferenceTimeSignificance.ANALYSIS,
  },
};

// Set URL appropriately for fileName
for(var fileName in exports.files) {
  exports.files[fileName].url =
    (underNode ? '' : '/base/') + 'samples/' + fileName;
}

