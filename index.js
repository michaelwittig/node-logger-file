var util = require("util"),
	logger = require("cinovo-logger"),
	assert = require("assert-plus"),
	fs = require("fs");

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

function canWrite(owner, inGroup, mode) {
	return owner && (mode & 00200) || // User is owner and owner can write.
		inGroup && (mode & 00020) || // User is in group and group can write.
		(mode & 00002); // Anyone can write.
}

module.exports = function(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles) {
	assert.string(dir, "dir");
	assert.string(fileSuffix, "fileSuffix");
	assert.string(filePrefix, "filePrefix");
	assert.number(maxFileSize, "maxFileSize");
	if (maxFileSize <= 1) {
		assert.fail(maxFileSize, 1, "maxFileSize", ">=");
	}
	assert.number(maxFileAge, "maxFileAge");
	if (maxFileAge <= 1) {
		assert.fail(maxFileAge, 1, "maxFileAge", ">=");
	}
	assert.number(maxFiles, "maxFiles");
	if (maxFiles <= 1) {
		assert.fail(maxFiles, 1, "maxFiles", ">=");
	}
	fs.stat(dir, function (err, stat) {
		if (err) {
			throw err;
		} else {
			if (!canWrite(process.getuid() === stat.uid, process.getgid() === stat.gid, stat.mode)) {
				assert.ok(false, "Can not write dir");
			}
		}
	});
	return new FileEndpoint(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles);
};
