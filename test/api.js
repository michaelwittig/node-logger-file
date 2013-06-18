var assert = require("assert-plus"),
	util = require("util"),
	endpoint = require("../index");

describe("API", function(){
	describe("()", function() {
		it("should work if all params are set", function(){
			endpoint(true, true, true, true, "./test/log", "fileSuffix", "filePrefix", 10, 60, 10);
		});
	});
});
