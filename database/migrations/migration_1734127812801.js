module.exports = {
    "id": 1734127812801,
    "name": "migration_1734127812801.js",
    "date": "2024-12-13T22:10:12.801Z",
    "up_instructions": [`ALTER TABLE webtokens
        ADD COLUMN uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
        ADD COLUMN country TEXT DEFAULT NULL;`],
    "down_instructions": [`ALTER TABLE webtokens
        DROP COLUMN uuid,
        DROP COLUMN country;`]
};