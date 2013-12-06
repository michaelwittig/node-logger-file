var assert = require("assert-plus"),
	util = require("util"),
	endpoint = require("../index"),
	fs = require("fs"),
	lib = require("./lib");

describe("roll", function() {
	"use strict";
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
			},
				rolls = 0;
			endpoint(true, true, true, true, "./test/log", "roll_", ".txt", 1024 * 1024, 60 * 60, 10, function(err, e) {
				if (err) {
					throw err;
				}
				e.on("rollFile", function(oldFile) {
					rolls += 1;
					lib.checkFileSize(oldFile, 1024 * 1024);
					});
				var times = 20000;
				lib.logMultipleTimes(e, log, 0, times, function(err) {
					if (err) {
						throw err;
					}
					e.stop(function(err) {
						if (err) {
							throw err;
						}
						assert.equal(rolls, 3, "3 rolls expected");
						done();
					});
				});
			});
		});
		it("should write tow new files under heavy load", function(done) {
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
			},
				rolls = 0,
				creates = 0;
			endpoint(true, true, true, true, "./test/log", "rollheavy_", ".txt", 1, 60 * 60, 10, function(err, e) {
				if (err) {
					throw err;
				}
				e.on("rollFile", function() {
					rolls += 1;
				});
				e.on("createFile", function() {
					creates += 1;
				});
				lib.logMultipleTimesHeavy(e, log, 3, function(err) {
					if (err) {
						throw err;
					}
					e.stop(function(err) {
						if (err) {
							throw err;
						}
						assert.equal(rolls, 1, "1 roll expected");
						assert.equal(creates, 2, "2 creates expected");
						done();
					});
				});
			});
		});
	});
});
