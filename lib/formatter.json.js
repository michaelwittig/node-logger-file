module.exports = function(log) {
	var cache = {};
	try {
		return JSON.stringify(log, function(key, value) {
			if (value !== null && typeof value === "object") {
				if (cache[value] === true) {
					return "Circular"; // Circular reference found, discard key
				}
				cache[value] = true;
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
