/*
 * @Author: doramart 
 * @Description install step_1
 * @Date: 2020-03-13 08:43:33 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-02 22:28:55
 */


const fs = require('fs');
const chalk = require('chalk');
const {
  red,
  green
} = chalk

const modifyFileByReplace = (targetPath, replaceKey, targetValue, auxiliaryKey = '') => {

  let targetConfig = fs.existsSync(targetPath);

  if (targetConfig) {

    for (const configKey of replaceKey) {

      let oldStr = '',
        configIndex;
      const fileData = fs.readFileSync(targetPath, 'utf8').split('\n');
      for (let i = 0; i < fileData.length; i++) {
        const str = fileData[i];

        if ((str.trim()).indexOf(configKey) == 0) {

          // 辅助字符串校验
          if (auxiliaryKey) {

            if ((str.trim()).indexOf(auxiliaryKey) > 0) {
              oldStr = str.trim();
              configIndex = i;
              break;
            }
            break;

          } else {
            oldStr = str.trim();
            configIndex = i;
            break;
          }

        }
      }

      if (oldStr) {
        let checkValue = (typeof targetValue === 'string' ? `"${targetValue}"` : targetValue);
        fileData.splice(configIndex, 1, `        ${configKey}: ${checkValue},`);
        fs.writeFileSync(targetPath, fileData.join('\n'), 'utf8');
      }

    }
  }

}


module.exports = (serverConfig) => {

  try {
    console.log(green(`begin custom config...`))
    const localPath = process.cwd() + '/' + serverConfig.name;
    let configfile = serverConfig.env == 'development' ? 'config.local.js' : 'config.prod.js'

    // 修改配置文件
    modifyFileByReplace(`${localPath}/config/config.default.js`, ['port'], Number(serverConfig.port));
    modifyFileByReplace(`${localPath}/config/${configfile}`, ["url"], serverConfig.mongdblink);
    modifyFileByReplace(`${localPath}/config/${configfile}`, ['server_path'], serverConfig.domain);
    modifyFileByReplace(`${localPath}/config/${configfile}`, ['server_api'], serverConfig.domain + '/api');
    if (serverConfig.mongodbBinPath) {
      modifyFileByReplace(`${localPath}/config/${configfile}`, ['binPath'], serverConfig.mongodbBinPath);
    }

    console.log(green(`config success`))
  } catch (error) {
    console.log(error.message);
  }
}