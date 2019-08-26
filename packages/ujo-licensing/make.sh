#!/bin/bash

function build_frontend {
    echo Building frontend...

    npm run build &&
    rm -rf ./server/static &&
    cp -R ./dist ./server/static
}

function build_backend {
    echo Building backend...

    # build the licensing class
    npm run build-lc &&
    mkdir -p build &&

    zip -x *.git* -x "node_modules/**" -x ".env" -r "./build/licensing-backend.zip" . &&

    echo Build complete.  Bundle saved to ./build/licensing-backend.zip
}

build_frontend && build_backend
