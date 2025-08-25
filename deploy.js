// Simple deployment helper script
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying Messenger Food Bot to Vercel...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.error('❌ Error: .env file not found!');
  console.log('📝 Please create a .env file with your Facebook tokens:');
  console.log('   VERIFY_TOKEN=your_verify_token');
  console.log('   PAGE_ACCESS_TOKEN=your_page_access_token');
  process.exit(1);
}

try {
  // Deploy to Vercel
  console.log('📦 Deploying to Vercel...');
  const output = execSync('vercel --prod', { encoding: 'utf8' });
  console.log(output);
  
  console.log('✅ Deployment completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy your Vercel URL from above');
  console.log('2. Go to your Facebook App webhook settings');
  console.log('3. Set callback URL to: https://your-vercel-url.vercel.app/webhook');
  console.log('4. Test your bot on your Facebook Page!');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure you have Vercel CLI installed: npm install -g vercel');
  console.log('2. Login to Vercel: vercel login');
  console.log('3. Check your environment variables are set');
}
