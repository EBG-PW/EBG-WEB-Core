module.exports = {
    "id": 1734313322314,
    "name": "migration_1734313322314.js",
    "date": "2024-12-16T01:42:02.314Z",
    "up_instructions": [
        `
        CREATE TABLE user_membership (
            user_id INTEGER PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            postalcode VARCHAR(255) NOT NULL,
            city VARCHAR(255) NOT NULL,
            country VARCHAR(255) NOT NULL,
            phonenumber VARCHAR(255) NOT NULL,
            occupation VARCHAR(255) NOT NULL,
            knowlage TEXT[] NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            legal_agree BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `
    ],
    "down_instructions": [
        `
        DROP TABLE IF EXISTS user_membership;
        `
    ]
};
