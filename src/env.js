const path = require('path');

// Load KEY=value lines from a .env file into process.env, if the file exists.
// Variables already set in the shell win over the file.
function loadEnv(file = path.join(process.cwd(), '.env')) {
  try {
    process.loadEnvFile(file);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

module.exports = { loadEnv };
