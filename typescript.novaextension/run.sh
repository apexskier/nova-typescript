#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# future: wrapper code?
# node --inspect-brk "$DIR/Scripts/process.dist.js"

# this run.sh script lets me use --inspect-brk to debug
node "$DIR/../node_modules/javascript-typescript-langserver/lib/language-server-stdio"
