var assert = require("assert-plus"),
	util = require("util"),
	endpoint = require("../index"),
	fs = require("fs"),
	lib = require("./lib");

describe("nameclash", function(){
	describe("()", function() {
		it("should write tow new files", function(done) {
			var log = {
				level: "debug",
				date: new Date(),
				pid: 123,
				origin: "script",
				message: "test",
				metadata: {a: 1},
				fullOrigin: {
					file: "test.js",
					line: 123,
					fn: "testfn"
				}
			};
			endpoint(true, true, true, true, "./test/log", "nameclash_", ".txt", 100, 60 * 60, 1000, function(err, e) {
				if (err) {
					throw err;
				} else {
					var times = 500;
					lib.logMultipleTimes(e, log, 0, times, function(err) {
						if (err) {
							throw err;
						} else {
							e.stop(function() {
								if (err) {
									throw err;
								} else {
									fs.readdir("./test/log", function(err, files) {
										if (err) {
											throw err;
										} else {
											var timestamps = {}; var clashes = 0;
											files.forEach(function(file) {
												if (file.indexOf("nameclash_") === 0)	{
													var timestamp = file.substr(10);
													timestamp = timestamp.substr(0, timestamp.indexOf(".txt"));
													if (!timestamps[timestamp]) {
														timestamps[timestamp] = 0;
													} else {
														clashes += 1;
													}
													timestamps[timestamp] += 1;
												}
											});
											assert.ok(clashes > 0, "at least one nameclash happened");
											done();
										}
									});
								}
							});
						}
					});
				}
			});
		});
	});
});
