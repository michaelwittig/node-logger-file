var formatter = require("../lib/formatter.json"),
	assert = require("assert-plus");

describe("formatter.json", function(){
	describe("()", function() {
		it("should handle circular dependencies", function() {
			var circular = {
				a: 1
			};
			circular.b = circular;
			var json = formatter(circular);
			assert.equal(json, '{"a":1,"b":"Circular"}', "json");
		});
	});
});
