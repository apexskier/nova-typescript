#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# future: wrapper code?
# node --inspect-brk "$DIR/Scripts/process.dist.js"

# this run.sh script lets me use --inspect-brk to debug

# env
# echo $PATH
# dirname $(command -v node)
# note: any output from this script will be used by nova's language server thing, so it'll break functionality

cd "$WORKSPACE_DIR"

# note: --tsserver-path="$WORKSPACE_DIR/node_modules/typescript/lib/tsserver.js doesn't support debugging since it tries to fork and bind two processes to the same port

# path is stripped in the extension execution environment somehow
PATH=$(dirname $(command -v node)) node \
	--inspect=9239 \
	"$DIR/node_modules/.bin/typescript-language-server" \
	--stdio \
	--tsserver-path="$WORKSPACE_DIR/node_modules/.bin/tsserver" \
	--tsserver-log-file /tmp/nova-typescript.log
