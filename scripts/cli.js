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

'use strict';

function showHelp() {
  console.log(`Usage: ${process.argv[1]} [options] <filename>

  Parse a Swift input file and output as JSON.

  Options:
    --help, -h    Show help
`);
}

function errorExit(e) {
  console.error(e);
  process.exit(1);
}

const argv = process.argv.slice(2);
let file = null;

argv.forEach(arg => {
  switch (arg) {
  case '--help':
  case '-h':
    showHelp();
    process.exit();
    break;
  default:
    file = arg;
    break;
  }
});

if (!file) {
  errorExit('Missing required arg: filename');
}

async function main() {
  const fs = require('fs');
  const Parser = require('../lib/parser');
  const parser = new Parser();
  const data = fs.readFileSync(file, { encoding: 'utf8' });
  return parser.parse(data);
}

main()
  .catch(errorExit)
  .then(x => JSON.stringify(x, null, 2))
  .then(console.log);
