const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Food menu with codes
const foodMenu = {
  'F001': { name: 'Margherita Pizza', price: 12.99, description: 'Classic pizza with tomato sauce, mozzarella, and basil' },
  'F002': { name: 'Chicken Burger', price: 9.99, description: 'Grilled chicken breast with lettuce, tomato, and mayo' },
  'F003': { name: 'Caesar Salad', price: 8.99, description: 'Fresh romaine lettuce with caesar dressing and croutons' },
  'F004': { name: 'Spaghetti Carbonara', price: 14.99, description: 'Creamy pasta with bacon, eggs, and parmesan cheese' },
  'F005': { name: 'Fish & Chips', price: 13.99, description: 'Beer-battered fish with crispy fries' },
  'F006': { name: 'Vegetable Stir Fry', price: 10.99, description: 'Mixed vegetables with teriyaki sauce and rice' },
  'F007': { name: 'BBQ Ribs', price: 18.99, description: 'Slow-cooked ribs with BBQ sauce and coleslaw' },
  'F008': { name: 'Chocolate Cake', price: 6.99, description: 'Rich chocolate cake with chocolate frosting' }
};

// User session storage (in production, use a database)
const userSessions = {};

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

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhook_event = entry.messaging[0];
      console.log(webhook_event);

      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Handle incoming messages
function handleMessage(sender_psid, received_message) {
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
      
      const orderSummary = `
🎉 Order Confirmed! 🎉

📝 Order Details:
• Item: ${userSession.selectedFood.name}
• Price: $${userSession.selectedFood.price}
• Description: ${userSession.selectedFood.description}

📍 Delivery Address:
${userSession.address}

📞 Contact: ${userSession.phone}

💳 Payment Method: Cash on Delivery

⏰ Estimated delivery time: 30-45 minutes

Thank you for your order! Our delivery team will contact you shortly.

Type 'menu' to see our full menu or order again! 🍕🍔
      `;
      
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
    message: 'Facebook Messenger Food Bot is active!'+process.env.VERIFY_TOKEN,
    endpoints: {
      webhook: '/webhook (GET for verification, POST for messages)'+process.env.PAGE_ACCESS_TOKEN,
      health: '/ (this endpoint)'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Messenger Food Bot is running on port ${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
});

module.exports = app;
