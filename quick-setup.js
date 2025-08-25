#!/usr/bin/env node

/**
 * Quick Setup Script for Messenger Food Bot
 * This script helps you set up your environment variables quickly
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 MESSENGER FOOD BOT - QUICK SETUP\n');
console.log('=' .repeat(50));

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file from template...');
  
  try {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created successfully!');
    } else {
      // Create a basic .env file
      const envContent = `# Facebook App Configuration
VERIFY_TOKEN=your_verify_token_here
PAGE_ACCESS_TOKEN=your_page_access_token_here

# App Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://jsneposfxfuyweogmmrl.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Important: Get your SUPABASE_ANON_KEY from:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Settings → API → Copy the "anon public" key`;

      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file created with default template!');
    }
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  }
} else {
  console.log('📄 .env file already exists');
}

console.log('\n📋 NEXT STEPS:');
console.log('=' .repeat(30));

console.log('\n1. 🔑 SET UP SUPABASE:');
console.log('   - Go to https://supabase.com/dashboard');
console.log('   - Select your project (or create one)');
console.log('   - Go to Settings → API');
console.log('   - Copy the "anon public" key');
console.log('   - Edit .env file and replace "your_supabase_anon_key_here" with your actual key');

console.log('\n2. 🗃️  SET UP DATABASE:');
console.log('   - Go to your Supabase dashboard');
console.log('   - Open SQL Editor');
console.log('   - Copy and paste the contents of database/supabase_schema.sql');
console.log('   - Run the SQL to create tables and sample data');

console.log('\n3. 📱 SET UP FACEBOOK (if needed):');
console.log('   - Get your Facebook Page Access Token');
console.log('   - Set up webhook verification token');
console.log('   - Edit .env file and replace the Facebook tokens');

console.log('\n4. 🧪 TEST YOUR SETUP:');
console.log('   - Run: node debug-supabase.js');
console.log('   - Fix any issues shown');
console.log('   - When all tests pass, run: npm start');

console.log('\n5. 🌐 DEPLOY (optional):');
console.log('   - The bot works locally for testing');
console.log('   - To deploy online, use platforms like Vercel, Heroku, or Railway');

console.log('\n💡 TROUBLESHOOTING:');
console.log('   - If you see "SUPABASE_ANON_KEY is missing" → Edit .env file');
console.log('   - If you see "relation does not exist" → Run database setup SQL');
console.log('   - If you see "JWT" errors → Check your Supabase key is correct');
console.log('   - For more help, run: node debug-supabase.js');

console.log('\n🎉 Setup complete! Edit your .env file and run the debug script.');
console.log('=' .repeat(50));
