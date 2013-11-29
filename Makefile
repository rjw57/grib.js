all:
	npm install

test: node_modules/.bin/mocha
	node_modules/.bin/mocha --reporter spec --no-colors

node_modules/.bin/mocha:
	npm install mocha

.PHONY: all test

# vim:noet:sw=8:ts=8:sts=8
