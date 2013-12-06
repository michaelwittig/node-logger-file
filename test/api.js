var util = require("util"),
	endpoint = require("../index");

describe("API", function() {
	"use strict";
	describe("()", function() {
		it("should work if all params are set", function(done) {
			endpoint(true, true, true, true, "./test/log", "api_", ".txt", 1024, 60 * 60, 10, function(err, e) {
				if (err) {
					throw err;
				}
				e.stop(function(err) {
					if (err) {
						throw err;
					}
					done();
				});
			});
		});
	});
});
