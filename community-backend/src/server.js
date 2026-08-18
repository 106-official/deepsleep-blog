// 本地运行入口：直接监听端口（便于本地联调 / 自托管）。
const app = require('./index');

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`[community-backend] 本地监听 http://localhost:${PORT}`);
});
