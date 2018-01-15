#!/bin/sh

set -e;
set -v;

mkdir -p build;
cp -R public         build/
cp -R migrations     build/
cp -R server         build/
cp -R config.js      build/
cp -R node_modules   build/
cp -R dev.sqlite3    build/
cp -R knexfile.js    build/
cp -R package.json   build/

