const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const outputPath = path.join(rootDir, 'src', 'assets', 'env.js');

const defaults = {
  SHIG_API_PREFIX: '/api',
  SHIG_RELAY_SERVICE: 'http://localhost:4443/live',
};

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return env;

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      env[key] = rawValue.replace(/^["']|["']$/g, '');

      return env;
    }, {});
}

const fileEnv = fs.existsSync(envPath)
  ? parseEnv(fs.readFileSync(envPath, 'utf8'))
  : {};

const env = {
  ...defaults,
  ...fileEnv,
  ...process.env,
};

const config = {
  apiPrefix: env.SHIG_API_PREFIX,
  relayService: env.SHIG_RELAY_SERVICE,
};

const output = `window.__SHIG_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`;

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, output);

console.log(`Generated ${path.relative(rootDir, outputPath)}`);
