const { startLocalServer } = require('./src/server');

startLocalServer()
  .then(({ url }) => {
    console.log(`OpenClaw 本地数据服务已启动: ${url}`);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
