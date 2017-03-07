#!/bin/bash -e

set +x

function printUsage() {
  echo "Usage: $0 [-C <cli_path>] <libs> or 'all'"
}

if [ $# -lt 1 ]; then
  echo "Error: Illegal number of arguments"
  printUsage
  exit 1
fi

# Extract optional CLI path
while getopts ":C:" opt; do
  case "$opt" in
    C) CLI=$OPTARG ;;
  esac
done
shift $(( OPTIND - 1 ))

CLIARG=""
if [ "${CLI}" != "" ]; then
  CLIARG="-C ${CLI}"
fi

targets=$@

gitroot=$(git rev-parse --show-toplevel)
source $gitroot/ci/common.source

if [ "${targets}" == "all" ]; then
  targets=${libs[@]}
else
  for target in ${targets[@]}; do
    if [[ " ${libs[*]} " != *" ${target} "* ]]; then
      echo "Error: Component must be any number of ${libs[*]} or 'all'"
      printUsage
      exit 1
    fi
  done
fi

for target in ${targets[@]}; do
  ${gitroot}/ci/lib-build.sh ${CLIARG} ${target} rel
done
