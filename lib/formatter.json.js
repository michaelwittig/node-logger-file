var lib = require("cinovo-logger-lib");

module.exports = function(log) {
	"use strict";
	return lib.safejson(log);
};
