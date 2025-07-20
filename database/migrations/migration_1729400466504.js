module.exports = {
    "id": 1729400466504,
    "name": "migration_1729400466504.js",
    "date": "2024-10-20T05:01:06.504Z",
    "up_instructions": [`CREATE TABLE IF NOT EXISTS netdata_monitoring (
            ip_address inet,
            hostname text,
            user_id integer,
            created_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            payed_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (ip_address, hostname, user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`],
    "down_instructions": [
        `DROP TABLE IF EXISTS netdata_monitoring;`
    ]
};