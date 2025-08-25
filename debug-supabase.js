#!/usr/bin/env node

/**
 * Supabase Debug Script
 * This script helps debug Supabase connection and database issues
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 SUPABASE DEBUG SCRIPT\n');
console.log('=' .repeat(50));

// Color functions for better output
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// Step 1: Check Environment Variables
console.log('\n📋 Step 1: Environment Variables Check');
console.log('-' .repeat(40));

const envVars = {
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY,
  'VERIFY_TOKEN': process.env.VERIFY_TOKEN,
  'PAGE_ACCESS_TOKEN': process.env.PAGE_ACCESS_TOKEN,
  'PORT': process.env.PORT
};

let missingVars = [];

Object.entries(envVars).forEach(([key, value]) => {
  if (!value || value === 'your_' + key.toLowerCase() + '_here') {
    console.log(`❌ ${colors.red(key)}: ${colors.red('Missing or placeholder')}`);
    missingVars.push(key);
  } else {
    // Mask sensitive values
    const displayValue = key.includes('KEY') || key.includes('TOKEN') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${colors.green(key)}: ${colors.cyan(displayValue)}`);
  }
});

if (missingVars.length > 0) {
  console.log(`\n${colors.red('⚠️  WARNING: Missing environment variables!')}`);
  console.log(`Please create a .env file in your project root with:`);
  missingVars.forEach(varName => {
    console.log(`${varName}=your_actual_value_here`);
  });
  console.log('\nReference the env.example file for the correct format.');
}

// Step 2: Test Supabase Connection
console.log('\n🔌 Step 2: Supabase Connection Test');
console.log('-' .repeat(40));

async function testSupabaseConnection() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://jsneposfxfuyweogmmrl.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseKey) {
      console.log(`❌ ${colors.red('Cannot test connection: SUPABASE_ANON_KEY is missing')}`);
      return false;
    }

    console.log(`🔗 Connecting to: ${colors.cyan(supabaseUrl)}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${colors.red('Connection failed:')}`);
      console.log(`   Error: ${colors.red(error.message)}`);
      console.log(`   Code: ${colors.red(error.code || 'N/A')}`);
      console.log(`   Details: ${colors.red(error.details || 'N/A')}`);
      return false;
    }

    console.log(`✅ ${colors.green('Connection successful!')}`);
    console.log(`📊 Products table has ${colors.cyan(data || 0)} records`);
    return true;

  } catch (error) {
    console.log(`❌ ${colors.red('Connection error:')}`);
    console.log(`   ${colors.red(error.message)}`);
    return false;
  }
}

// Step 3: Test Database Tables
async function testDatabaseTables() {
  console.log('\n📊 Step 3: Database Tables Test');
  console.log('-' .repeat(40));

  if (!process.env.SUPABASE_ANON_KEY) {
    console.log(`❌ ${colors.red('Cannot test tables: SUPABASE_ANON_KEY is missing')}`);
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://jsneposfxfuyweogmmrl.supabase.co',
    process.env.SUPABASE_ANON_KEY
  );

  const tables = ['products', 'customers', 'orders', 'order_items'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${colors.red(`${table}:`)} ${colors.red(error.message)}`);
      } else {
        console.log(`✅ ${colors.green(`${table}:`)} ${colors.cyan(`${data || 0} records`)}`);
      }
    } catch (error) {
      console.log(`❌ ${colors.red(`${table}:`)} ${colors.red(error.message)}`);
    }
  }
}

// Step 4: Test Product Loading
async function testProductLoading() {
  console.log('\n🍕 Step 4: Product Loading Test');
  console.log('-' .repeat(40));

  if (!process.env.SUPABASE_ANON_KEY) {
    console.log(`❌ ${colors.red('Cannot test product loading: SUPABASE_ANON_KEY is missing')}`);
    return;
  }

  try {
    const { db } = require('./lib/supabase');
    
    console.log('🔄 Loading products from database...');
    const products = await db.getAllProducts();
    
    if (products && products.length > 0) {
      console.log(`✅ ${colors.green(`Successfully loaded ${products.length} products:`)}`);
      products.forEach(product => {
        console.log(`   ${colors.cyan(product.code)}: ${product.name} - $${product.price}`);
      });
    } else {
      console.log(`⚠️  ${colors.yellow('No products found in database')}`);
      console.log('   This might be normal if you haven\'t run the database setup yet.');
    }

  } catch (error) {
    console.log(`❌ ${colors.red('Product loading failed:')}`);
    console.log(`   ${colors.red(error.message)}`);
    console.log(`   Stack: ${colors.red(error.stack?.split('\n')[1] || 'N/A')}`);
  }
}

// Step 5: Test Order Creation
async function testOrderCreation() {
  console.log('\n📝 Step 5: Order Creation Test');
  console.log('-' .repeat(40));

  if (!process.env.SUPABASE_ANON_KEY) {
    console.log(`❌ ${colors.red('Cannot test order creation: SUPABASE_ANON_KEY is missing')}`);
    return;
  }

  try {
    const { db } = require('./lib/supabase');
    
    console.log('🔄 Testing order creation...');
    
    // Test order data
    const testOrderData = {
      messenger_id: 'test_debug_user_123',
      delivery_address: '123 Test Street, Debug City',
      customer_phone: '+1234567890',
      customer_name: 'Debug Test User',
      total_amount: 25.99,
      currency: 'USD',
      payment_method: 'cash_on_delivery',
      notes: 'This is a debug test order',
      items: [{
        product_id: null,
        product_code: 'F001',
        product_name: 'Debug Test Pizza',
        quantity: 1,
        unit_price: 25.99
      }]
    };

    const order = await db.createOrder(testOrderData);
    
    if (order) {
      console.log(`✅ ${colors.green('Order creation successful!')}`);
      console.log(`   Order Number: ${colors.cyan(order.order_number)}`);
      console.log(`   Order ID: ${colors.cyan(order.id)}`);
      console.log(`   Total: ${colors.cyan('$' + order.total_amount)}`);
      
      // Clean up test order
      console.log('🧹 Cleaning up test order...');
      const supabase = createClient(
        process.env.SUPABASE_URL || 'https://jsneposfxfuyweogmmrl.supabase.co',
        process.env.SUPABASE_ANON_KEY
      );
      
      await supabase.from('orders').delete().eq('id', order.id);
      await supabase.from('customers').delete().eq('messenger_id', 'test_debug_user_123');
      console.log(`✅ ${colors.green('Test data cleaned up')}`);
      
    } else {
      console.log(`❌ ${colors.red('Order creation returned null')}`);
    }

  } catch (error) {
    console.log(`❌ ${colors.red('Order creation failed:')}`);
    console.log(`   ${colors.red(error.message)}`);
    console.log(`   Stack: ${colors.red(error.stack?.split('\n')[1] || 'N/A')}`);
  }
}

// Main execution
async function runDiagnostics() {
  try {
    const connectionOk = await testSupabaseConnection();
    
    if (connectionOk) {
      await testDatabaseTables();
      await testProductLoading();
      await testOrderCreation();
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🏁 DIAGNOSIS COMPLETE');
    console.log('=' .repeat(50));

    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (missingVars.length > 0) {
      console.log(`1. ${colors.red('Create .env file')} with missing environment variables`);
      console.log(`   Copy env.example to .env and fill in your actual values`);
    }
    
    if (!process.env.SUPABASE_ANON_KEY) {
      console.log(`2. ${colors.red('Get your Supabase credentials:')}`);
      console.log(`   - Go to https://supabase.com/dashboard`);
      console.log(`   - Select your project`);
      console.log(`   - Settings → API → Copy "anon public" key`);
    }
    
    console.log(`3. ${colors.blue('Run database setup')} if tables are missing:`);
    console.log(`   - Go to your Supabase SQL editor`);
    console.log(`   - Execute the SQL in database/supabase_schema.sql`);
    
    console.log(`4. ${colors.green('Test your bot')} after fixing the issues:`);
    console.log(`   - Run: node debug-supabase.js`);
    console.log(`   - Then: npm start`);

  } catch (error) {
    console.log(`\n❌ ${colors.red('Diagnostic script failed:')}`);
    console.log(`   ${colors.red(error.message)}`);
  }
}

// Run the diagnostics
runDiagnostics().catch(console.error);
