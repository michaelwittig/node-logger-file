var util = require("util"),
	logger = require("cinovo-logger");

function FileEndpoint(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles) {
	logger.Endpoint.call(this, debug, info, error, critial);
	this.dir = dir;
	this.fileSuffix = fileSuffix;
	this.filePrefix = filePrefix;
	this.maxFileSize = maxFileSize;
	this.maxFileAge = maxFileAge;
	this.maxFiles = maxFiles;
}
util.inherits(FileEndpoint, logger.Endpoint);
FileEndpoint.prototype.log = function(log, errCallback) {
	// TODO
	errCallback()
};

module.exports = function(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles) {
	return new FileEndpoint(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles);
};
