const { Pool, types } = require('pg');

types.setTypeParser(1184, (stringValue) => stringValue); // for 'timestamptz' type

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})


// Debug SQL Query
const originalQuery = pool.query.bind(pool);

pool.query = async (...args) => {
  const debugMode = parseInt(process.env.LOG_LEVEL, 10) === 4;

  const start = debugMode ? process.hrtime.bigint() : null;

  try {
    const result = await originalQuery(...args);

    if (debugMode) {
      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Number(durationNs) / 1_000_000;
      process.log.debug(`[SQL] Duration: ${durationMs.toFixed(2)} ms | Query: ${formatQuery(args)}`);
    }

    return result;
  } catch (err) {
    if (debugMode && start !== null) {
      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Number(durationNs) / 1_000_000;
      process.log.debug(`[SQL] ERROR after ${durationMs.toFixed(2)} ms | Query: ${formatQuery(args)}`);
    }
    throw err;
  }
};

function formatQuery(args) {
  if (typeof args[0] === 'string') {
    const text = args[0];
    const values = args[1] || [];
    return `${text} | values: ${JSON.stringify(values)}`;
  } else if (typeof args[0] === 'object' && args[0].text) {
    const { text, values = [] } = args[0];
    return `${text} | values: ${JSON.stringify(values)}`;
  }
  return 'Unknown query format';
}

// Function to log current pool statistics
const logPoolStats = () => {
  process.log.debug(`Total clients: ${pool.totalCount}/${pool.options.max} | Idle clients: ${pool.idleCount} | Waiting clients: ${pool.waitingCount}`);
}

// Periodically log pool statistics
if (parseInt(process.env.LOG_LEVEL, 10) === 4) setInterval(logPoolStats, 5000); // Log every 5 seconds

module.exports = pool;