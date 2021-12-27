#!/bin/bash
deno test --import-map importmap.json --allow-net --allow-env=CI $@