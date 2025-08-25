const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { db } = require('./lib/supabase');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Food menu will now be loaded from Supabase
let foodMenu = {};

// User session storage (in production, use a database)
const userSessions = {};

// Load products from Supabase on startup
async function loadProducts() {
  console.log('🔄 Loading products from Supabase...');
  
  try {
    // Test if environment variables are available
    if (!process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY environment variable is not set. Please check your .env file.');
    }

    const products = await db.getAllProducts();
    
    if (!products || products.length === 0) {
      console.warn('⚠️  No products found in Supabase database. Using fallback menu.');
      throw new Error('No products found in database');
    }

    foodMenu = {};
    products.forEach(product => {
      foodMenu[product.code] = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        description: product.description,
        category: product.category
      };
    });
    console.log(`✅ Successfully loaded ${products.length} products from Supabase`);
    console.log(`📋 Available product codes: ${Object.keys(foodMenu).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error loading products from Supabase:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack?.split('\n')[1] || 'N/A'}`);
    
    // Check specific error types
    if (error.message?.includes('JWT')) {
      console.error('🔑 Authentication Error: Invalid Supabase key');
    } else if (error.message?.includes('fetch')) {
      console.error('🌐 Network Error: Cannot reach Supabase server');
    } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.error('🗃️  Database Error: Products table does not exist. Run database setup.');
    }
    
    console.log('🔄 Falling back to hardcoded menu...');
    
    // Fallback to hardcoded menu if database fails
    foodMenu = {
      'F001': { name: 'Margherita Pizza', price: 100.99, description: 'Classic pizza with tomato sauce, mozzarella, and basil' },
      'F002': { name: 'Chicken Burger', price: 229.99, description: 'Grilled chicken breast with lettuce, tomato, and mayo' },
      'F003': { name: 'Caesar Salad', price: 338.99, description: 'Fresh romaine lettuce with caesar dressing and croutons' },
      'F004': { name: 'Spaghetti Carbonara', price: 449.99, description: 'Creamy pasta with bacon, eggs, and parmesan cheese' },
      'F005': { name: 'Fish & Chips', price: 559.99, description: 'Beer-battered fish with crispy fries' },
      'F006': { name: 'Vegetable Stir Fry', price: 669.99, description: 'Mixed vegetables with teriyaki sauce and rice' },
      'F007': { name: 'BBQ Ribs', price: 779.99, description: 'Slow-cooked ribs with BBQ sauce and coleslaw' },
      'F008': { name: 'Chocolate Cake', price: 26.99, description: 'Rich chocolate cake with chocolate frosting' }
    };
    
    console.log(`📋 Using fallback menu with ${Object.keys(foodMenu).length} items`);
    console.log(`⚠️  Orders will work but won't be saved to database until Supabase is fixed`);
  }
}

