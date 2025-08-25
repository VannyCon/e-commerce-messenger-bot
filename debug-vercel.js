// Debug script to help troubleshoot Vercel deployment issues
require('dotenv').config();

console.log('🔍 Vercel Environment Debug Check');
console.log('==================================');

// Check all required environment variables
const requiredEnvVars = {
  'VERIFY_TOKEN': process.env.VERIFY_TOKEN,
  'PAGE_ACCESS_TOKEN': process.env.PAGE_ACCESS_TOKEN,
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY,
  'PORT': process.env.PORT
};

console.log('\n📋 Environment Variables Status:');
for (const [name, value] of Object.entries(requiredEnvVars)) {
  const status = value ? '✅' : '❌';
  const display = value ? (name.includes('TOKEN') || name.includes('KEY') ? `${value.substring(0, 10)}...` : value) : 'NOT SET';
  console.log(`${status} ${name}: ${display}`);
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('\n🔄 Testing Supabase Connection...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not set');
    }
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Test a simple query
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log(`📊 Products table accessible (found ${data.length} records)`);
    
  } catch (error) {
    console.log('❌ Supabase connection failed:');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code || 'N/A');
    console.log('   Details:', error.details || 'N/A');
  }
}

// Test network connectivity
async function testNetworkConnectivity() {
  console.log('\n🌐 Testing Network Connectivity...');
  
  try {
    const https = require('https');
    const url = require('url');
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://jsneposfxfuyweogmmrl.supabase.co';
    const parsedUrl = url.parse(supabaseUrl);
    
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: parsedUrl.hostname,
        port: 443,
        path: '/rest/v1/',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY || 'test'
        },
        timeout: 10000
      }, (res) => {
        console.log('✅ Network connectivity successful!');
        console.log(`📡 Response status: ${res.statusCode}`);
        resolve();
      });
      
      req.on('error', (error) => {
        console.log('❌ Network connectivity failed:');
        console.log('   Error:', error.message);
        console.log('   Code:', error.code);
        reject(error);
      });
      
      req.on('timeout', () => {
        console.log('❌ Network request timed out');
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
    
  } catch (error) {
    console.log('❌ Network test failed:', error.message);
  }
}

// Run all tests
async function runDiagnostics() {
  await testNetworkConnectivity();
  await testSupabaseConnection();
  
  console.log('\n🎯 Recommendations:');
  console.log('==================');
  
  if (!process.env.SUPABASE_ANON_KEY) {
    console.log('❌ Set SUPABASE_ANON_KEY in Vercel:');
    console.log('   vercel env add SUPABASE_ANON_KEY');
    console.log('   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbmVwb3NmeGZ1eXdlb2dtbXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjEwNjYsImV4cCI6MjA3MTY5NzA2Nn0.9sRYixKXBZgwRqPxDPCb_0Nx-9n89-JA-LIpS4WiMxY');
  }
  
  if (!process.env.SUPABASE_URL) {
    console.log('❌ Set SUPABASE_URL in Vercel:');
    console.log('   vercel env add SUPABASE_URL');
    console.log('   Value: https://jsneposfxfuyweogmmrl.supabase.co');
  }
  
  console.log('\n📖 After setting environment variables:');
  console.log('   1. Run: vercel --prod');
  console.log('   2. Test your bot again');
  console.log('   3. Check Vercel function logs for errors');
}

runDiagnostics().catch(console.error);
