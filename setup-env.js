const fs = require('fs');

console.log("=== Amplify Secrets Debug ===");

// Check all environment variables that start with common secret prefixes
const envKeys = Object.keys(process.env).filter(key =>
  key.includes('SECRET') ||
  key.includes('DATABASE') ||
  key.includes('AWS') ||
  key.includes('NEXTAUTH') ||
  key.toLowerCase().includes('secret')
);

console.log("Found environment variables:", envKeys.length > 0 ? envKeys : "None found");

// Try multiple approaches for Amplify Gen 2
let secrets = {};

// Approach 1: Check for secrets as JSON string
if (process.env.secrets) {
  console.log("Found 'secrets' env var");
  try {
    secrets = JSON.parse(process.env.secrets);
    console.log("Successfully parsed secrets JSON");
  } catch (err) {
    console.error("Error parsing secrets JSON:", err.message);
  }
}

// Approach 2: Check for AWS_APP_* variables (Amplify Gen 2 pattern)
Object.keys(process.env).forEach(key => {
  if (key.startsWith('AWS_APP_')) {
    const secretKey = key.replace('AWS_APP_', '');
    secrets[secretKey] = process.env[key];
    console.log(`Found AWS_APP_ variable: ${secretKey}`);
  }
});

// Approach 3: Direct environment variables (fallback)
const directKeys = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME'
];

directKeys.forEach(key => {
  if (process.env[key] && !secrets[key]) {
    secrets[key] = process.env[key];
    console.log(`Found direct variable: ${key}`);
  }
});

// Check if we found any secrets
if (Object.keys(secrets).length === 0) {
  console.error("Error: No secrets found in any format.");
  console.error("Available environment variables:");
  console.error(Object.keys(process.env).slice(0, 20).join(', '));
  process.exit(1);
}

// Write to .env file
try {
  let envContent = '';

  for (const [key, value] of Object.entries(secrets)) {
    envContent += `${key}="${value}"\n`;
  }

  fs.writeFileSync('.env', envContent);
  console.log(`Successfully created .env file with ${Object.keys(secrets).length} variables`);
  console.log("Variables written:", Object.keys(secrets).join(', '));
} catch (err) {
  console.error("Error writing .env file:", err);
  process.exit(1);
}
