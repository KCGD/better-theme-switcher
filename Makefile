OPT="SIMPLE"
JS_OUT="out.js"
JS_IN="main.js"
BUILD_DIR=$(shell pwd)/Builds

default:
	@echo "Starting partial build (no executable)..."
	@echo "[1/2] Clean working directory"
	@make clean || true
	@echo "[2/2] Compile TS"
	@npx tsc
	@echo "Partial build complete."
build:
	@echo "[1/4] Compile TS"
	@make
	@echo "[2/4] Build Executable"
	@npx pkg package.json
	@echo "[3/4] Clean working directory"
	@make clean || true
	@echo "Build complete."
clean:
	@find ./src -name "*.js" -type f
	@find ./src -name "*.js" -type f -delete
	@rm main.js
