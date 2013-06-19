var util = require("util"),
	endpoint = require("../index"),
	fs = require("fs"),
	lib = require("./lib");

describe("formatter.json", function(){
	describe("log()", function() {
		it("should write a new json file", function(done) {
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
			endpoint(true, true, true, true, "./test/log", "formatter_json_", ".txt", 1024, 60, 10, function(err, e) {
				if (err) {
					throw err;
				} else {
					var file = e.file;
					e.log(log, function(err) {
						if (err) {
							throw err;
						} else {
							e.stop(function() {
								if (err) {
									throw err;
								} else {
									lib.checkFile(file, JSON.stringify(log) + "\n", 1, done);
								}
							});
						}
					});
				}
			});
		});
	});
});
