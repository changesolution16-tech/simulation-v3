const fs = require('fs');

console.log("=== Amplify Secrets Debug ===");
console.log("Total environment variables:", Object.keys(process.env).length);

// Show ALL environment variable names (for debugging)
const allEnvKeys = Object.keys(process.env);
console.log("All env var names:", allEnvKeys.join(', '));

// Check all environment variables that start with common secret prefixes
const envKeys = Object.keys(process.env).filter(key =>
  key.includes('SECRET') ||
  key.includes('DATABASE') ||
  key.includes('AWS') ||
  key.includes('NEXTAUTH') ||
  key.toLowerCase().includes('secret')
);

console.log("Found secret-related variables:", envKeys.length > 0 ? envKeys : "None found");

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

// Approach 3: Direct environment variables (all expected variables)
const directKeys = [
  'DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'AWS_S3_PUBLIC_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NODE_ENV',
  'DISABLE_NATIVE_SWC'
];

directKeys.forEach(key => {
  if (process.env[key] && !secrets[key]) {
    secrets[key] = process.env[key];
    console.log(`Found direct variable: ${key}`);
  }
});

// Approach 4: Check for any other custom-named variables
// Sometimes Amplify prefixes or modifies secret names
const systemVars = [
  'PATH', 'HOME', 'PWD', 'OLDPWD', 'SHELL', 'TERM', 'USER', 'LANG',
  'LC_ALL', 'TMPDIR', 'TMP', 'TEMP', 'NODE_ENV', 'CI', 'CONTINUOUS_INTEGRATION'
];

allEnvKeys.forEach(key => {
  // Skip system variables and npm variables
  if (
    key.startsWith('_') ||
    key.startsWith('npm_') ||
    key.startsWith('NODE_') ||
    systemVars.includes(key)
  ) {
    return;
  }

  // If this looks like a user-defined variable and we don't have it yet
  if (!secrets[key] && process.env[key]) {
    secrets[key] = process.env[key];
    console.log(`Found additional variable: ${key}`);
  }
});

// Check if we found any secrets
if (Object.keys(secrets).length === 0) {
  console.error("❌ Error: No secrets found in any format.");
  console.error("\nDiagnostic Information:");
  console.error("Total environment variables available:", Object.keys(process.env).length);
  console.error("\nNon-system environment variables:");
  const nonSystemVars = Object.keys(process.env).filter(key =>
    !key.startsWith('_') &&
    !key.startsWith('npm_') &&
    !['PATH', 'HOME', 'PWD', 'OLDPWD', 'SHELL', 'TERM'].includes(key)
  );
  console.error(nonSystemVars.join(', '));

  console.error("\n⚠️  Make sure you have:");
  console.error("1. Added your secrets in the Amplify Console (App settings > Environment variables)");
  console.error("2. Given the Amplify service role permission to access secrets");
  console.error("3. Named your secrets exactly as: DATABASE_URL, NEXTAUTH_SECRET, etc.");
  process.exit(1);
}

// Write to .env file
try {
  let envContent = '';

  for (const [key, value] of Object.entries(secrets)) {
    envContent += `${key}="${value}"\n`;
  }

  fs.writeFileSync('.env', envContent);

  console.log("\n✅ Successfully created .env file");
  console.log(`📝 Total variables: ${Object.keys(secrets).length}`);
  console.log("📋 Variables written:");
  Object.keys(secrets).forEach(key => {
    const value = secrets[key];
    const preview = value.length > 20 ? `${value.substring(0, 20)}...` : value;
    console.log(`   ${key} = ${preview}`);
  });

  // Verify critical variables
  const criticalVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingCritical = criticalVars.filter(v => !secrets[v]);

  if (missingCritical.length > 0) {
    console.log("\n⚠️  Warning: Missing critical variables:");
    missingCritical.forEach(v => console.log(`   - ${v}`));
    console.log("The build may fail without these variables.\n");
  } else {
    console.log("\n✅ All critical variables present\n");
  }

  console.log("=== Setup Complete ===\n");
} catch (err) {
  console.error("❌ Error writing .env file:", err);
  process.exit(1);
}
