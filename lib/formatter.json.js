var safelogger = require("../node_modules/cinovo-logger/lib/safejson");

module.exports = function(log) {
	return safelogger(log);
};
