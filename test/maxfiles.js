var assert = require("assert-plus"),
	util = require("util"),
	endpoint = require("../index"),
	fs = require("fs"),
	lib = require("./lib");

describe("maxfiles", function(){
	describe("()", function() {
		it("should create 6 files and delete 4", function(done) {
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
			var deletes = 0, creates = 0;
			endpoint(true, true, true, true, "./test/log", "maxfiles_", ".txt", 2, 60 * 60, 2, function(err, e) {
				if (err) {
					throw err;
				} else {
					e.on("deleteFile", function(file) {
						deletes += 1;
					});
					e.on("createFile", function(file) {
						creates += 1;
					});
					lib.logMultipleTimes(e, log, 0, 5, function(err) {
						if (err) {
							throw err;
						} else {
							e.stop(function() {
								if (err) {
									throw err;
								} else {
									assert.equal(creates, 6, "6 creates expected");
									assert.equal(deletes, 4, "4 deletes expected");
									done();
								}
							});
						}
					});
				}
			});
		});
	});
});
