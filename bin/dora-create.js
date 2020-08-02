#!/usr/bin/env node

/*
 * @Author: doramart 
 * @Date: 2020-08-01 11:29:11 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-02 22:26:58
 */

var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var program = require('commander')
var readline = require('readline')
var util = require('util')
var shell = require('shelljs')

var MODE_0666 = parseInt('0666', 8)
var MODE_0755 = parseInt('0755', 8)
var TEMPLATE_DIR = path.join(__dirname, '..', 'templates')
const installApp = require('../lib/commands/install')
const askPro = require('../lib/commands/ask');
const generate = require('../lib/utils/generate')
const chalk = require('chalk');
const {
  gray,
  green
} = chalk;
var _exit = process.exit
let installState = false;
// Re-assign process.exit because of commander
// TODO: Switch to a different command framework
process.exit = exit

// CLI

around(program, 'optionMissingArgument', function (fn, args) {
  program.outputHelp()
  fn.apply(this, args)
  return {
    args: [],
    unknown: []
  }
})

before(program, 'outputHelp', function () {
  // track if help was shown for unknown option
  this._helpShown = true
})

before(program, 'unknownOption', function () {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp()
  }
})

program
  .usage('[name]')
  .option('-f, --force', 'force on non-empty directory')
  .parse(process.argv)

if (!exit.exited) {
  main()
}

/**
 * Help.
 */

program.on('--help', () => {
  console.log('  Examples:')
  console.log()
  console.log(gray('    # create a new project with doracms'))
  console.log('    $ dora create yourproject')
  console.log()
  console.log(gray('    # you can get more documents from here:'))
  console.log(chalk.green('    https://www.doracms.com'))
  console.log()
  console.log(gray('    # some params of create project'))
  console.log(green("    ?Project name: ") + gray("[必填]项目名称，英文不含空格"))
  console.log(green("    ?Website(ip or domain): ") + gray("[[非必填，默认 http://127.0.0.1:8080 ]网站访问域名或IP+端口号，需要带http/https,如 https://www.html-js.cn, http://120.25.150.169:8080"))
  console.log(green("    ?env: ") + gray("[非必填，默认 development ]服务器运行环境"))
  console.log(green("    ?Server port: ") + gray("[非必填，默认 8080 ]DoraCMS 启动默认端口号，website 中如果也有端口号，那么理论上这两个端口号是相同的"))
  console.log(green("    ?Mongodb url: ") + gray("[非必填，默认 mongodb://127.0.0.1:27017/doracms2 ] mongodb 连接字符串，如果带密码，eg. mongodb://username:password@127.0.0.1:27017/doracms2"))
  console.log(green("    ?Mongodb bin path: ") + gray("[非必填，默认为空]Mongodb bin目录路径，注意结尾必须带 / ，windows 环境下路径中 \\ 必须改为 / 如 C:/mongodb/mongodb/bin/"))
})

/**
 * Help.
 */

function help() {
  program.parse(process.argv)
  if (program.args.length < 1) return program.help()
}
help()

/**
 * Install an around function; AOP.
 */

function around(obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) args[i] = arguments[i]
    return fn.call(this, old, args)
  }
}

/**
 * Install a before function; AOP.
 */

function before(obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    fn.call(this)
    old.apply(this, arguments)
  }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm(msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(msg, function (input) {
    rl.close()
    callback(/^y|yes|ok|true$/i.test(input))
  })
}


/**
 * Create application at the given directory.
 *
 * @param {string} name
 * @param {string} dir
 */

async function createApplication(name, dir) {


  let prjInfo = {};
  if (!installState) {
    prjInfo = await askPro.getProjectInfo(name)
  } else {
    prjInfo = {}
  }

  if (fs.existsSync(process.cwd() + '/' + dir)) {
    // shell.rm('-rf', process.cwd() + '/' + dir);
  }

  console.log()

  if (dir !== '.') {
    mkdir(dir, '.')
  }

  installApp(dir, prjInfo);

  var prompt = launchedFromCmd() ? '>' : '$'


  if (launchedFromCmd()) {
    console.log('     %s SET DEBUG=%s:* & npm start', prompt, name)
  } else {
    console.log('     %s DEBUG=%s:* npm start', prompt, name)
  }

  console.log()
}

/**
 * Create an app name from a directory path, fitting npm naming requirements.
 *
 * @param {String} pathName
 */

function createAppName(pathName) {
  return path.basename(pathName)
    .replace(/[^A-Za-z0-9.-]+/g, '-')
    .replace(/^[-_.]+|-+$/g, '')
    .toLowerCase()
}

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 * @param {Function} fn
 */

function emptyDirectory(dir, fn) {
  fs.readdir(dir, function (err, files) {
    if (err && err.code !== 'ENOENT') throw err
    fn(!files || !files.length)
  })
}

/**
 * Graceful exit for async STDIO
 */

function exit(code) {

  function done() {
    if (!(draining--)) _exit(code)
  }

  var draining = 0
  var streams = [process.stdout, process.stderr]

  exit.exited = true

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1
    stream.write('', done)
  })

  done()
}

/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd() {
  return process.platform === 'win32' &&
    process.env._ === undefined
}


/**
 * Main program.
 */

function main() {
  // Path
  var destinationPath = program.args.shift() || '.'

  // App name
  var appName = createAppName(path.resolve(destinationPath)) || 'hello-world'

  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || program.force) {
      createApplication(appName, destinationPath)
      console.log('hello doracms!')
    } else {
      confirm('destination is not empty, continue? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy()
          installState = true;
          createApplication(appName, destinationPath, )
        } else {
          console.error('aborting')
          exit(1)
        }
      })
    }
  })
}

/**
 * Make the given dir relative to base.
 *
 * @param {string} base
 * @param {string} dir
 */

function mkdir(base, dir) {
  var loc = path.join(base, dir)

  console.log('   \x1b[36mcreate\x1b[0m : ' + loc + path.sep)
  mkdirp.sync(loc, MODE_0755)
}