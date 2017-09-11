#!/usr/bin/env node

'use strict';

const program = require('commander');
const fs = require('fs');
const jBinary = require('jbinary');
const grib = require('./index');

program
.version('0.0.1')
.option('-o, --out [optional]','outfile (else stdout)')
.option('-i, --input <requred>','input file (else stdin)')
.option('-p, --pretty','pretty print output json')
.parse(process.argv); // end with parse to parse through the input


console.log("input: " + program.input);
console.log("out: " + program.out);

jBinary.loadData(program.input, function(err, data) {
  grib.readData(data, function(err, msgs_) {
    if(err) {
        console.error(JSON.stringify(err, null, 4));
        exit(1);
    }

    if(program.out) {
        fs.writeFileSync(program.out, program.pretty ? JSON.stringify(msgs_, null, 4) : JSON.stringify(msgs_) );
    }
    else {
        console.log(program.pretty ? JSON.stringify(msgs_, null, 4) : JSON.stringify(msgs_));
    }
  });
});