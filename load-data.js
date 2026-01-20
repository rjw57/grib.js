const fs = require('fs');
function get(url, cb) {
    fetch(url)
    .then(res => res.arrayBuffer())
    .then(buff => cb(null, buff))
    .catch(err => cb(err));
}
module.exports = (fs && fs.readFile) || get;