/*
 * @Author: doramart 
 * @Date: 2020-08-01 14:25:23 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-02 09:32:56
 */
'use strict';
const fs = require('fs-extra');
const download = require('download');
const decompress = require('decompress');

const getProxyAgent = require('../utils/get-proxy-agent');
const chalk = require('chalk');

const {
  green
} = chalk

module.exports = async (tarball, installPath) => {
  console.log(green("begin to download: " + tarball))
  const data = await download(tarball);
  console.log(green("download success"));

  fs.ensureDirSync(installPath);

  try {
    await decompress(data, installPath, {
      map: (file) => {
        file.path = file.path.replace('package/', '');
        return file;
      }
    });
  } catch (error) {
    // Clean up the install folder since the decompress failed
    fs.removeSync(installPath);
    throw error;
  }
}