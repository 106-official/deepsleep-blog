/**
 * 数据库层分发器。
 * 通过环境变量 DB_TYPE 选择实现：
 *   - "sqlite" （默认，本地开发）：better-sqlite3，文件库 ./community.db
 *   - "mysql"  （生产，腾讯云 SCF + TencentDB）：mysql2
 *
 * 两个驱动导出完全一致的异步接口，见下方 JSDoc。
 */

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let driver;
if (DB_TYPE === 'mysql') {
  driver = require('./db_mysql');
} else {
  driver = require('./db_sqlite');
}

module.exports = driver;

/**
 * @typedef {Object} UserRow
 * @property {number} id
 * @property {string} email
 * @property {string} passwordHash
 * @property {string} displayName
 * @property {string|null} avatarUrl
 * @property {string|null} bio
 * @property {string} createdAt
 */

/**
 * @typedef {Object} PostRow
 * @property {number} id
 * @property {string} title
 * @property {string} content        完整内容
 * @property {string} category
 * @property {string} authorName
 * @property {string|null} authorAvatar
 * @property {string} createdAt
 * @property {number} viewCount
 * @property {number} likeCount
 * @property {number} commentCount
 */

module.exports.initDb = driver.initDb;
module.exports.createUser = driver.createUser;
module.exports.getUserByEmail = driver.getUserByEmail;
module.exports.getUserById = driver.getUserById;
module.exports.updateUser = driver.updateUser;
module.exports.createPost = driver.createPost;
module.exports.listPosts = driver.listPosts;
