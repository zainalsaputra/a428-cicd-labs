#!/usr/bin/env sh

set -eu

echo 'Running React test suite in CI mode.'
set -x
CI=true npm test -- --watchAll=false
