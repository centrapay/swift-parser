#!/usr/bin/env node

/*
*  Copyright 2020 Centrapay and other contributors
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*  http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/



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
