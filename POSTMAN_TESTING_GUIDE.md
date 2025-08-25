# 🧪 Postman Testing Guide for Your Messenger Food Bot

## 📥 **Import the Collection**

1. **Download Postman**: https://www.postman.com/downloads/
2. **Import Collection**:
   - Open Postman
   - Click "Import" button
   - Select `postman_collection.json` from your project folder
   - Click "Import"

## 🚀 **How to Test Your Bot**

### **Test Sequence (Run in Order):**

#### **1. Health Check** ✅
- **Purpose**: Verify your bot is deployed and running
- **Expected Response**: 
```json
{
  "status": "running",
  "message": "Facebook Messenger Food Bot is active!",
  "endpoints": {
    "webhook": "/webhook (GET for verification, POST for messages)",
    "health": "/ (this endpoint)"
  }
}
```

#### **2. Webhook Verification** 🔗
- **Purpose**: Test Facebook webhook verification
- **Expected Response**: `test123` (the challenge value)
- **Note**: This will fail until you set environment variables on Vercel

#### **3. Simulate Menu Request** 📋
- **Purpose**: Test user typing "menu"
- **Expected Response**: `EVENT_RECEIVED`
- **What happens**: Bot processes menu request (but can't send response without Facebook tokens)

#### **4. Simulate Food Order (F001)** 🍕
- **Purpose**: Test ordering Margherita Pizza
- **Expected Response**: `EVENT_RECEIVED`
- **Flow**: User types "F001" → Bot asks for address

#### **5. Simulate Address Input** 📍
- **Purpose**: Test providing delivery address
- **Expected Response**: `EVENT_RECEIVED`
- **Flow**: Address provided → Bot asks for phone

#### **6. Simulate Phone Input** 📞
- **Purpose**: Complete the order
- **Expected Response**: `EVENT_RECEIVED`
- **Flow**: Phone provided → Bot shows order confirmation

#### **7. Test Different Food Codes** 🍔
- **Purpose**: Test other menu items
- **Try these codes**: F001-F008
- **Change the text in body**: `"text": "F002"` for Chicken Burger, etc.

#### **8. Test Invalid Command** ❌
- **Purpose**: Test error handling
- **Expected Response**: `EVENT_RECEIVED`
- **Flow**: Bot shows help message

---

## 🔧 **Current Limitations (Until Facebook Setup)**

Since your bot doesn't have Facebook environment variables set yet, you'll see:
- ✅ **Health check works**
- ❌ **Webhook verification fails** (needs VERIFY_TOKEN)
- ✅ **Message processing works** (returns EVENT_RECEIVED)
- ❌ **No actual responses sent** (needs PAGE_ACCESS_TOKEN)

---

## 📊 **Food Menu Codes to Test**

| Code | Item | Expected Response |
|------|------|------------------|
| F001 | Margherita Pizza | $12.99 - Asks for address |
| F002 | Chicken Burger | $9.99 - Asks for address |
| F003 | Caesar Salad | $8.99 - Asks for address |
| F004 | Spaghetti Carbonara | $14.99 - Asks for address |
| F005 | Fish & Chips | $13.99 - Asks for address |
| F006 | Vegetable Stir Fry | $10.99 - Asks for address |
| F007 | BBQ Ribs | $18.99 - Asks for address |
| F008 | Chocolate Cake | $6.99 - Asks for address |

---

## 🛠️ **How to Modify Tests**

### **Test Different Food Items:**
In any food order request, change the text:
```json
"text": "F003"  // Change to any code F001-F008
```

### **Test Different Addresses:**
```json
"text": "456 Oak Street, Los Angeles, CA 90210"
```

### **Test Different Phone Numbers:**
```json
"text": "+1-555-987-6543"
```

### **Test Different User IDs:**
```json
"sender": {
  "id": "different_user_123"  // Simulate different customers
}
```

---

## 📈 **Advanced Testing**

### **Load Testing:**
- Run multiple requests with different user IDs
- Test concurrent orders
- Verify session management

### **Error Testing:**
- Send malformed JSON
- Test empty messages
- Test very long addresses/phone numbers

### **Flow Testing:**
- Start order, then type "menu" (should work)
- Start multiple orders with same user ID
- Test out-of-sequence inputs

---

## 🔍 **Debugging Tips**

### **If Tests Fail:**
1. **Check Vercel Logs**:
   ```bash
   vercel logs e-commerce-messenger-bot
   ```

2. **Common Issues**:
   - Environment variables not set
   - JSON formatting errors
   - Network timeouts

3. **Expected Responses**:
   - `EVENT_RECEIVED` = Message processed successfully
   - `Forbidden` = Environment variable issue
   - `404` = Wrong endpoint
   - No response = Server error

### **Monitor Console Logs:**
Your bot logs these events:
- `WEBHOOK_VERIFIED` - Verification successful
- `Message sent successfully!` - Response sent to Facebook
- `Unable to send message:` - Error sending response

---

## 🎯 **Next Steps After Testing**

1. **Set Environment Variables on Vercel**
2. **Connect to Facebook Messenger**
3. **Test with Real Facebook Messages**
4. **Add More Food Items**
5. **Customize Responses**

Your bot logic is working! The Postman tests confirm the message processing is functioning correctly. Now you just need to connect it to Facebook! 🚀
