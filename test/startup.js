var util = require("util"),
	endpoint = require("../index"),
	uuid = require("node-uuid");

var filePrefix = "startup_" + uuid.v4() + "_";

describe("startup", function(){
	describe("()", function() {
		it("should create file on first try", function(done) {
			endpoint(true, true, true, true, "./test/log", filePrefix, ".txt", 10, 60 * 60, 10, function(err, e) {
				if (err) {
					throw err;
				} else {
					e.once("createFile", function(file) {
						done();
					});
				}
			});
		});
		it("should open file on second try", function(done) {
			endpoint(true, true, true, true, "./test/log", filePrefix, ".txt", 10, 60 * 60, 10, function(err, e) {
				if (err) {
					throw err;
				} else {
					e.once("openFile", function(file) {
						done();
					});
				}
			});
		});
		it("should create file because of age", function(done) {
			setTimeout(function() {
				endpoint(true, true, true, true, "./test/log", filePrefix, ".txt", 10, 1, 10, function(err, e) {
					if (err) {
						throw err;
					} else {
						e.once("createFile", function(file) {
							e.stop(function(err) {
								if (err) {
									throw err;
								} else {
									done();
								}
							});
						});
					}
				});
			}, 3500);
		});
	});
});
