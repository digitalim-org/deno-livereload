#!/bin/bash
deno test --import-map importmap.json --allow-net --allow-read=./livereload.min.js $@