OPT="SIMPLE"
JS_OUT="out.js"
JS_IN="main.js"
BUILD_DIR=$(shell pwd)/Builds

default:
	make clean || true
	npx tsc

build:
	make
	npx pkg package.json
	make clean || true

clean:
	@find ./src -name "*.js" -type f
	@find ./src -name "*.js" -type f -delete
	@rm main.js