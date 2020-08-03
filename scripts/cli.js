#!/usr/bin/env node

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
