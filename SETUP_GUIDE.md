# 🚀 Complete Setup Guide for Your Messenger Food Bot

## **STEP 1: Facebook Setup** ✅

### **1a. Create Facebook Page (if needed)**
1. Go to: https://www.facebook.com/pages/create
2. Choose "Business or Brand"
3. Page Name: "Your Restaurant Name" (e.g., "Delicious Food Delivery")
4. Category: "Restaurant" or "Food Delivery Service"
5. Complete the page setup

### **1b. Create Facebook App**
1. Go to: https://developers.facebook.com/
2. Click "Create App" → Choose "Business" → "Next"
3. **App Name**: "Food Delivery Bot" (or your choice)
4. **Contact Email**: Your email address
5. Click "Create App"

### **1c. Add Messenger Product**
1. In your App Dashboard, click "Add Product"
2. Find **"Messenger"** and click "Set Up"
3. This adds Messenger functionality to your app

### **1d. Get Your Page Access Token**
1. In Messenger settings, scroll to **"Access Tokens"**
2. Click "Add or Remove Pages"
3. Select your Facebook Page and click "Continue"
4. You'll see your page with a **"Generate Token"** button
5. Click "Generate Token" and **COPY THIS TOKEN** - this is your `PAGE_ACCESS_TOKEN`

---

## **STEP 2: Environment Configuration** ⚙️

1. **Copy the example file**:
   ```bash
   copy env.example .env
   ```

2. **Edit the .env file** with these values:
   ```env
   # Choose any secure string (you'll use this in webhook setup)
   VERIFY_TOKEN=food_bot_secure_token_2024
   
   # Paste your token from Facebook here
   PAGE_ACCESS_TOKEN=YOUR_ACTUAL_TOKEN_FROM_FACEBOOK_STEP_1d
   
   PORT=3000
   ```

---

## **STEP 3: Deploy to Vercel** 🚀

### **3a. Install Vercel CLI**
```bash
npm install -g vercel
```

### **3b. Login to Vercel**
```bash
vercel login
```
Follow the prompts to login with GitHub, GitLab, or email.

### **3c. Deploy Your Bot**
```bash
vercel
```

**Answer the prompts:**
- Set up and deploy: **Y**
- Link to existing project: **N** 
- Project name: **messenger-food-bot** (or your choice)
- Directory: **./** (current directory)
- Build command: Leave empty (press Enter)
- Output directory: Leave empty (press Enter)

### **3d. Set Environment Variables in Vercel**
```bash
vercel env add VERIFY_TOKEN
vercel env add PAGE_ACCESS_TOKEN
```
Enter the same values you put in your .env file.

### **3e. Deploy Production Version**
```bash
vercel --prod
```

**🎉 Copy your Vercel URL** (something like: `https://messenger-food-bot-abc123.vercel.app`)

---

## **STEP 4: Configure Facebook Webhook** 🔗

### **4a. Set Webhook URL**
1. Go back to your Facebook App Dashboard
2. Go to **Messenger** → **Settings** → **Webhooks**
3. Click **"Add Callback URL"**
4. **Callback URL**: `https://your-vercel-url.vercel.app/webhook`
5. **Verify Token**: Use the same token from your .env file (`food_bot_secure_token_2024`)
6. Click **"Verify and Save"**

### **4b. Subscribe to Page Events**
1. In the same webhook section, click **"Add Subscriptions"**
2. Select your Facebook Page
3. Check these boxes:
   - ✅ **messages**
   - ✅ **messaging_postbacks**
4. Click **"Subscribe"**

---

## **STEP 5: Test Your Bot** 🧪

### **5a. Test on Facebook**
1. Go to your Facebook Page
2. Click **"Send Message"** button
3. **Test these commands**:
   ```
   User: hi
   Bot: [Shows welcome message]
   
   User: menu
   Bot: [Shows food menu with codes F001-F008]
   
   User: F001
   Bot: [Asks for delivery address]
   
   User: 123 Main St, New York
   Bot: [Asks for phone number]
   
   User: +1-555-123-4567
   Bot: [Shows order confirmation]
   ```

### **5b. Test Different Scenarios**
- Type different food codes (F001 through F008)
- Test the complete order flow
- Try typing "menu" at any time

---

## **STEP 6: Customize Your Bot** 🎨

### **6a. Edit Food Menu**
In `index.js`, find the `foodMenu` object and customize:
```javascript
const foodMenu = {
  'F001': { name: 'Your Pizza', price: 15.99, description: 'Your description' },
  'F009': { name: 'New Item', price: 12.99, description: 'Add new items' },
  // ... add more items
};
```

### **6b. Customize Messages**
- Edit welcome messages in `getWelcomeResponse()`
- Modify order confirmation in the message handling
- Change restaurant name and branding

### **6c. Redeploy After Changes**
```bash
vercel --prod
```

---

## **Troubleshooting** 🔧

### **Bot Not Responding?**
1. Check Vercel logs: `vercel logs`
2. Verify webhook URL is correct
3. Ensure PAGE_ACCESS_TOKEN is valid
4. Check webhook subscriptions are active

### **Webhook Verification Failed?**
1. Ensure VERIFY_TOKEN matches in .env and Facebook webhook
2. Check your Vercel deployment is live
3. Try a different verify token

### **Order Flow Issues?**
1. Test locally first: `npm start`
2. Use ngrok for local testing: `npx ngrok http 3000`
3. Check console logs for errors

---

## **Your Food Menu** 🍕

| Code | Item | Price |
|------|------|-------|
| F001 | Margherita Pizza | $12.99 |
| F002 | Chicken Burger | $9.99 |
| F003 | Caesar Salad | $8.99 |
| F004 | Spaghetti Carbonara | $14.99 |
| F005 | Fish & Chips | $13.99 |
| F006 | Vegetable Stir Fry | $10.99 |
| F007 | BBQ Ribs | $18.99 |
| F008 | Chocolate Cake | $6.99 |

Customers can type any of these codes to start ordering!

---

## **Need Help?** 💬

- Check the main README.md for technical details
- Facebook Developer Documentation: https://developers.facebook.com/docs/messenger-platform
- Vercel Documentation: https://vercel.com/docs

**Happy Food Delivery! 🚚🍕**
