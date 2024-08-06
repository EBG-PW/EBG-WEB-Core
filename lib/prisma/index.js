const db = require('pg');
const { bigIntReplacer } = require('@lib/utils');
const { groups } = require("@config/permissions.js");

/**
 * Generates an array of all team groups
 * @param {Object} groups_data 
 * @returns 
 */
const generateTeamArray = (groups_data) => {
    const teamArray = [];
    for (const groupName in groups_data) {
        if (groups_data[groupName].is_team) {
            teamArray.push(groupName);
        }
    }
    return teamArray;
}

const teamGroups = generateTeamArray(groups);

const pool = new db.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

const getPublicEventsQuery = async (page, limit) => {
    const offset = (page - 1) * limit;

    try {
        const res = await pool.query(
            `SELECT * FROM projectactivities
         WHERE visibility = 1 AND type = 1 AND date_end >= NOW()
         OFFSET $1 LIMIT $2`,
            [offset, limit]
        );

        return JSON.stringify(res.rows, bigIntReplacer);
    } catch (error) {
        console.log(error);
    }
}

const getPublicTeamQuery = async (page, limit, includes) => {
    const offset = (page - 1) * limit;
    const teamGroupsString = teamGroups.map(group => `'${group}'`).join(',');
  
    // Base query for users
    let baseQuery = `SELECT u.puuid, u.username, u.user_group`;
  
    // Additional fields to select
    const additionalSelects = [];
    const leftJoins = [];
    const groupByFields = ['u.puuid', 'u.username', 'u.user_group'];
  
    if (includes.includes('settings')) {
      additionalSelects.push('us.design', 'us.language');
      leftJoins.push('LEFT JOIN users_settings us ON u.id = us.user_id');
      groupByFields.push('us.design', 'us.language');
    }
  
    if (includes.includes('links')) {
      additionalSelects.push(`
        json_agg(json_build_object('platform', ul.platform, 'data_val', ul.data_val)) AS links
      `);
      leftJoins.push('LEFT JOIN users_links ul ON u.id = ul.user_id');
    }
  
    if (includes.includes('projectActivities')) {
      additionalSelects.push(`
        json_agg(json_build_object(
          'id', pa.id,
          'puuid', pa.puuid,
          'type', pa.type,
          'name', pa.name,
          'description', pa.description,
          'avatar_url', pa.avatar_url,
          'color', pa.color,
          'location_address', pa.location_address,
          'date_start', pa.date_start,
          'date_end', pa.date_end,
          'date_created', pa.date_created,
          'date_apply', pa.date_apply,
          'min_group', pa.min_group,
          'visibility', pa.visibility,
          'state', pa.state
        )) AS projectActivities
      `);
      leftJoins.push(`
        LEFT JOIN projectactivities pa ON u.id = pa.creator_user_id 
        AND pa.visibility = 1 AND pa.date_end >= NOW()
      `);
    }
  
    if (additionalSelects.length > 0) {
      baseQuery += `, ${additionalSelects.join(', ')}`;
    }
  
    baseQuery += `
      FROM users u
      ${leftJoins.join(' ')}
      WHERE u.public = true AND u.user_group IN (${teamGroupsString})
      GROUP BY ${groupByFields.join(', ')}
      OFFSET $1 LIMIT $2
    `;
  
    try {
      const res = await pool.query(baseQuery, [offset, limit]);
      return JSON.stringify(res.rows, bigIntReplacer);
    } catch (error) {
      console.log(error);
    }
  }

const getPublicProjectsQuery = async (page, limit) => {
    const offset = (page - 1) * limit;
  
    try {
      const res = await pool.query(
        `SELECT * FROM projectactivities
         WHERE visibility = 1 AND type = 2 AND date_end >= NOW()
         OFFSET $1 LIMIT $2`, 
         [offset, limit]
      );
  
      return JSON.stringify(res.rows, bigIntReplacer);
    } catch (error) {
      console.log(error);
    }
  }

const public = {
    getTeam: getPublicTeamQuery,
    getEvents: getPublicEventsQuery,
    getProjects: getPublicProjectsQuery,
  }
  
  module.exports = {
    public: public,
  };