// Verification endpoint for Facebook webhook
app.get('/webhook', (req, res) => {

  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Handle incoming messages
app.post('/webhook', (req, res) => {
  const body = req.body;
  console.log('Webhook received:', body);
  // Handle regular page messages
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhook_event = entry.messaging[0];
      console.log('Messenger Event:', webhook_event);

      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  }
  // Handle shopping cart webhooks
  else if (body.field === 'send_cart') {
    console.log('Shopping Cart Event:', body);
    handleCartOrder(body.value);
    res.status(200).send('EVENT_RECEIVED');
  }
  // Handle other webhook types
  else if (body.field) {
    console.log('Other Webhook Event:', body.field, body);
    res.status(200).send('EVENT_RECEIVED');
  }
  else {
    res.sendStatus(404);
  }
});

// Handle incoming messages
async function handleMessage(sender_psid, received_message) {
  let response;
  const messageText = received_message.text;

  if (!userSessions[sender_psid]) {
    userSessions[sender_psid] = { step: 'start' };
  }

  const userSession = userSessions[sender_psid];

  if (messageText) {
    const upperText = messageText.toUpperCase();

    // Check if user is in ordering flow
    if (userSession.step === 'awaiting_address') {
      userSession.address = messageText;
      userSession.step = 'awaiting_phone';
      response = {
        "text": "Great! Now please provide your phone number for delivery confirmation:"
      };
    } else if (userSession.step === 'awaiting_phone') {
      userSession.phone = messageText;
      userSession.step = 'completed';
      
      let orderSummary;
      let savedOrder = null;
      
      try {
        // Save order to Supabase
        const orderData = {
          messenger_id: sender_psid,
          delivery_address: userSession.address,
          customer_phone: userSession.phone,
          payment_method: 'cash_on_delivery'
        };

        // Handle cart orders vs regular food code orders
        if (userSession.cartOrder) {
          // Cart order
          orderData.total_amount = userSession.cartOrder.total;
          orderData.currency = userSession.cartOrder.currency;
          orderData.notes = userSession.cartOrder.note;
          orderData.items = userSession.cartOrder.products.map(product => ({
            product_id: null, // Cart products might not have product_id
            product_code: product.code || 'CART',
            product_name: product.name,
            quantity: product.quantity,
            unit_price: product.unit_price
          }));

          savedOrder = await db.createOrder(orderData);
          
          orderSummary = `
🎉 Cart Order Confirmed! 🎉
📋 Order #${savedOrder.order_number}

🛒 Order Details:`;
          
          userSession.cartOrder.products.forEach(product => {
            orderSummary += `
• ${product.name} (Qty: ${product.quantity})
  ${product.unit_price} × ${product.quantity} = ${product.unit_price * product.quantity} ${userSession.cartOrder.currency}`;
          });
          
          orderSummary += `

💰 Total: ${userSession.cartOrder.total} ${userSession.cartOrder.currency}`;
          
          if (userSession.cartOrder.note) {
            orderSummary += `
📝 Note: ${userSession.cartOrder.note}`;
          }
          
        } else {
          // Regular food code order
          orderData.total_amount = userSession.selectedFood.price;
          orderData.currency = 'USD';
          orderData.items = [{
            product_id: userSession.selectedFood.id,
            product_code: userSession.selectedFoodCode,
            product_name: userSession.selectedFood.name,
            quantity: 1,
            unit_price: userSession.selectedFood.price
          }];

          savedOrder = await db.createOrder(orderData);
          
          orderSummary = `
🎉 Order Confirmed! 🎉
📋 Order #${savedOrder.order_number}

📝 Order Details:
• Item: ${userSession.selectedFood.name}
• Price: $${userSession.selectedFood.price}
• Description: ${userSession.selectedFood.description}`;
        }
        
        orderSummary += `

📍 Delivery Address: ${userSession.address}
📞 Contact: ${userSession.phone}
💳 Payment Method: Cash on Delivery
⏰ Estimated delivery time: 30-45 minutes

Thank you for your order! Our delivery team will contact you shortly.`;

      } catch (error) {
        console.error('❌ Error saving order to database:');
        console.error(`   Message: ${error.message}`);
        console.error(`   Code: ${error.code || 'N/A'}`);
        console.error(`   Details: ${error.details || 'N/A'}`);
        console.error(`   Stack: ${error.stack?.split('\n')[1] || 'N/A'}`);
        
        // Provide specific error feedback
        let errorReason = 'technical issue with our system';
        if (error.message?.includes('JWT')) {
          errorReason = 'authentication issue with our database';
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          errorReason = 'database configuration issue';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorReason = 'network connectivity issue';
        }
        
        orderSummary = `
🎉 Order Received! 🎉

Your order has been received and our team has been notified. However, there was a ${errorReason}. Please save this conversation as your order confirmation.

📍 Delivery Address: ${userSession.address}
📞 Contact: ${userSession.phone}
💳 Payment Method: Cash on Delivery
⏰ Estimated delivery time: 30-45 minutes

Our team will contact you shortly to confirm your order.`;
      }
      
      orderSummary += `

Type 'menu' to see our full menu or order again! 🍕🍔`;
      
      response = { "text": orderSummary };
      
      // Reset user session
      delete userSessions[sender_psid];
    }
    // Check for menu request
    else if (upperText.includes('MENU') || upperText.includes('START') || upperText.includes('HI') || upperText.includes('HELLO')) {
      response = getMenuResponse();
    }
    // Check if message is a food code
    else if (foodMenu[upperText]) {
      const selectedFood = foodMenu[upperText];
      userSession.selectedFood = selectedFood;
      userSession.selectedFoodCode = upperText;
      userSession.step = 'awaiting_address';
      
      response = {
        "text": `🍽️ Great choice! You selected:

${selectedFood.name} - $${selectedFood.price}
${selectedFood.description}

To complete your order, please provide your delivery address:`
      };
    }
    // Check for help or unknown commands
    else {
      response = {
        "text": `I didn't understand that. Here are some things you can do:

🍕 Type 'MENU' to see our food menu
🔢 Type a food code (like F001) to order
❓ Type 'HELP' for assistance

What would you like to do?`
      };
    }
  } else if (received_message.attachments) {
    response = {
      "text": "Thanks for the attachment! Please type 'MENU' to see our food options or use a food code to place an order."
    };
  }

  callSendAPI(sender_psid, response);
}

// Handle shopping cart orders
function handleCartOrder(cartData) {
  console.log('Processing cart order:', cartData);
  
  const { sender, recipient, order } = cartData;
  const sender_psid = sender.id;
  
  // Calculate total
  let total = 0;
  let orderSummary = '🛒 **CART ORDER RECEIVED** 🛒\n\n';
  
  order.products.forEach(product => {
    const itemTotal = product.unit_price * product.quantity;
    total += itemTotal;
    
    orderSummary += `• ${product.name}\n`;
    orderSummary += `  Qty: ${product.quantity} × ${product.unit_price} ${product.currency}\n`;
    orderSummary += `  Subtotal: ${itemTotal} ${product.currency}\n\n`;
  });
  
  orderSummary += `💰 **Total: ${total} ${order.products[0]?.currency || 'THB'}**\n\n`;
  
  if (order.note) {
    orderSummary += `📝 Note: ${order.note}\n\n`;
  }
  
  orderSummary += `📍 **Next Steps:**\n`;
  orderSummary += `Please provide your delivery address to complete the order.\n\n`;
  orderSummary += `🚚 Estimated delivery: 30-45 minutes\n`;
  orderSummary += `💳 Payment: Cash on Delivery`;
  
  // Initialize session for address collection
  if (!userSessions[sender_psid]) {
    userSessions[sender_psid] = { step: 'start' };
  }
  
  userSessions[sender_psid].cartOrder = {
    products: order.products,
    total: total,
    currency: order.products[0]?.currency || 'THB',
    note: order.note,
    source: order.source
  };
  userSessions[sender_psid].step = 'awaiting_address';
  
  // Send response
  const response = { "text": orderSummary };
  callSendAPI(sender_psid, response);
}

// Handle postback events
function handlePostback(sender_psid, received_postback) {
  let response;
  const payload = received_postback.payload;

  if (payload === 'GET_STARTED') {
    response = getWelcomeResponse();
  } else if (payload === 'SHOW_MENU') {
    response = getMenuResponse();
  } else if (payload.startsWith('ORDER_')) {
    const foodCode = payload.split('_')[1];
    if (foodMenu[foodCode]) {
      if (!userSessions[sender_psid]) {
        userSessions[sender_psid] = { step: 'start' };
      }
      const userSession = userSessions[sender_psid];
      userSession.selectedFood = foodMenu[foodCode];
      userSession.selectedFoodCode = foodCode;
      userSession.step = 'awaiting_address';
      
      response = {
        "text": `🍽️ Great choice! You selected:

${userSession.selectedFood.name} - $${userSession.selectedFood.price}
${userSession.selectedFood.description}

To complete your order, please provide your delivery address:`
      };
    }
  }

  callSendAPI(sender_psid, response);
}

// Get welcome response
function getWelcomeResponse() {
  return {
    "text": `🍕 Welcome to our Food Delivery Bot! 🍔

I'm here to help you order delicious food quickly and easily.

🔢 How to order:
1. Type 'MENU' to see our full menu
2. Type the food code (like F001) to select an item
3. Provide your delivery address
4. Confirm your phone number
5. Enjoy your meal!

💳 Payment: Cash on Delivery
⏰ Delivery: 30-45 minutes

Type 'MENU' to get started! 🎉`
  };
}

// Get menu response
function getMenuResponse() {
  let menuText = "🍽️ **OUR DELICIOUS MENU** 🍽️\n\n";
  
  for (const [code, item] of Object.entries(foodMenu)) {
    menuText += `🔢 **${code}** - ${item.name}\n`;
    menuText += `💰 $${item.price}\n`;
    menuText += `📝 ${item.description}\n\n`;
  }
  
  menuText += "💡 **How to order:**\n";
  menuText += "Just type the food code (e.g., F001) to place your order!\n\n";
  menuText += "💳 Payment: Cash on Delivery\n";
  menuText += "🚚 Free delivery in 30-45 minutes!";
  
  return {
    "text": menuText
  };
}

// Send message to Facebook Messenger
async function callSendAPI(sender_psid, response) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  
  const request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  };

  try {
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, request_body);
    console.log('Message sent successfully!');
  } catch (error) {
    console.error("Unable to send message:", error.response?.data || error.message);
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Facebook Messenger Food Bot is active!',
    endpoints: {
      webhook: '/webhook (GET for verification, POST for messages)'+process.env.SUPABASE_ANON_KEY,
      health: '/ (this endpoint)'+process.env.SUPABASE_ANON_KEY,
      privacy: '/privacy (Privacy Policy)'
    }
  });
});

// Privacy policy endpoint
app.get('/privacy', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const privacyPolicy = fs.readFileSync(path.join(__dirname, 'privacy-policy.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(privacyPolicy);
  } catch (error) {
    res.status(404).send(`
      <html>
        <body>
          <h1>Privacy Policy</h1>
          <p>Our food delivery bot respects your privacy. We only collect delivery address and phone number to process your food orders. Contact us for more information.</p>
        </body>
      </html>
    `);
  }
});

// Initialize and start server
async function startServer() {
  // Load products from Supabase
  await loadProducts();
  
  app.listen(PORT, () => {
    console.log(`🚀 Messenger Food Bot is running on port ${PORT}`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  });
}

startServer().catch(console.error);

module.exports = app;
