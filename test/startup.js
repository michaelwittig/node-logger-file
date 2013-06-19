var util = require("util"),
	endpoint = require("../index"),
	uuid = require("node-uuid");

var filePrefix = "startup_" + uuid.v4() + "_";

describe("startup", function(){
	describe("()", function() {
		it("should create file on first try", function(done) {
			endpoint(true, true, true, true, "./test/log", filePrefix, ".txt", 10, 3, 10, function(err, e) {
				if (err) {
					throw err;
				} else {
					e.on("createFile", function(file) {
						done();
					});
				}
			});
		});
		it("should open file on second try", function(done) {
			endpoint(true, true, true, true, "./test/log", filePrefix, ".txt", 10, 3, 10, function(err, e) {
				if (err) {
					throw err;
				} else {
					e.on("openFile", function(file) {
						done();
					});
				}
			});
		});
		it("should create file because of age", function(done) {
			setTimeout(function() {
				endpoint(true, true, true, true, "./test/log", filePrefix, ".txt", 10, 3, 10, function(err, e) {
					if (err) {
						throw err;
					} else {
						e.on("createFile", function(file) {
							done();
						});
					}
				});
			}, 3500);
		});
	});
});
