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
function getFileName(prefix, suffix) {
	var fileName = "";
	if (prefix) {
		fileName += prefix;
	}
	var date = new Date();
	fileName += date.getUTCFullYear() + "-" + twoDigitMin(date.getUTCMonth() + 1) + "-" + twoDigitMin(date.getUTCDate()) + "_" + date.getUTCHours() + "-" + date.getUTCMinutes() + "-" + date.getUTCSeconds() + "-" + date.getUTCMilliseconds();
	if (suffix) {
		fileName += suffix;
	}
	return fileName;
}

function FileEndpoint(debug, info, error, critial, dir, filePrefix, fileSuffix, maxFileSize, maxFileAge, maxFiles, formatter) {
	logger.Endpoint.call(this, debug, info, error, critial);
	this.dir = dir;
	this.filePrefix = filePrefix;
	this.fileSuffix = fileSuffix;
	this.maxFileSize = maxFileSize;
	this.maxFileAge = maxFileAge;
	this.maxFiles = maxFiles;
	this.formatter = require("./lib/formatter." + formatter + ".js");
	this.file = undefined;
	this.fileBusy = undefined;
	this.fileSize = undefined;  // in bytes
	this.fileWriteStream = undefined;
	this.fileTimer = undefined;
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
				self.fileSize = Number.MIN_VALUE; // prevents the file from rolling again with more logs arrive before new file is created
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
FileEndpoint.prototype.stop = function(errCallback) {
	if (this.fileWriteStream === undefined) {
		throw new Error("Can not stop twice");
	}
	var file = this.file;
	var self = this;
	this.closeFile(function(err) {
		if (err) {
			errCallback(err);
		} else {
			try {
				errCallback();
			} finally {
				self.emit("stop", file);
			}
		}
	});
};
FileEndpoint.prototype.openFile = function(file, errCallback) {
	var self = this;
	fs.stat(file, function(err, stats) {
		if (err) {
			errCallback(err);
		} else {
			self.file = file;
			self.fileBusy = false;
			self.fileSize = stats.size;
			var fileLifeTime = (new Date()).getTime() - stats.ctime.getTime();
			var timeout = Math.max(1, (self.maxFileAge * 1000) - fileLifeTime);
			clearTimeout(self.fileTimer);
			self.fileTimer = setTimeout(function() {
				self.rollFile(function(err) {
					if(err) {
						self.emit("error", err);
					}
				});
			}, timeout);
			self.fileWriteStream = fs.createWriteStream(self.file, {
				flags: "a",
				encoding: "utf8",
				mode: 0666
			});
			var fired = false;
			self.fileWriteStream.once("open", function() {
				if (fired === false) {
					fired = true;
					try {
						errCallback();
					} finally {
						self.emit("openFile", self.file);
					}
				}
			});
			self.fileWriteStream.on("error", function(err) {
				if (fired === false) {
					fired = true;
					errCallback(err);
				} else {
					self.emit("error", err);
				}
			});
		}
	});
};
FileEndpoint.prototype.deleteFile = function(file, errCallback) {
	var self = this;
	fs.unlink(file, function(err) {
		if (err) {
			errCallback(err);
		} else {
			try {
				errCallback();
			} finally {
				self.emit("deleteFile", file);
			}
		}
	});
};
FileEndpoint.prototype.createFile = function(errCallback) {
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
		clearTimeout(self.fileTimer);
		self.fileTimer = setTimeout(function() {
			self.rollFile(function(err) {
				if(err) {
					self.emit("error", err);
				}
			});
		}, self.maxFileAge * 1000);
		var fired = false;
		self.fileWriteStream.once("open", function() {
			if (fired === false) {
				fired = true;
				try {
					errCallback();
				} finally {
					self.emit("createFile", self.file);
				}
			}
		});
		self.fileWriteStream.on("error", function(err) {
			if (fired === false) {
				fired = true;
				errCallback(err);
			} else {
				self.emit("error", err);
			}
		});
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
	function del(i, files, errCallback) {
		if (i >= files.length) {
			errCallback();
		} else {
			self.deleteFile(files[i].file, function(err) {
				if (err) {
					errCallback(err);
				} else {
					del(i + 1, files, errCallback);
				}
			});
		}
	}

	this.getFiles(function(err, files) {
		if (err) {
			errCallback(err);
		} else {
			if (files.length >= self.maxFiles) {
				del(self.maxFiles - 1, files, function(err) {
					if (err) {
						errCallback(err);
					} else {
						check(0, self.dir + "/" + getFileName(self.filePrefix, self.fileSuffix));
					}
				});
			} else {
				check(0, self.dir + "/" + getFileName(self.filePrefix, self.fileSuffix));
			}
		}
	});
};
function closeFileWriteStream(fileWriteStream, errCallback) {
	fileWriteStream.removeAllListeners("drain");
	fileWriteStream.end(function(err) {
		if (err) {
			errCallback(err);
		} else {
			errCallback();
		}
	});
}
FileEndpoint.prototype.closeFile = function(errCallback) {
	this.fileWriteStream.removeAllListeners("drain");
	var self = this;
	this.fileWriteStream.end(function(err) {
		if (err) {
			errCallback(err);
		} else {
			self.file = undefined;
			self.fileBusy = undefined;
			self.fileSize = undefined;
			clearTimeout(self.fileTimer);
			self.fileWriteStream = undefined;
			try {
				errCallback();
			} finally {
				self.emit("closeFile", self.file);
			}
		}
	});
};
FileEndpoint.prototype.rollFile = function(errCallback) {
	var oldFile = this.file;
	var self = this;
	var oldFileWriteStream = this.fileWriteStream;
	self.createFile(function(err) {
		if (err) {
			errCallback(err);
		} else {
			closeFileWriteStream(oldFileWriteStream, function(err) {
				if (err) {
					errCallback(err);
				} else {
					try {
						errCallback();
					} finally {
						self.emit("rollFile", oldFile, self.file);
					}
				}
			});
		}
	});
};
FileEndpoint.prototype.getFiles = function(callback) {
	var self = this;
	fs.readdir(self.dir, function(err, files) {
		if (err) {
			callback(err);
		} else {
			var oldFiles = [];
			files.forEach(function(file) {
				if ((file.indexOf(self.filePrefix) === 0) && (file.indexOf(self.fileSuffix) === (file.length - self.fileSuffix.length))) {
					var stats = fs.statSync(self.dir + "/" + file);
					oldFiles.push({
						name: file,
						file: self.dir + "/" + file,
						size: stats.size,
						created_at: stats.ctime
					});
				}
			});
			oldFiles = oldFiles.sort(function(a, b) {
				if (b.created_at.getTime() > a.created_at.getTime()) {
					return 1;
				}
				if (b.created_at.getTime() < a.created_at.getTime()) {
					return -1;
				}
				return 0;
			});
			callback(undefined, oldFiles);
		}
	});
};

function canWrite(owner, inGroup, mode) {
	return (owner && (mode & 00200)) || // User is owner and owner can write.
		(inGroup && (mode & 00020)) || // User is in group and group can write.
		(mode & 00002); // Anyone can write.
}

module.exports = function(debug, info, error, critial, dir, filePrefix, fileSuffix, maxFileSize, maxFileAge, maxFiles, callback) {
	assert.string(dir, "dir");
	assert.string(filePrefix, "filePrefix");
	assert.string(fileSuffix, "fileSuffix");
	assert.number(maxFileSize, "maxFileSize");
	if (maxFileSize < 1) {
		assert.fail(maxFileSize, 1, "maxFileSize", ">=");
	}
	assert.number(maxFileAge, "maxFileAge");
	if (maxFileAge < 1) {
		assert.fail(maxFileAge, 1, "maxFileAge", ">=");
	}
	assert.number(maxFiles, "maxFiles");
	if (maxFiles < 1) {
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

	var e = new FileEndpoint(debug, info, error, critial, dir, filePrefix, fileSuffix, maxFileSize, maxFileAge, maxFiles, "json");

	function create() {
		e.createFile(function(err) {
			if (err) {
				callback(err);
			} else {
				callback(undefined, e);
			}
		});
	}

	e.getFiles(function(err, files) {
		if (err) {
			callback(err);
		} else {
			if (files.length > 0) {
				var file = files[0];
				if (file.created_at.getTime() > ((new Date()).getTime() - (maxFileAge * 1000))) {
					e.openFile(file.file, function(err) {
						if (err) {
							callback(err);
						} else {
							callback(undefined, e);
						}
					});
				} else {
					create();
				}
			} else {
				create();
			}
		}
	});

};
