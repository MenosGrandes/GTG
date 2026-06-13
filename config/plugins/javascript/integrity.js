(function () {
  var _f = require("fs").readFileSync(__filename, "utf8");
  var _l = _f.indexOf("\n");
  var _h = _f.slice(2, _l);
  var _c = _f.slice(_l + 1);
  var _d = require("crypto").createHash("sha256").update(_c).digest("hex");
  if (_h !== _d) {
    process.exit(1);
  }
})();
