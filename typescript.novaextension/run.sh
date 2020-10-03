#!/usr/bin/env bash

# note: any output from this script will be used by nova's language server, so it'll break functionality

cd "$WORKSPACE_DIR"

# note: --tsserver-path=".../tsserver.js" doesn't support debugging since it tries to fork and bind two processes to the same port

# symlinks have issues when the extension is submitted to the library, so we don't use node_modules/.bin
node \
	"$INSTALL_DIR/node_modules/typescript-language-server/lib/cli.js" \
	--stdio \
	--tsserver-path="$TSLIB_PATH/tsserver.js"

# use this for debugging
# node \
# 	--inspect-brk \
# 	"$INSTALL_DIR/node_modules/typescript-language-server/lib/cli.js" \
# 	--stdio \
# 	--tsserver-path="$TSLIB_PATH/tsserver"
