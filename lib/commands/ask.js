const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const validate = require('validate-npm-package-name');
const {
  execSync
} = require('child_process');
const inquirer = require('inquirer');
const TEMPLATE = require('../constants');

const {
  red,
  green
} = chalk


/**
 * 服务器配置信息
 * @param  {String} mongodbBinPath [[必填]Mongodb bin目录路径，注意结尾必须带 / ，windows 环境下路径中 \ 必须改为 / 如 C:/mongodb/mongodb/bin/ ] * @param  {String} dbIP           [[必填]Mongodb 数据库IP，默认 127.0.0.1 默认不用更改]
 * @param  {String} domain         [[必填]网站访问域名或IP+端口号，需要带http/https,如 https://www.html-js.cn, http://120.25.150.169:8080]
 * @param  {String} port           [[必填]DoraCMS 启动默认端口号，domain 中如果也有端口号，那么理论上这两个端口号是相同的]
 * @param  {String} tbAgent        [[必填]NPM安装包是否启用淘宝代理 1：启用 0：不启用，建议启用]
 */

module.exports = {

  getQuestion(name) {

    const author = this.getGitAuthor()
    const choices = Object.keys(TEMPLATE).map(
      (name) => ({
        name,
        value: TEMPLATE[name]
      })
    )

    return [{
        type: 'input',
        name: 'name',
        message: 'Project name',
        default: name,
        filter(value) {
          return value.trim()
        }
      },
      {
        type: 'list',
        name: 'env',
        message: 'Please select environment',
        choices,
        default: choices[0]
      },
      {
        type: 'input',
        name: 'domain',
        message: 'Website(ip or domain)',
        default: 'http://127.0.0.1:8080',
        filter(value) {
          return value.trim()
        }
      },
      {
        type: 'input',
        name: 'port',
        message: 'Server port',
        default: '8080',
        filter(value) {
          return value.trim()
        }
      },
      {
        type: 'input',
        name: 'mongdblink',
        message: 'Mongodb url',
        default: 'mongodb://127.0.0.1:27017/doracms2',
        filter(value) {
          return value.trim()
        }
      },
      {
        type: 'input',
        name: 'mongodbBinPath',
        message: 'Mongodb bin path',
        default: '',
        filter(value) {
          return value.trim()
        }
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author',
        default: `${author.name} <${author.email}>`,
        filter(value) {
          return value.trim()
        }
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Is this ok?',
        default: true
      }
    ]
  },
  isSafeDirectory(projectName) {
    const projectPath = path.resolve(projectName)

    const validFiles = ['package.json', '.git']

    const conflicts = fs
      .readdirSync(projectPath)
      .filter((file) => !validFiles.includes(file))

    if (conflicts.length > 0) {
      console.log(
        `The directory ${green(name)} contains files that could conflict:`
      )
      console.log()
      for (const file of conflicts) {
        console.log(`  ${red(file)}`)
      }
      console.log()

      return false
    }

    return true
  },

  isValidPackageName(name) {
    const {
      validForNewPackages
    } = validate(name)

    if (!validForNewPackages) {
      console.error(
        `Could not create a project called ${red(
          `"${name}"`
        )} because of npm naming restrictions:`
      )

      return false
    }

    return true
  },

  createAppDir(name) {
    const root = path.resolve(name)

    fs.ensureDirSync(root)
  },

  getPackageManager() {
    try {
      execSync('yarnpkg --version', {
        stdio: 'ignore'
      })
      return 'yarn'
    } catch (e) {
      return 'npm'
    }
  },

  getGitAuthor() {
    let name = ''
    let email = ''

    try {
      name = execSync('git config --get user.name')
        .toString()
        .trim()
      email = execSync('git config --get user.email')
        .toString()
        .trim()
    } catch (e) {}

    return {
      name,
      email
    }
  },



  async getProjectInfo(name) {
    const question = this.getQuestion(name)
    const answers = await inquirer.prompt(question)
    return answers
  }

}