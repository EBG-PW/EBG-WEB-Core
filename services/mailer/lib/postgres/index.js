const db = require('pg');

const pool = new db.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

/**
 * Write a confirmation token to the database.
 * @param {Number} userId 
 * @param {Number} type 
 * @param {String} token 
 * @param {String} data 
 * @returns 
 */
const WriteConfirmationToken = (userId, type, token, data) => {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO confirmations (user_id, type, token, data) VALUES ($1, $2, $3, $4)', [userId, type, token, data], (err, res) => {
      if (err) { reject(err); }
      resolve(res);
    })
  })
}

/**
 * Get the email and username of a user by their id.
 * @param {Number} userId 
 * @returns {Object} - { email: String, username: String }
 */
const GetUserData = (userId) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT email, username FROM users WHERE id = $1', [userId], (err, res) => {
      if (err) { reject(err); }
      resolve(res.rows[0]);
    })
  })
}

module.exports = {
  WriteConfirmationToken,
  GetUserData
}