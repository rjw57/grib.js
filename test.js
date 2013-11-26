grib2 = require('./grib2.js');
fs = require('fs');

fs.readFile('CMC_glb_HGT_ISBL_650_latlon.24x.24_2013112500_P000.grib2', function(err, data) {
  if(err) throw err;

  g = new grib2.Grib2(data);
  console.log(g);
  for(s_idx in g.grids) {
    console.log(g.grids[s_idx]);
  }
});
