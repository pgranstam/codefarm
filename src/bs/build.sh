#!/bin/bash -e

gitroot=$(git rev-parse --show-toplevel)
source $gitroot/src/bs/common.source

mkdir -p $build_dir

rm -rf $build_dir/image.tgz

docker build -t $tag .

# Extract image from local docker registry
docker save $tag | gzip > $build_dir/image.tgz
# Remove image from local docker registry
$gitroot/src/bs/unload.sh
