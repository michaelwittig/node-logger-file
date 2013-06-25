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
					var interval = setInterval(function() {
						j += 1;
						for (i = 0; i < 1000; i += 1) {
							logger.debug("test", "message");
						}
						if (j >= 5) {
							clearInterval(interval);
							assert.ok(busy > 0, "busy");
							assert.ok((busy - ysub) >= 0 && (busy - ysub) <= 1, "busy and resumes");
							done();
						}
					}, 1000);
				}
			});
		});
	});
});
