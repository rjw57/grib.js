const gribParse = require('./lib/parser');
const tables = require('./lib/tables');
const loadData = require('./load-data');

for(var tableName in tables.tables) {
  exports[tableName] = tables.tables[tableName];
}

exports.readData = function(data, cb) {
  var msgs;

  // Write the contents of the buffer catching any parse errors
  try {
    msgs = gribParse.parseDataView(data);
  } catch(e) {
    return cb(e, null);
  }

  // If no messages were parsed throw an error
  if(msgs.length == 0) { return cb(new Error('No GRIB messages could be decoded')); }

  cb(null, msgs);
}

exports.readUrl = function(url, cb) {
  loadData(url, function(err, data) {
    if(err) return cb(err);
    exports.readData(data, cb);
  });
}

exports.convertData = function(data) {
    getGridUnits = function(templateNumber) {
        switch (templateNumber) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 40:
            case 41:
            case 42:
            case 43:
                return "degrees";

            case 10:
            case 20:
            case 30:
            case 31:
                return "m";

            default:
                return "";
        }
    }

    const msgs_ = []
    for (var msgs of data) {
        const header = {
            discipline: msgs.fields[0].indicator.discipline.value,
            disciplineName: msgs.fields[0].indicator.discipline.name,
            gribEdition: msgs.fields[0].indicator.edition,
            gribLength: msgs.fields[0].indicator.length,
            center: msgs.originatingCenter.value,
            centerName:	msgs.originatingCenter.name,
            subcenter: msgs.originatingSubCenter,
            refTime: msgs.referenceTime,
            significanceOfRT: msgs.referenceTimeSignificance.value,
            significanceOfRTName: msgs.referenceTimeSignificance.value,
            productStatus: msgs.productionStatus.value,
            productStatusName: msgs.productionStatus.name,
            productType: msgs.type.value,
            productTypeName: msgs.type.name,
            productDefinitionTemplate: msgs.fields[0].product.templateNumber.value,
            productDefinitionTemplateName: msgs.fields[0].product.templateNumber.name,
            parameterCategory: msgs.fields[0].product.details.category.value,
            parameterCategoryName: msgs.fields[0].product.details.category.name,
            parameterNumber: msgs.fields[0].product.details.parameter.value,
            parameterNumberName: msgs.fields[0].product.details.parameter.name,
            parameterUnit: msgs.fields[0].product.details.parameter.unit,
            genProcessType: msgs.fields[0].product.details.generatingProcessType.value,
            genProcessTypeName: msgs.fields[0].product.details.generatingProcessType.name,
            forecastTime: msgs.fields[0].product.details.forecastTime,
            surface1Type: msgs.fields[0].product.details.surfaceType.value,
            surface1TypeName: msgs.fields[0].product.details.surfaceType.name,
            surface1Value: msgs.fields[0].product.details.surfaceTypeValue,
            surface2Type: msgs.fields[0].product.details.secondSurfaceType.value,
            surface2TypeName: msgs.fields[0].product.details.secondSurfaceType.name,
            surface2Value: msgs.fields[0].product.details.secondSurfaceTypeValue,
            gridDefinitionTemplate: msgs.fields[0].grid.templateNumber,
            gridDefinitionTemplateName: msgs.fields[0].grid.definition.name,
            numberPoints: msgs.fields[0].grid.dataPointCount,
            shape: msgs.fields[0].grid.definition.earthShape.value,
            shapeName: msgs.fields[0].grid.definition.earthShape.name,
            gridUnits: getGridUnits(msgs.fields[0].grid.templateNumber),
            resolution: msgs.fields[0].grid.definition.resolutionAndComponentFlags,
            winds: !!(msgs.fields[0].grid.definition.resolutionAndComponentFlags & (1 << 4)),
            scanMode: msgs.fields[0].grid.definition.scanningMode,
            nx: msgs.fields[0].grid.definition.ni,
            ny: msgs.fields[0].grid.definition.nj,
            basicAngle: msgs.fields[0].grid.definition.basicAngle,
            lo1: msgs.fields[0].grid.definition.lo1,
            la1: msgs.fields[0].grid.definition.la1,
            lo2: msgs.fields[0].grid.definition.lo2,
            la2: msgs.fields[0].grid.definition.la2,
            dx: msgs.fields[0].grid.definition.di,
            dy: msgs.fields[0].grid.definition.dj,
        }
        const gribdata = msgs.fields[0].data
        msgs_.push({
            header,
            data: gribdata,
        })
    }

    return msgs_
}
