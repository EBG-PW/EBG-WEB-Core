module.exports = {
    "id": 1731201901859,
    "name": "migration_1731201901859.js",
    "date": "2024-11-10T01:25:01.859Z",
    "up_instructions": [`ALTER TABLE netdata_monitoring
            ADD COLUMN chart_hours SMALLINT,
            ADD COLUMN charts BIGINT;`],
    "down_instructions": [`ALTER TABLE netdata_monitoring
            DROP COLUMN chart_hours,
            DROP COLUMN charts;`]
};