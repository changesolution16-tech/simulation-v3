const fs = require('fs');

// Amplify Gen 2 provides all secrets in a single JSON string named 'secrets'
const secretsJson = process.env.secrets;

if (!secretsJson) {
  console.error("Error: No secrets found. Check your Amplify Service Role permissions.");
  process.exit(1);
}

try {
  const secrets = JSON.parse(secretsJson);
  let envContent = '';

  // Loop through all secrets and format them for the .env file
  for (const [key, value] of Object.entries(secrets)) {
    envContent += `${key}="${value}"\n`;
  }

  fs.writeFileSync('.env', envContent);
  console.log("Successfully created .env file from Amplify Secrets.");
} catch (err) {
  console.error("Error parsing secrets JSON:", err);
  process.exit(1);
}
