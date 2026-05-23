#!/usr/bin/env node

// Production Deployment Checklist
// Run this before deploying to production

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkEnvVar(name, required = true) {
  const value = process.env[name];
  const exists = !!value;
  const isSecure = value && value.length > 10 && !value.includes('test') && !value.includes('example');

  if (required) {
    if (!exists) {
      console.log(`❌ MISSING: ${name} (required)`);
      return false;
    }
    if (!isSecure) {
      console.log(`⚠️  WEAK: ${name} (may be test/example value)`);
      return false;
    }
    console.log(`✅ OK: ${name}`);
    return true;
  }

  if (exists) {
    console.log(`✅ OK: ${name} (optional, present)`);
  } else {
    console.log(`⚠️  MISSING: ${name} (optional)`);
  }
  return true;
}

async function runDeploymentChecklist() {
  console.log('🚀 Production Deployment Checklist\n');

  let allGood = true;

  // Load .env file if it exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('📄 Loading environment variables from .env file...');
    const dotenv = await import('dotenv');
    dotenv.config({ path: envPath });
  }

  console.log('\n🔐 Security & Authentication\n');

  allGood = checkEnvVar('STRIPE_SECRET_KEY') && allGood;
  allGood = checkEnvVar('STRIPE_WEBHOOK_SECRET') && allGood;
  allGood = checkEnvVar('SESSION_SECRET') && allGood;
  allGood = checkEnvVar('DATABASE_URL') && allGood;
  allGood = checkEnvVar('REPLIT_DOMAINS') && allGood;
  allGood = checkEnvVar('REPL_ID') && allGood;

  console.log('\n💳 Stripe Configuration\n');

  allGood = checkEnvVar('SMALL_PRICE_ID') && allGood;
  allGood = checkEnvVar('MEDIUM_PRICE_ID') && allGood;
  allGood = checkEnvVar('LARGE_PRICE_ID') && allGood;
  allGood = checkEnvVar('MEGA_PRICE_ID') && allGood;
  allGood = checkEnvVar('PLAYER_ROOKIE_MONTHLY_PRICE_ID') && allGood;
  allGood = checkEnvVar('PLAYER_STANDARD_MONTHLY_PRICE_ID') && allGood;
  allGood = checkEnvVar('PLAYER_PREMIUM_MONTHLY_PRICE_ID') && allGood;

  console.log('\n🗄️  Database Configuration\n');

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const hasSSL = dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=1');
    if (hasSSL) {
      console.log('✅ OK: Database URL includes SSL');
    } else {
      console.log('⚠️  WARNING: Database URL may not include SSL');
    }
  }

  console.log('\n🏗️  Build & Deployment\n');

  // Check if build files exist.
  const rootDir = __dirname;
  const serverBuildCandidates = [
    path.join(rootDir, 'dist', 'index.js'),
    path.join(rootDir, 'server', 'dist', 'index.js'),
  ];
  const clientBuildCandidates = [
    path.join(rootDir, 'dist', 'public', 'index.html'),
    path.join(rootDir, 'client', 'dist', 'index.html'),
  ];

  const serverBuildPath = serverBuildCandidates.find((candidate) => fs.existsSync(candidate));
  const clientBuildPath = clientBuildCandidates.find((candidate) => fs.existsSync(candidate));

  if (serverBuildPath) {
    console.log(`✅ OK: Server build exists (${serverBuildPath})`);
  } else {
    console.log('❌ MISSING: Server build (run npm run build)');
    allGood = false;
  }

  if (clientBuildPath) {
    console.log(`✅ OK: Client build exists (${clientBuildPath})`);
  } else {
    console.log('❌ MISSING: Client build (run npm run build)');
    allGood = false;
  }

  console.log('\n📋 Final Status\n');

  if (allGood) {
    console.log('🎉 All checks passed! Ready for production deployment.');
    console.log('\nNext steps:');
    console.log('1. Run: npm run db:push (to sync database schema)');
    console.log('2. Run: npm run build (if not already done)');
    console.log('3. Deploy to production environment');
    console.log('4. Run QA validation: npm run test:qa');
  } else {
    console.log('⚠️  Some checks failed. Please address the issues above before deploying.');
  }

  return allGood;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  runDeploymentChecklist().catch((error) => {
    console.error('Deployment checklist failed:', error);
    process.exitCode = 1;
  });
}

export { runDeploymentChecklist };
