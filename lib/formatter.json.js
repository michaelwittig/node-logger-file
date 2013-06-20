module.exports = function(log) {
	var cache = [];
	try {
		return JSON.stringify(log, function(key, value) {
			if (value !== null && typeof value === "object") {
				if (cache.indexOf(value) !== -1) {
					return "Circular";
				}
				cache.push(value);
			}
			return value;
		});
	} catch (err) {
		try {
			return JSON.stringify({error: err.toString()});
		} catch (err2) {
			return "{}";
		}
	}
};
