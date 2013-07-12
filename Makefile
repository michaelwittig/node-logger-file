default: test

jslint:
	@echo "jslint"
	@jslint *.js

circular:
	@echo "circular"
	@madge --circular --format amd .

mocha:
	@echo "mocha"
	@rm -Rf test/log/*
	@mocha --timeout 7000 test/*
	@echo

test: mocha circular
	@echo "test"
	@echo

outdated:
	@echo "outdated modules?"
	@npmedge
