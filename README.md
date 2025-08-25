# Facebook Messenger Food Ordering Bot 🍕🤖

A complete Facebook Messenger bot that allows users to order food by typing food codes, filling out delivery information, and receiving order confirmations.

## Features ✨

- 🍽️ Interactive food menu with codes (F001-F008)
- 📝 Order form collection (address, phone)
- 💳 Cash on delivery payment
- ⏰ Estimated delivery times
- 🎯 User-friendly conversation flow
- 🚀 Ready for Vercel deployment

## Food Menu 🍕

| Code | Item | Price | Description |
|------|------|-------|-------------|
| F001 | Margherita Pizza | $12.99 | Classic pizza with tomato sauce, mozzarella, and basil |
| F002 | Chicken Burger | $9.99 | Grilled chicken breast with lettuce, tomato, and mayo |
| F003 | Caesar Salad | $8.99 | Fresh romaine lettuce with caesar dressing and croutons |
| F004 | Spaghetti Carbonara | $14.99 | Creamy pasta with bacon, eggs, and parmesan cheese |
| F005 | Fish & Chips | $13.99 | Beer-battered fish with crispy fries |
| F006 | Vegetable Stir Fry | $10.99 | Mixed vegetables with teriyaki sauce and rice |
| F007 | BBQ Ribs | $18.99 | Slow-cooked ribs with BBQ sauce and coleslaw |
| F008 | Chocolate Cake | $6.99 | Rich chocolate cake with chocolate frosting |

## Setup Instructions 🛠️

### Step 1: Clone and Install Dependencies

```bash
# Navigate to your project directory
cd "C:\Users\ARMAN\OneDrive\Desktop\Messenger Bot"

# Install dependencies
npm install
```

### Step 2: Create Facebook App and Page

1. **Create a Facebook Page** (if you don't have one):
   - Go to [Facebook Pages](https://www.facebook.com/pages/create)
   - Choose "Business or Brand"
   - Fill in your restaurant/food business details
   - Complete the setup

2. **Create a Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Click "Create App" → "Business" → "Next"
   - Name your app (e.g., "Food Delivery Bot")
   - Complete the setup

3. **Add Messenger Product**:
   - In your Facebook App dashboard
   - Click "Add Product" → Find "Messenger" → "Set Up"

4. **Generate Page Access Token**:
   - In Messenger settings, find "Access Tokens"
   - Select your Facebook Page
   - Generate and copy the Page Access Token

### Step 3: Environment Configuration

1. **Create .env file**:
```bash
# Copy the example file
copy env.example .env
```

2. **Edit .env file** with your tokens:
```env
VERIFY_TOKEN=your_custom_verify_token_123
PAGE_ACCESS_TOKEN=your_page_access_token_from_facebook
PORT=3000
```

**Note**: Choose any secure string for `VERIFY_TOKEN` (you'll need this for webhook setup)

### Step 4: Deploy to Vercel

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

4. **Follow the prompts**:
   - Set up and deploy: `Y`
   - Link to existing project: `N`
   - Project name: `messenger-food-bot`
   - Directory: `./`
   - Build command: `npm run build` (or leave empty)
   - Output directory: `./` (or leave empty)

5. **Set Environment Variables**:
```bash
vercel env add VERIFY_TOKEN
vercel env add PAGE_ACCESS_TOKEN
```

6. **Deploy again**:
```bash
vercel --prod
```

### Step 5: Configure Facebook Webhook

1. **In your Facebook App's Messenger settings**:
   - Go to "Webhooks"
   - Click "Add Callback URL"
   - Callback URL: `https://your-vercel-url.vercel.app/webhook`
   - Verify Token: (the same token you put in .env)
   - Verify and Save

2. **Subscribe to Page Events**:
   - Click "Add Subscriptions"
   - Select your Facebook Page
   - Subscribe to: `messages`, `messaging_postbacks`

### Step 6: Test Your Bot

1. **Go to your Facebook Page**
2. **Click "Send Message"**
3. **Test these commands**:
   - Type: `menu` or `hi`
   - Type a food code: `F001`
   - Follow the ordering flow

## Bot Usage 🤖

### Customer Journey:
1. **Start**: Type "hi", "hello", "menu", or "start"
2. **Browse Menu**: View all available food items with codes
3. **Order**: Type food code (e.g., "F001")
4. **Address**: Provide delivery address
5. **Phone**: Provide contact number
6. **Confirmation**: Receive order summary

### Sample Conversation:
```
User: Hi
Bot: 🍕 Welcome to our Food Delivery Bot! 🍔 Type 'MENU' to get started!

User: menu
Bot: [Shows full menu with codes F001-F008]

User: F001
Bot: Great choice! You selected Margherita Pizza - $12.99
     Please provide your delivery address:

User: 123 Main St, New York, NY 10001
Bot: Great! Now please provide your phone number:

User: +1-555-123-4567
Bot: 🎉 Order Confirmed! [Shows complete order summary]
```

## Local Development 💻

```bash
# Start the bot locally
npm start

# Your webhook URL for local testing
# Use ngrok for public URL: https://ngrok.com/
npx ngrok http 3000
```

## Troubleshooting 🔧

### Common Issues:

1. **Webhook verification failed**:
   - Ensure VERIFY_TOKEN matches in .env and Facebook webhook settings
   - Check that your Vercel deployment is live

2. **Bot not responding**:
   - Verify PAGE_ACCESS_TOKEN is correct
   - Check webhook subscriptions are active
   - Look at Vercel function logs

3. **Deployment issues**:
   - Ensure all environment variables are set in Vercel
   - Check vercel.json configuration
   - Verify Node.js version compatibility

### Debugging:

1. **Check Vercel logs**:
```bash
vercel logs your-deployment-url
```

2. **Test webhook locally**:
```bash
curl -X GET "http://localhost:3000/webhook?hub.verify_token=your_verify_token&hub.challenge=test&hub.mode=subscribe"
```

## Customization 🎨

### Adding New Food Items:
Edit the `foodMenu` object in `index.js`:

```javascript
const foodMenu = {
  'F009': { 
    name: 'New Item', 
    price: 15.99, 
    description: 'Delicious new food item' 
  },
  // ... existing items
};
```

### Modifying Order Flow:
- Edit the `handleMessage` function
- Add new steps to user session management
- Customize response messages

### Adding Payment Options:
- Integrate with Stripe, PayPal, or other payment processors
- Add payment links to order confirmation
- Store payment status in user sessions

## Support 📞

If you need help with setup or customization, please check:
1. Facebook Messenger Platform Documentation
2. Vercel Deployment Guides
3. This README troubleshooting section

## License 📄

MIT License - feel free to modify and use for your restaurant business!
