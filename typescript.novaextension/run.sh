#!/usr/bin/env bash

# note: any output from this script will be used by nova's language server, so it'll break functionality
# to get logging in the extension console, pipe to stderr by prefixing with `>&2 `

cd "$WORKSPACE_DIR"

# symlinks have issues when the extension is submitted to the library, so we don't use node_modules/.bin

if [ "$DEBUG" != "TRUE" ]
then
	node \
		"$INSTALL_DIR/node_modules/.bin/typescript-language-server" \
		--stdio
else
	if [ "$DEBUG_BREAK" ]
	then
		DEBUG_ARG="--inspect-brk"
	else
		DEBUG_ARG="--inspect"
	fi
	DEBUG_ARG="$DEBUG_ARG=127.0.0.1:$DEBUG_PORT"
	# note: --tsserver-path=".../tsserver.js" doesn't support debugging since it
	# tries to fork and bind two processes to the same port
	node \
		"$DEBUG_ARG" \
		"$INSTALL_DIR/node_modules/.bin/typescript-language-server" \
		--stdio
fi
