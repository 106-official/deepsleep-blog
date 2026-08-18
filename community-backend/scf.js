// 腾讯云 SCF 入口：用 @vendia/serverless-express 把 Express app 适配为云函数。
// 在 SCF 控制台绑定 API 网关后，所有路径的请求都会转发到这里。
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./src/index');

let server;

exports.main_handler = (event, context) => {
  server = server || serverlessExpress({ app });
  return server(event, context);
};
