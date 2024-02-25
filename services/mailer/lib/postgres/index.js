const db = require('pg');

const pool = new db.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

/**
 * @typedef {Object} UserObject
 * @property {string} email - Email of the user
 * @property {string} username - Username of the user
 * @property {string} language - Language of the user
 */

/**
 * Get the email and username of a user by their id.
 * @param {Number} userId 
 * @returns {UserObject}
 */
const GetUserData = (userId) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT email, username, language FROM users JOIN users_settings ON users.id = users_settings.user_id WHERE id = $1', [userId], (err, res) => {
      if (err) { reject(err); }
      resolve(res.rows[0]);
    })
  })
}

module.exports = {
  GetUserData
}