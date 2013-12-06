var util = require("util"),
	lib = require("cinovo-logger-lib"),
	assert = require("assert-plus"),
	fs = require("fs");

function twoDigitMin(number) {
	"use strict";
	if (number >= 0 && number < 10) {
		return "0" + number;
	}
	return number;
}
function getFileName(prefix, suffix) {
	"use strict";
	var date = new Date(),
		fileName = "";
	if (prefix) {
		fileName += prefix;
	}
	fileName += date.getFullYear() + "-" + twoDigitMin(date.getMonth() + 1) + "-" + twoDigitMin(date.getDate()) + "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + date.getMilliseconds();
	if (suffix) {
		fileName += suffix;
	}
	return fileName;
}

function FileEndpoint(debug, info, error, critial, dir, filePrefix, fileSuffix, maxFileSize, maxFileAge, maxFiles, formatter) {
	"use strict";
	lib.Endpoint.call(this, debug, info, error, critial, "file:" + dir);
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
util.inherits(FileEndpoint, lib.Endpoint);
FileEndpoint.prototype._log = function(log, callback) {
	"use strict";
	if (this.fileBusy === true) {
		callback(new Error("file too busy"));
	} else {
		var self = this,
			buffer = new Buffer(this.formatter(log) + "\n", "utf8");
		this.fileSize += buffer.length;
		if (this.fileWriteStream.write(buffer, function(err) {
			if (self.fileSize > self.maxFileSize) {
				self.fileSize = Number.MIN_VALUE; // prevents the file from rolling again with more logs arrive before new file is created
				self.rollFile(callback);
			} else {
				callback(err);
			}
		}) === false) {
			this.fileBusy = true;
			this.fileWriteStream.once("drain", function() {
				self.fileBusy = false;
				self.emit("ysub");
			});
			this.emit("busy");
		}
	}
};
FileEndpoint.prototype._stop = function(callback) {
	"use strict";
	var file = this.file,
		self = this;
	this.closeFile(function(err) {
		if (err) {
			callback(err);
		} else {
			try {
				callback();
			} finally {
				self.emit("_stop", file);
			}
		}
	});
};
FileEndpoint.prototype.openFile = function(file, callback) {
	"use strict";
	var self = this;
	fs.stat(file, function(err, stats) {
		if (err) {
			callback(err);
		} else {
			self.file = file;
			self.fileBusy = false;
			self.fileSize = stats.size;
			var fileLifeTime = (new Date()).getTime() - stats.ctime.getTime(),
				timeout = Math.max(1, (self.maxFileAge * 1000) - fileLifeTime),
				fired = false;
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
				mode: "0666"
			});
			self.fileWriteStream.once("open", function() {
				if (fired === false) {
					fired = true;
					try {
						callback();
					} finally {
						self.emit("openFile", self.file);
					}
				}
			});
			self.fileWriteStream.on("error", function(err) {
				if (fired === false) {
					fired = true;
					callback(err);
				} else {
					self.emit("error", err);
				}
			});
		}
	});
};
FileEndpoint.prototype.deleteFile = function(file, callback) {
	"use strict";
	var self = this;
	fs.unlink(file, function(err) {
		if (err) {
			callback(err);
		} else {
			try {
				callback();
			} finally {
				self.emit("deleteFile", file);
			}
		}
	});
};
FileEndpoint.prototype.createFile = function(callback) {
	"use strict";
	var self = this;
	function create(file) {
		self.file = file;
		self.fileBusy = false;
		self.fileSize = 0;
		self.fileWriteStream = fs.createWriteStream(file, {
			flags: "a",
			encoding: "utf8",
			mode: "0666"
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
					callback();
				} finally {
					self.emit("createFile", self.file);
				}
			}
		});
		self.fileWriteStream.on("error", function(err) {
			if (fired === false) {
				fired = true;
				callback(err);
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
	function del(i, files, callback) {
		if (i >= files.length) {
			callback();
		} else {
			self.deleteFile(files[i].file, function(err) {
				if (err) {
					callback(err);
				} else {
					del(i + 1, files, callback);
				}
			});
		}
	}

	this.getFiles(function(err, files) {
		if (err) {
			callback(err);
		} else {
			if (files.length >= self.maxFiles) {
				del(self.maxFiles - 1, files, function(err) {
					if (err) {
						callback(err);
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
function closeFileWriteStream(fileWriteStream, callback) {
	"use strict";
	fileWriteStream.removeAllListeners("drain");
	fileWriteStream.end(function(err) {
		if (err) {
			callback(err);
		} else {
			callback();
		}
	});
}
FileEndpoint.prototype.closeFile = function(callback) {
	"use strict";
	this.fileWriteStream.removeAllListeners("drain");
	var self = this;
	this.fileWriteStream.end(function(err) {
		if (err) {
			callback(err);
		} else {
			self.file = undefined;
			self.fileBusy = undefined;
			self.fileSize = undefined;
			clearTimeout(self.fileTimer);
			self.fileWriteStream = undefined;
			try {
				callback();
			} finally {
				self.emit("closeFile", self.file);
			}
		}
	});
};
FileEndpoint.prototype.rollFile = function(callback) {
	"use strict";
	var oldFile = this.file,
		self = this,
		oldFileWriteStream = this.fileWriteStream;
	self.createFile(function(err) {
		if (err) {
			callback(err);
		} else {
			closeFileWriteStream(oldFileWriteStream, function(err) {
				if (err) {
					callback(err);
				} else {
					try {
						callback();
					} finally {
						self.emit("rollFile", oldFile, self.file);
					}
				}
			});
		}
	});
};
FileEndpoint.prototype.getFiles = function(callback) {
	"use strict";
	var self = this;
	fs.readdir(self.dir, function(err, files) {
		if (err) {
			callback(err);
		} else {
			var oldFiles = [], stats;
			files.forEach(function(file) {
				if ((file.indexOf(self.filePrefix) === 0) && (file.indexOf(self.fileSuffix) === (file.length - self.fileSuffix.length))) {
					/*jslint stupid: true*/
					stats = fs.statSync(self.dir + "/" + file);
					/*jslint stupid: false*/
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

module.exports = function(debug, info, error, critial, dir, filePrefix, fileSuffix, maxFileSize, maxFileAge, maxFiles, callback) {
	"use strict";
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
