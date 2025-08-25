// Script to set up sample products in your Supabase database
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "https://jsneposfxfuyweogmmrl.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY not found in environment variables');
  console.log('📝 Please set it in your .env file or run:');
  console.log('   copy env.example .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample products data
const sampleProducts = [
  {
    code: 'F001',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 12.99,
    category: 'Pizza',
    is_active: true
  },
  {
    code: 'F002',
    name: 'Chicken Burger',
    description: 'Grilled chicken breast with lettuce, tomato, and mayo',
    price: 9.99,
    category: 'Burgers',
    is_active: true
  },
  {
    code: 'F003',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with caesar dressing and croutons',
    price: 8.99,
    category: 'Salads',
    is_active: true
  },
  {
    code: 'F004',
    name: 'Spaghetti Carbonara',
    description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
    price: 14.99,
    category: 'Pasta',
    is_active: true
  },
  {
    code: 'F005',
    name: 'Fish & Chips',
    description: 'Beer-battered fish with crispy fries',
    price: 13.99,
    category: 'Seafood',
    is_active: true
  },
  {
    code: 'F006',
    name: 'Vegetable Stir Fry',
    description: 'Mixed vegetables with teriyaki sauce and rice',
    price: 10.99,
    category: 'Asian',
    is_active: true
  },
  {
    code: 'F007',
    name: 'BBQ Ribs',
    description: 'Slow-cooked ribs with BBQ sauce and coleslaw',
    price: 18.99,
    category: 'BBQ',
    is_active: true
  },
  {
    code: 'F008',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with chocolate frosting',
    price: 6.99,
    category: 'Desserts',
    is_active: true
  }
];

async function setupDatabase() {
  console.log('🚀 Setting up sample products in Supabase...');
  console.log('📍 Database URL:', supabaseUrl);
  
  try {
    // First, check if products already exist
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('code')
      .eq('is_active', true);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingProducts && existingProducts.length > 0) {
      console.log(`⚠️  Found ${existingProducts.length} existing products in database`);
      console.log('📋 Existing product codes:', existingProducts.map(p => p.code).join(', '));
      
      const shouldContinue = await askQuestion('Do you want to add sample products anyway? (y/N): ');
      if (shouldContinue.toLowerCase() !== 'y') {
        console.log('✅ Setup cancelled. Database already has products.');
        return;
      }
    }
    
    // Insert sample products
    console.log('📦 Inserting sample products...');
    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();
    
    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        console.log('⚠️  Some products already exist. Trying upsert...');
        
        // Use upsert to handle existing products
        const { data: upsertedProducts, error: upsertError } = await supabase
          .from('products')
          .upsert(sampleProducts, { onConflict: 'code' })
          .select();
        
        if (upsertError) {
          throw upsertError;
        }
        
        console.log(`✅ Successfully upserted ${upsertedProducts.length} products`);
        console.log('📋 Product codes:', upsertedProducts.map(p => p.code).join(', '));
      } else {
        throw insertError;
      }
    } else {
      console.log(`✅ Successfully inserted ${insertedProducts.length} products`);
      console.log('📋 Product codes:', insertedProducts.map(p => p.code).join(', '));
    }
    
    // Verify the products were added
    console.log('\n🔍 Verifying products in database...');
    const { data: allProducts, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('code');
    
    if (verifyError) {
      throw verifyError;
    }
    
    console.log(`✅ Database now contains ${allProducts.length} active products:`);
    allProducts.forEach(product => {
      console.log(`   ${product.code}: ${product.name} - $${product.price}`);
    });
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('🚀 Your bot should now be able to load products from Supabase.');
    
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code || 'N/A');
    console.error('   Details:', error.details || 'N/A');
    
    if (error.code === 'PGRST301') {
      console.log('\n💡 This might be a permissions issue. Check your Supabase RLS policies.');
    }
  }
}

function askQuestion(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

setupDatabase().catch(console.error);
