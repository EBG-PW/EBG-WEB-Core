const db = require('pg');
const { SQLError } = require('@lib/errors');

const pool = new db.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

pool.query(`CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text UNIQUE,
  email text UNIQUE,
  password text,
  group text DEFAULT 'user',
  name text,
  sirname text,
  street text,
  street_number text,
  zip text,
  city text,
  country text,
  public boolean DEFAULT false,
  twofa_secret text,
  twofa_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  twofa_token text,
  time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`, (err, result) => {
  if (err) { process.log.error(`Table-gen: Error users: ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS users_settings (
  user_id integer,
  design text,
  language text,
  profile_picture text,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`, (err, result) => {
  if (err) { process.log.error(`Table-gen: Error users_permissions ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS users_accounts (
  user_id integer,
  github text,
  discord text,
  telegram text,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`, (err, result) => {
  if (err) { process.log.error(`Table-gen: Error users_permissions ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS users_apps (
  user_id integer,
  app text,
  time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`, (err, result) => {
  if (err) { process.log.error(`Table-gen: Error users_permissions ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS users_permissions (
  user_id integer,
  permission text,
  read boolean,
  write boolean,
  time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`, (err, result) => {
  if (err) { process.log.error(`Table-gen: Error users_permissions ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS webtokens (
  user_id integer,
  username text,
  token text PRIMARY KEY,
  browser text,
  language text,
  design text,
  time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`, (err, result) => {
  if (err) { process.log.error(`Table-gen: Error webtokens ${err}`) }
});

/* --- --- --- --- --- Querys --- --- --- --- --- */

/* --- --- --- Users --- --- --- */

/**
 * Insert a new User
 * @param {String} user_id 
 * @param {String} password 
 * @param {String} language 
 * @param {String} twofa_secret 
 * @returns 
 */
const UsersCreate = (user_id, password, language, twofa_secret = null) => {
  return new Promise((resolve, reject) => {
    pool.query(`INSERT INTO users (user_id, password, language, twofa_secret) VALUES ($1, $2, $3, $4)`, [uuser_idser, password, language, twofa_secret], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result)
    })
  })
}

/**
 * Get User Data
 * @param {Number} user_id 
 * @returns {Promise<Array>}
 */
const UsersGet = (user) => {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT * FROM users WHERE user_id = $1`, [user_id], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result.rows)
    })
  })
}

/**
 * twofa_time is used to check if the user had a recent login
 * @param {Number} user_id 
 * @param {String} twofa_token
 * @param {Number} time 
 * @returns 
 */
const Updatetwofa_time = (user, twofa_token, time = null) => {
  return new Promise((resolve, reject) => {
    pool.query(`UPDATE users SET twofa_time = $1, twofa_token = $2 WHERE user_id = $3`, [time, twofa_token, user_id], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result)
    })
  })
}

/* --- --- --- User Permissions --- --- --- */

/**
 * Insert or Update User Permissions
 * @param {Number} user_id 
 * @param {String} permission 
 * @param {Boolean} read 
 * @param {Boolean} write 
 * @returns 
 */
const AddPermissionToUser = (user_id, permission, read, write) => {
  return new Promise((resolve, reject) => {
    pool.query(`INSERT INTO users_permissions (user_id, permission, read, write) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, permission) DO UPDATE SET read = $3, write = $4`, [user, permission, read, write], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result)
    })
  })
}

/**
 * This function is used to get a list of permissions of a user
 * @param {Number} user_id
 * @returns {Promise}
 */
const GetPermissionFromUser = function (user_id) {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT permission, read, write FROM users_permissions WHERE user_id = $1`, [
      username
    ], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result);
    });
  });
}

/**
 * This function is used to remove a permission from a user
 * @param {String} user_id
 * @param {String} permission
 * @returns {Promise}
 */
const DelPermissionFromUser = function (user_id, permission) {
  return new Promise(function (resolve, reject) {
    pool.query(`DELETE FROM users_permissions WHERE user_id = $1 AND permission = $2`, [
      user_id, permission
    ], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result);
    });
  });
}

/**
 * This function is used to update r/w of a permission of a user
 * @param {String} user_id
 * @param {String} permission
 * @param {boolean} read
 * @param {boolean} write
 * @returns {Promise}
 */
const UpdatePermissionFromUser = function (user_id, permission, read, write) {
  return new Promise(function (resolve, reject) {
    pool.query(`UPDATE users_permissions SET read = $3, write = $4 WHERE user_id = $1 AND permission = $2`, [
      user_id, permission, read, write
    ], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result);
    });
  });
}

/* --- --- --- Webtokens --- --- --- */

/**
 * Insert a new Webtoken
 * @param {Number} user_id
 * @param {String} username 
 * @param {String} token 
 * @param {String} browser 
 * @param {String} language
 * @param {String} design
 * @returns 
 */
const WebtokensCreate = (username, token, browser, language, design) => {
  return new Promise((resolve, reject) => {
    pool.query(`INSERT INTO webtokens (user_id, username, token, browser, language, design) VALUES ($1, $2, $3, $4, $5, $6)`, [user_id, username, token, browser, language, design], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result)
    })
  })
}

/**
 * Get data from a Webtoken
 * @param {String} token 
 * @returns 
 */
const WebtokensGet = (token) => {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT * FROM webtokens WHERE token = $1`, [token], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result.rows)
    })
  })
}

/**
 * Remove a Webtoken from the database
 * @param {String} token 
 * @returns 
 */
const WebtokensDelete = (token) => {
  return new Promise((resolve, reject) => {
    pool.query(`DELETE FROM webtokens WHERE token = $1`, [token], (err, result) => {
      if (err) { reject(new SQLError(err)) }
      resolve(result)
    })
  })
}

/* --- --- --- Exports --- --- --- */

const user = {
  create: UsersCreate,
  get: UsersGet,
  update: {
    twofa_time: Updatetwofa_time
  },
  permission: {
    add: AddPermissionToUser,
    get: GetPermissionFromUser,
    del: DelPermissionFromUser,
    update: UpdatePermissionFromUser
  }
}

const webtoken = {
  create: WebtokensCreate,
  get: WebtokensGet,
  delete: WebtokensDelete
}


module.exports = {
  user,
  webtoken
}