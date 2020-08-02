/*
 * @Author: doramart 
 * @Date: 2020-08-01 12:33:00 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-02 21:28:03
 */
const download = require('./download');
const request = require('./request');
const _ = require('lodash');
const shell = require('shelljs');
const os = require('os');
const chalk = require('chalk');
const config = require('./config')

const {
  red,
  green
} = chalk

const {
  API_URL,
  NPM_REGISTRY
} = require('../utils/urls');

const installApp = async (DOWNLOAD_DIR, projectInfo) => {


  let versionInfo = await request(API_URL + '/api/versionMaintenance/getList', {
    isPaging: "0"
  });

  if (!_.isEmpty(versionInfo) && versionInfo.length > 0) {
    tempObj = versionInfo[0];
    let file_url = tempObj.source;


    // 文件下载
    await download(file_url, DOWNLOAD_DIR);

    // 配置文件定制化
    config(projectInfo);

    // 开始安装
    const cdPath = `cd ${process.cwd()}/${DOWNLOAD_DIR}`;
    const set_env = os.type() == 'Windows_NT' ? `set NODE_ENV=${projectInfo.env}` : `export NODE_ENV=${projectInfo.env}`;
    const install_modules = `npm install --registry=${NPM_REGISTRY}`;
    const start_project = projectInfo.env ? `npm run dev` : `npm start`;

    console.log(green(`install npm modules...`))
    shell.exec(`${cdPath}&&${set_env}&&${install_modules}`);
    console.log(green(`install npm modules success!`))
    console.log(green(`start doracms...`))
    shell.exec(`${cdPath}&&${set_env}&&${start_project}`);
    console.log(green(`start doracms success!`))


  } else {
    throw new Error('install error');
  }



}

module.exports = installApp;