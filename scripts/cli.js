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



const path = require('path');

function showHelp() {
  console.log(`Usage: ${path.parse(process.argv[1]).base} [options] <filename>

  Parse a Swift input file and output as JSON.

  Options:

    --help, -h    Show help

    --type, -t    Set input file type.

                  Valid: mt940, mt942

                  Default: File extension or mt940
`);
}

function errorExit(e) {
  console.error(e);
  process.exit(1);
}

let argv = process.argv.slice(2);
let file = null;
let type = null;

function validateType(s) {
  if (['mt940','mt942'].includes(s)) {
    return s;
  }
  return undefined;
}

while(argv.length) {
  const arg = argv[0];
  switch (arg) {
  case '--help':
  case '-h':
    showHelp();
    process.exit();
    break;
  case '--type':
  case '-t':
    type = argv[1];
    argv = argv.slice(1);
    break;
  default:
    file = arg;
  }
  argv = argv.slice(1);
}

if (!file) {
  errorExit('Missing required arg: filename');
}

if (type && !validateType(type)) {
  errorExit(`Invalid type: ${type}`);
}

const suffix = file.split('.').pop().toLowerCase();
type = type || validateType(suffix) || 'mt940';

async function main() {
  const fs = require('fs');
  const parser = require('..');
  const data = fs.readFileSync(file, { encoding: 'utf8' });
  return parser.parse({ data, type });
}

main()
  .catch(errorExit)
  .then(x => JSON.stringify(x, null, 2))
  .then(console.log);
