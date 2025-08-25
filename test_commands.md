# 🚀 Quick Test Commands for Your Bot

## **Using cURL (Command Line)**

### **1. Health Check**
```bash
curl https://e-commerce-messenger-bot.vercel.app/
```

### **2. Webhook Verification Test**
```bash
curl "https://e-commerce-messenger-bot.vercel.app/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=food_bot_secure_token_2024"
```

### **3. Test Menu Request**
```bash
curl -X POST https://e-commerce-messenger-bot.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "messaging": [{
        "sender": {"id": "test_user_123"},
        "recipient": {"id": "test_page_456"},
        "timestamp": 1234567890,
        "message": {
          "mid": "test_message_id",
          "text": "menu"
        }
      }]
    }]
  }'
```

### **4. Test Food Order (Pizza)**
```bash
curl -X POST https://e-commerce-messenger-bot.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "messaging": [{
        "sender": {"id": "test_user_123"},
        "recipient": {"id": "test_page_456"},
        "timestamp": 1234567890,
        "message": {
          "mid": "test_message_id",
          "text": "F001"
        }
      }]
    }]
  }'
```

### **5. Test Address Input**
```bash
curl -X POST https://e-commerce-messenger-bot.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "messaging": [{
        "sender": {"id": "test_user_123"},
        "recipient": {"id": "test_page_456"},
        "timestamp": 1234567890,
        "message": {
          "mid": "test_message_id",
          "text": "123 Main Street, New York, NY 10001"
        }
      }]
    }]
  }'
```

## **Using PowerShell (Windows)**

### **1. Health Check**
```powershell
Invoke-RestMethod -Uri "https://e-commerce-messenger-bot.vercel.app/" -Method GET
```

### **2. Test Menu Request**
```powershell
$body = @{
  object = "page"
  entry = @(
    @{
      messaging = @(
        @{
          sender = @{ id = "test_user_123" }
          recipient = @{ id = "test_page_456" }
          timestamp = 1234567890
          message = @{
            mid = "test_message_id"
            text = "menu"
          }
        }
      )
    }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "https://e-commerce-messenger-bot.vercel.app/webhook" -Method POST -Body $body -ContentType "application/json"
```

## **Expected Responses**

### **✅ Health Check Response:**
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

### **✅ Successful Message Processing:**
```
EVENT_RECEIVED
```

### **❌ Environment Variable Issues:**
```
Forbidden
```

## **Test All Food Codes**

Replace the `"text"` field with these codes:

- `F001` - Margherita Pizza ($12.99)
- `F002` - Chicken Burger ($9.99)  
- `F003` - Caesar Salad ($8.99)
- `F004` - Spaghetti Carbonara ($14.99)
- `F005` - Fish & Chips ($13.99)
- `F006` - Vegetable Stir Fry ($10.99)
- `F007` - BBQ Ribs ($18.99)
- `F008` - Chocolate Cake ($6.99)

## **Testing Tips**

1. **Start with Health Check** - Verify deployment
2. **Test Webhook Verification** - Will fail until env vars are set
3. **Test Message Flow** - Should return `EVENT_RECEIVED`
4. **Monitor Logs** - Check Vercel dashboard for errors
5. **Different User IDs** - Use different `sender.id` to test multiple users

Your bot is working! You just need to set the environment variables on Vercel to complete the Facebook integration! 🎉
