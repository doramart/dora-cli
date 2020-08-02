/*
 * @Author: doramart 
 * @Date: 2020-08-01 12:25:14 
 * @Last Modified by:   doramart 
 * @Last Modified time: 2020-08-01 12:25:14 
 */
const Axios = require("axios");
const _ = require('lodash');

module.exports = async (url, params = {}, method = 'get') => {
  let responseData;

  let targetUrl = url;

  if (method === 'get') {
    responseData = await Axios.get(targetUrl, {
      params
    })
  } else if (method === 'post') {
    responseData = await Axios.post(targetUrl, params)
  }

  if (responseData && responseData.status == '200' && !_.isEmpty(responseData.data) && responseData.data.status == 200) {

    return responseData.data.data;

  } else {
    throw new Error(responseData.data.message);
  }
}