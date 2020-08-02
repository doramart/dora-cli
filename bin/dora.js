#!/usr/bin/env node

const program = require('commander')

program
  .version(require('../package.json').version)
  .usage('<command> [options]')
  .command('create', 'generate a new project from DoraCMS')

program.parse(process.argv)