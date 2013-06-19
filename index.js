var util = require("util"),
	logger = require("cinovo-logger"),
	assert = require("assert-plus"),
	fs = require("fs");

function twoDigitMin(number) {
	if (number >= 0 && number < 10) {
		return "0" + number;
	}
	return number;
}
function getFileName(suffix, prefix) {
	var fileName = "";
	if (suffix) {
		fileName += suffix;
	}
	var date = new Date();
	fileName += date.getUTCFullYear() + "-" + twoDigitMin(date.getUTCMonth() + 1) + "-" + twoDigitMin(date.getUTCDate()) + "_" + date.getUTCHours() + "-" + date.getUTCMinutes() + "-" + date.getUTCSeconds() + "-" + date.getUTCMilliseconds();
	if (prefix) {
		fileName += prefix;
	}
	return fileName;
}

function FileEndpoint(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles, formatter) {
	logger.Endpoint.call(this, debug, info, error, critial);
	this.dir = dir;
	this.fileSuffix = fileSuffix;
	this.filePrefix = filePrefix;
	this.maxFileSize = maxFileSize;
	this.maxFileAge = maxFileAge;
	this.maxFiles = maxFiles;
	this.formatter = require("./lib/formatter." + formatter + ".js");
	this.file = undefined;
	this.fileBusy = undefined;
	this.fileSize = undefined;  // in bytes
	this.fileWriteStream = undefined;
	// TODO crateFile() or openFile()
}
util.inherits(FileEndpoint, logger.Endpoint);
FileEndpoint.prototype.log = function(log, errCallback) {
	if (this.fileBusy === true) {
		errCallback(new Error("file too busy"));
	} else {
		var buffer = new Buffer(this.formatter(log) + "\n", "utf8");
		this.fileSize += buffer.length;
		var self = this;
		if (this.fileWriteStream.write(buffer, function(err) {
			if (self.fileSize > self.maxFileSize) {
				self.rollFile(errCallback);
			} else {
				errCallback(err);
			}
		}) === false) {
			this.fileBusy = true;
			this.fileWriteStream.once("drain", function() {
				self.fileBusy = false;
			});
		}
	}
};
FileEndpoint.prototype.openFile = function(errCallback) {
	this.file = ""; // TODO get last filename
	this.fileBusy = false;
	this.fileSize = 0; //TODO init with current filesize
	this.fileWriteStream = fs.createWriteStream(this.file, {
		flags: "a",
		encoding: "utf8",
		mode: 0666
	});
	this.emit("openFile", this.file);
	errCallback(); // TODO listen for error evets?
};
FileEndpoint.prototype.crateFile = function(errCallback) {
	var self = this;
	function create(file) {
		self.file = file;
		self.fileBusy = false;
		self.fileSize = 0;
		self.fileWriteStream = fs.createWriteStream(file, {
			flags: "a",
			encoding: "utf8",
			mode: 0666
		});
		self.emit("crateFile", self.file);
		errCallback(); // TODO listen for error evets?
	}
	function check(i, origFileName) {
		var fileName;
		if (i === 0) {
			fileName = origFileName;
		} else {
			fileName = origFileName + "." + i;
		}
		fs.exists(fileName, function(exists) {
			if (exists === true) {
				check(i + 1, origFileName);
			} else {
				create(fileName);
			}
		});
	}
	check(0, this.dir + "/" + getFileName(this.fileSuffix, this.filePrefix));
};
FileEndpoint.prototype.closeFile = function(errCallback) {
	this.fileWriteStream.removeAllListeners("drain");
	var self = this;
	this.fileWriteStream.end(function(err) {
		if (err) {
			errCallback(err);
		} else {
			self.emit("closeFile", self.file);
			self.file = undefined;
			self.fileBusy = undefined;
			self.fileSize = undefined;
			self.fileWriteStream = undefined;
			errCallback();
		}
	});
};
FileEndpoint.prototype.rollFile = function(errCallback) {
	var oldFile = this.file;
	var self = this;
	this.closeFile(function(err) {
		if (err) {
			errCallback(err);
		} else {
			self.crateFile(function(err) {
				if (err) {
					errCallback(err);
				} else {
					self.emit("rollFile", oldFile, self.file);
					errCallback();
				}
			});
		}
	});
};
FileEndpoint.prototype.stop = function(errCallback) {
	this.closeFile(errCallback);
};

function canWrite(owner, inGroup, mode) {
	return owner && (mode & 00200) || // User is owner and owner can write.
		inGroup && (mode & 00020) || // User is in group and group can write.
		(mode & 00002); // Anyone can write.
}

module.exports = function(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles, callback) {
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
	// TODO check fileage, roll if too old or setTimer for first timed roll
	var e = new FileEndpoint(debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles, "json");
	e.crateFile(function(err) {
		if (err) {
			callback(err);
		} else {
			callback(undefined, e);
		}
	});
};
