// DB Migration Schema
// ID, Action, Name, Date
// Row Migration: Migration, Name, Date
// We Only apply migrations to the database and where not applied yet

require('dotenv').config();
process.env.APPLICATION = "DB Migration";
require('module-alias/register');
const { performance } = require('perf_hooks');
const { log } = require('@lib/logger');
const fs = require('fs');
const path = require('path');
const pg = require('pg');

// Add Start parameter(s)
const start_command = process.argv[2];
const start_parameter = process.argv[3];

const allowed_commands = ['init', 'create', 'list', 'apply'];
if (!allowed_commands.includes(start_command)) {
    log.error(`Please provide a valid command: ${allowed_commands.join(', ')}`);
    process.exit(100);
}

if ((start_command === 'until' || start_command === 'revert') && !start_parameter) {
    log.error(`Please provide a valid migration to migrate to.`);
    process.exit(101);
}

const migrationDir = path.join(__dirname, 'migrations');

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const get_db_migrations = async () => {
    const query = `SELECT * FROM _migration ORDER BY version ASC;`;
    let result
    try {
        result = await db.query(query);
    } catch (error) {
        return false;
    }

    return result.rows;
}

const write_db_migration = async (version) => {
    const query = `INSERT INTO _migration (version) VALUES (${version});`;
    try {
        await db.query(query);
    } catch (error) {
        return false;
    }

    return true;
}

const initMigrations = async () => {
    const query = `CREATE TABLE IF NOT EXISTS _migration (
        version bigserial PRIMARY KEY,
        time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`;

    try {
        await db.query(query);
    } catch (error) {
        return false;
    }
}

const createMigration = async () => {
    const date = new Date();
    const migrationName = `migration_${date.getTime()}.js`;
    const migrationFile = path.join(migrationDir, migrationName);

    const migration_template = {
        id: date.getTime(),
        name: migrationName,
        date: date.toISOString(),
        up_instructions: [],
        down_instructions: []
    };

    fs.writeFileSync(migrationFile, `module.exports = ${JSON.stringify(migration_template, null, 4)};`);

    log.system(`Created migration: ${migrationName}`);
    return true;
};

const listMigrations = async () => {
    const files = fs.readdirSync(migrationDir);

    const migrations = [];

    files.forEach(file => {
        if (file.endsWith('.js')) {
            const migration = require(path.join(migrationDir, file));
            migrations.push(migration);
        }
    });

    log.system(`Found ${migrations.length} migrations:`);
    migrations.forEach(migration => {
        log.system(`- ${migration.name} (${migration.date})`);
    });

    return true;
}

const applyMigration = async (start_migration) => {
    const files = fs.readdirSync(migrationDir);

    let migrations = [];

    files.forEach(file => {
        if (file.endsWith('.js')) {
            const migration = require(path.join(migrationDir, file));
            migrations.push(migration);
        }
    });

    migrations.sort((a, b) => a.id - b.id);

    // Filter out already applied migrations
    migrations = migrations.filter(migration => migration.id > start_migration);

    if (migrations.length === 0) {
        return 0;
    }

    let totalTime = 0;

    for (const migration of migrations) {
        if (migration.up_instructions.length > 0) {
            log.system(`Applying migration: ${migration.name}`);
            const startTime = performance.now();

            for (const instruction of migration.up_instructions) {
                try {
                    await db.query(instruction);
                } catch (error) {
                    log.error(`Failed to apply migration: ${migration.name}\nError: ${error}`);
                    return false;
                }
            }

            const endTime = performance.now();
            const migrationTime = (endTime - startTime) / 1000; // Convert to seconds
            totalTime += migrationTime;

            log.system(`Migration ${migration.name} completed in ${migrationTime.toFixed(2)} seconds`);
        }
    }

    log.system(`All migrations completed in ${totalTime.toFixed(2)} seconds`);

    log.system(`Applied ${migrations.length} migrations.`);

    // Return the last applied migration
    return migrations[migrations.length - 1].id;
}

(async () => {
    try {
        await db.connect();
        log.system(`Connected to database: ${process.env.DB_NAME}`);
    } catch (error) {
        log.error(`Failed to connect to database: ${process.env.DB_NAME}\nError: ${error}`);
    }

    try {
        let start_migration = await get_db_migrations();
        let last_apply_migration = 0;
        if (!start_migration) {
            await initMigrations();
            log.info(`Migration table created.`);
            start_migration = [];
        }

        if (start_migration.length === 0) {
            start_migration = 0;
        } else {
            start_migration = start_migration[start_migration.length - 1].version;
        }

        switch (start_command) {
            case 'create':
                await createMigration();
                break;
            case 'list':
                await listMigrations();
                break;
            case 'apply':
                last_apply_migration = await applyMigration(start_migration);
                break;
        }

        if (last_apply_migration > 0) {
            await write_db_migration(last_apply_migration);
        } else {
            log.warn(`No migrations applied.`);
        }

    } catch (error) {
        log.error(`Failed to create migration table.\nError: ${error}`);
        process.exit(2);
    }

    process.exit(0);

    /*
    const files = fs.readdirSync(migrationDir);

    const migrations = [];

    files.forEach(file => {
        if (file.endsWith('.js')) {
            const migration = require(path.join(migrationDir, file));
            migrations.push(migration);
        }
    });
    */

})();