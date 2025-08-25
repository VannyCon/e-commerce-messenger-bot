// Quick setup script for the Messenger Food Bot
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🍕 Welcome to Messenger Food Bot Setup! 🤖\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  try {
    console.log('Let\'s configure your environment variables...\n');
    
    const verifyToken = await askQuestion('Enter your VERIFY_TOKEN (choose any secure string): ');
    const pageToken = await askQuestion('Enter your PAGE_ACCESS_TOKEN (from Facebook App): ');
    
    const envContent = `# Facebook App Configuration
VERIFY_TOKEN=${verifyToken}
PAGE_ACCESS_TOKEN=${pageToken}

# App Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://jsneposfxfuyweogmmrl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbmVwb3NmeGZ1eXdlb2dtbXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjEwNjYsImV4cCI6MjA3MTY5NzA2Nn0.9sRYixKXBZgwRqPxDPCb_0Nx-9n89-JA-LIpS4WiMxY`;

    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ .env file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run deploy (to deploy to Vercel)');
    console.log('3. Configure Facebook webhook with your Vercel URL');
    console.log('4. Test your bot!\n');
    
    console.log('📖 For detailed instructions, see README.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();
