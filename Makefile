default: test

jslint:
	@echo "jslint"
	@./node_modules/jslint/bin/jslint.js --white --nomen --node --predef describe --predef it *.js

circular:
	@echo "circular"
	@./node_modules/madge/bin/madge --circular --format amd .

mocha:
	@echo "mocha"
	@mkdir -p test/log/
	@rm -Rf test/log/*
	@./node_modules/mocha/bin/mocha --timeout 7000 test/*.js
	@echo

test: mocha circular
	@echo "test"
	@echo

outdated:
	@echo "outdated modules?"
	@./node_modules/npmedge/bin/npmedge
