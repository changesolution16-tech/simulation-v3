const fs = require('fs');

console.log("=== Amplify Secrets Debug ===");

// Check if we're running in Amplify
const isAmplify = process.env.AWS_APP_ID || process.env._AMPLIFY_BUILD || process.env.AWS_BRANCH;
console.log("Running in Amplify:", isAmplify ? 'Yes' : 'No');

if (!isAmplify) {
  console.log("Not running in Amplify environment. Skipping env setup.");
  console.log("Using existing .env file for local development.\n");
  process.exit(0);
}

console.log("Total environment variables:", Object.keys(process.env).length);

// Read the local .env file to determine which variables we need
let expectedKeys = [];
try {
  if (fs.existsSync('.env')) {
    const envFileContent = fs.readFileSync('.env', 'utf8');
    // Parse variable names from .env file
    expectedKeys = envFileContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'))
      .map(line => {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    console.log(`Found ${expectedKeys.length} variables in local .env file:`, expectedKeys.join(', '));
  } else {
    console.log("No local .env file found, using default variable list");
    // Fallback to a default list if no .env exists
    expectedKeys = [
      'DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'NEXTAUTH_SECRET', 'NEXTAUTH_URL',
      'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
      'AWS_S3_BUCKET_NAME', 'AWS_S3_PUBLIC_URL',
      'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NODE_ENV', 'DISABLE_NATIVE_SWC'
    ];
  }
} catch (err) {
  console.error("Error reading .env file:", err.message);
  process.exit(1);
}

// Show ALL environment variable names (for debugging)
const allEnvKeys = Object.keys(process.env);
console.log("Total Amplify env variables:", allEnvKeys.length);

// Try multiple approaches to find our expected variables
let secrets = {};

// Approach 1: Check for secrets as JSON string
if (process.env.secrets) {
  console.log("Found 'secrets' env var");
  try {
    const parsed = JSON.parse(process.env.secrets);
    // Only take expected keys
    expectedKeys.forEach(key => {
      if (parsed[key]) {
        secrets[key] = parsed[key];
        console.log(`Found in secrets JSON: ${key}`);
      }
    });
  } catch (err) {
    console.error("Error parsing secrets JSON:", err.message);
  }
}

// Approach 2: Check for AWS_APP_* variables (Amplify Gen 2 pattern)
expectedKeys.forEach(key => {
  const amplifyKey = `AWS_APP_${key}`;
  if (process.env[amplifyKey] && !secrets[key]) {
    secrets[key] = process.env[amplifyKey];
    console.log(`Found AWS_APP_ variable: ${key}`);
  }
});

// Approach 3: Direct environment variables
expectedKeys.forEach(key => {
  if (process.env[key] && !secrets[key]) {
    secrets[key] = process.env[key];
    console.log(`Found direct variable: ${key}`);
  }
});

// Check if we found any secrets
if (Object.keys(secrets).length === 0) {
  console.error("❌ Error: No secrets found in any format.");
  console.error("\nDiagnostic Information:");
  console.error("Expected variables:", expectedKeys.join(', '));
  console.error("Total environment variables available:", Object.keys(process.env).length);

  console.error("\n⚠️  Make sure you have:");
  console.error("1. Added your secrets in the Amplify Console (App settings > Environment variables)");
  console.error("2. Given the Amplify service role permission to access secrets");
  console.error("3. Named your secrets exactly as defined in .env file");
  process.exit(1);
}

// Write to .env file (only the variables we found)
try {
  let envContent = '';

  for (const [key, value] of Object.entries(secrets)) {
    envContent += `${key}="${value}"\n`;
  }

  fs.writeFileSync('.env', envContent);

  console.log("\n✅ Successfully created .env file");
  console.log(`📝 Variables written: ${Object.keys(secrets).length} of ${expectedKeys.length} expected`);
  console.log("📋 Variables found:");
  Object.keys(secrets).forEach(key => {
    const value = secrets[key];
    const preview = value.length > 20 ? `${value.substring(0, 20)}...` : value;
    console.log(`   ✓ ${key} = ${preview}`);
  });

  // Show missing variables
  const missingVars = expectedKeys.filter(key => !secrets[key]);
  if (missingVars.length > 0) {
    console.log("\n⚠️  Warning: Missing variables (will use local .env values):");
    missingVars.forEach(v => console.log(`   - ${v}`));
  }

  // Verify critical variables
  const criticalVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingCritical = criticalVars.filter(v => !secrets[v]);

  if (missingCritical.length > 0) {
    console.log("\n⚠️  Warning: Missing CRITICAL variables:");
    missingCritical.forEach(v => console.log(`   - ${v}`));
    console.log("The build may fail without these variables.");
    console.log("Make sure these are set in Amplify Console > Environment variables\n");
  } else {
    console.log("\n✅ All critical variables present");
  }

  console.log("\n=== Setup Complete ===\n");
} catch (err) {
  console.error("❌ Error writing .env file:", err);
  process.exit(1);
}
