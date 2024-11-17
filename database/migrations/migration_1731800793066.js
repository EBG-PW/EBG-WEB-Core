module.exports = {
    "id": 1731800793066,
    "name": "migration_1731800793066.js",
    "date": "2024-11-16T23:46:33.066Z",
    "up_instructions": [
        `CREATE TABLE netdata_monitoring_new (
            id SERIAL PRIMARY KEY,
            ip_address INET NOT NULL,
            user_id INTEGER NOT NULL,
            hostname TEXT NOT NULL,
            chart_hours SMALLINT,
            charts BIGINT,
            created_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            payed_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (ip_address, user_id, hostname),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );`,
        `INSERT INTO netdata_monitoring_new (
            ip_address, user_id, hostname, chart_hours, charts, created_time, payed_until, time
        )
        SELECT 
            ip_address, user_id, hostname, chart_hours, charts, created_time, payed_until, time
        FROM 
            netdata_monitoring;`,
        `DROP TABLE netdata_monitoring;`,
        `ALTER TABLE netdata_monitoring_new RENAME TO netdata_monitoring;`
    ],
    "down_instructions": [
        `CREATE TABLE netdata_monitoring_old (
            ip_address INET,
            hostname TEXT,
            user_id INTEGER,
            chart_hours SMALLINT,
            charts BIGINT,
            created_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            payed_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (ip_address, hostname, user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );`,
        `INSERT INTO netdata_monitoring_old (
            ip_address, hostname, user_id, chart_hours, charts, created_time, payed_until, time
        )
        SELECT 
            ip_address, hostname, user_id, chart_hours, charts, created_time, payed_until, time
        FROM 
            netdata_monitoring;`,
        `DROP TABLE netdata_monitoring;`,
        `ALTER TABLE netdata_monitoring_old RENAME TO netdata_monitoring;`
    ]
};
