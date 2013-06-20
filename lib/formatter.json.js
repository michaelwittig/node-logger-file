var lib = require("cinovo-logger-lib");

module.exports = function(log) {
	return lib.safejson(log);
};
