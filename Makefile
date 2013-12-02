all:
	npm install

test: all
	node_modules/.bin/mocha --reporter spec --no-colors
	node_modules/.bin/karma start config/karma.conf.js --single-run

.PHONY: all test

# vim:noet:sw=8:ts=8:sts=8
