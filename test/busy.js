var assert = require("assert-plus"),
	util = require("util"),
	endpoint = require("../index"),
	fs = require("fs"),
	lib = require("./lib"),
	logger = require("cinovo-logger");

describe("busy", function(){
	describe("()", function() {
		it("should write tow new files under heavy load", function(done) {
			var i, j = 0;
			var pause = {
				debug: 0,
				info: 0,
				error: 0,
				critical: 0
			}, esuap = {
				debug: 0,
				info: 0,
				error: 0,
				critical: 0
			};
			var busy = 0,
				ysub = 0;
			endpoint(true, true, true, true, "./test/log", "busy_", ".txt", 1024*1024*10, 60 * 60, 10, function(err, e) {
				if (err) {
					throw err;
				} else {
					logger.append(e);
					e.on("busy", function() {
						busy += 1;
					});
					e.on("ysub", function() {
						ysub += 1;
					});
					e.on("pause", function(level) {
						pause[level] += 1;
					});
					e.on("esuap", function(level) {
						esuap[level] += 1;
					});
					var interval = setInterval(function() {
						j += 1;
						for (i = 0; i < 1000; i += 1) {
							logger.debug("test", "message");
						}
						for (i = 0; i < 500; i += 1) {
							logger.info("test", "message");
						}
						for (i = 0; i < 50; i += 1) {
							logger.error("test", "message");
						}
						for (i = 0; i < 10; i += 1) {
							logger.critical("test", "message");
						}
						if (j >= 5) {
							clearInterval(interval);
							assert.ok(busy > 0, "busy");
							assert.ok((busy - ysub) >= 0 && (busy - ysub) <= 1, "busy and resumes");
							assert.equal(pause.critical, 0, "no critical pauses");
							assert.equal(pause.error, 0, "no error pauses");
							assert.ok(pause.info > 0, "info pauses");
							assert.ok(pause.debug > 0, "debug pauses");
							assert.ok((pause.critical - esuap.critical) >= 0 && (pause.critical - esuap.critical) <= 1, "critical pauses and resumes");
							assert.ok((pause.error - esuap.error) >= 0 && (pause.error - esuap.error) <= 1, "error pauses and resumes");
							assert.ok((pause.info - esuap.info) >= 0 && (pause.info - esuap.info) <= 1, "info pauses and resumes");
							assert.ok((pause.debug - esuap.debug) >= 0 && (pause.debug - esuap.debug) <= 1, "debug pauses and resumes");
							done();
						}
					}, 1000);
				}
			});
		});
	});
});
