var assert = require("assert-plus"),
	util = require("util"),
	endpoint = require("../index"),
	fs = require("fs"),
	lib = require("./lib");

describe("maxage", function(){
	describe("()", function() {
		it("should create 6 files and delete 4", function(done) {
			var deletes = 0, rolls = 0;
			endpoint(true, true, true, true, "./test/log", "maxage_", ".txt", 1024 * 1024, 1, 10, function(err, e) {
				if (err) {
					throw err;
				} else {
					function log() {
						e.log({
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
						}, function(err) {
							if (err) {
								throw err;
							}
						});
					}

					e.on("deleteFile", function(file) {
						deletes += 1;
					});
					e.on("rollFile", function(file) {
						rolls += 1;
					});
					setTimeout(log, 500);
					setTimeout(log, 1000);
					setTimeout(log, 1500);
					setTimeout(log, 2000);
					setTimeout(log, 2500);
					setTimeout(log, 3000);
					setTimeout(function() {
						e.stop(function(err) {
							if (err) {
								throw err;
							} else {
								assert.equal(rolls, 3, "rolls");
								assert.equal(deletes, 0, "deletes");
								done();
							}
						});
					}, 3500);
				}
			});
		});
	});
});
