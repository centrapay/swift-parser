#!/usr/bin/env node

'use strict';

function errorExit(e) {
  console.error(e);
  process.exit(1);
}

async function main() {
  const ref = process.argv[2];
  const tag = ref.split('/').pop();
  const versionRegex = /^v([\d]+\.[\d]+\.[\d]+)$/;
  const match = versionRegex.exec(tag);
  if (!match) {
    throw Error(`Ref does not match version pattern (vX.Y.Z): ${ref}`);
  }
  const tagVersion = match[1];
  const packageVersion = require('../package').version;
  if (tagVersion !== packageVersion) {
    throw Error(`Ref does not match package version (${packageVersion}): ${ref}`);
  }
}

main()
  .catch(errorExit)
  .then(() => console.log('OK'));
