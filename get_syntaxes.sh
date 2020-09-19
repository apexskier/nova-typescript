#!/bin/bash

NOVA_SYNTAXES="$(dirname $(readlink $(which nova)))"/Extensions/TypeScript.novaextension/Syntaxes
cp -R "$NOVA_SYNTAXES/." ./typescript.novaextension/Syntaxes/
