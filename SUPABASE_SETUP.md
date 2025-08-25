# Supabase Database Setup Guide

This guide will help you set up the Supabase database for your Food Ordering System.

## 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: "food-ordering-system"
5. Enter database password (save this securely)
6. Choose region closest to your users
7. Click "Create new project"

## 2. Set Up Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the entire content from `database/supabase_schema.sql`
4. Click "Run" to execute the schema

This will create:
- `customers` table for messenger users
- `products` table for food menu items
- `orders` table for order management
- `order_items` table for order line items
- `order_status_history` table for tracking changes
- Various triggers and functions for automation

## 3. Configure Environment Variables

### For Messenger Bot (Backend)

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```env
   SUPABASE_URL=https://jsneposfxfuyweogmmrl.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

3. Get your Supabase Anon Key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the "anon public" key
   - Replace `your_actual_anon_key_here` with this key

### For Admin Dashboard (Frontend)

1. In the `admin-dashboard` folder, create `.env` file:
   ```env
   SUPABASE_URL=https://jsneposfxfuyweogmmrl.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

## 4. Install Dependencies

### Backend Dependencies
```bash
npm install @supabase/supabase-js
```

### Frontend Dependencies
```bash
cd admin-dashboard
npm install @supabase/supabase-js axios chart.js vue-chartjs date-fns
```

## 5. Configure Row Level Security (Optional)

For production security, you can enable RLS:

1. Go to Supabase Dashboard → Authentication → Policies
2. For each table, you can add policies to restrict access
3. Example policy for admin-only access:
   ```sql
   CREATE POLICY "Admin access" ON orders
   FOR ALL USING (auth.role() = 'authenticated');
   ```

## 6. Test the Setup

### Test Backend Integration
```bash
npm start
```

Check console for: "✅ Loaded X products from Supabase"

### Test Frontend Dashboard
```bash
cd admin-dashboard
npm run dev
```

Open browser to: http://localhost:9000

## 7. Deployment

### Deploy Backend to Vercel

1. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `VERIFY_TOKEN`
   - `PAGE_ACCESS_TOKEN`

2. Deploy:
   ```bash
   vercel --prod
   ```

### Deploy Frontend Dashboard

You can deploy the admin dashboard separately:

1. Build the dashboard:
   ```bash
   cd admin-dashboard
   npm run build
   ```

2. Deploy to Vercel, Netlify, or any static hosting service

## 8. Initial Data

The schema automatically creates sample products (F001-F008) based on your existing menu. You can:

1. View/edit products in the admin dashboard
2. Add new products through the Products page
3. Monitor orders as they come in from Messenger

## 9. Features Available

### Real-time Order Monitoring
- Orders automatically appear in dashboard when placed via Messenger
- Real-time status updates
- Push notifications for new orders

### Product Management
- Add, edit, delete menu items
- Manage categories and pricing
- Upload product images
- Enable/disable products

### Analytics
- Daily sales charts
- Top-selling products
- Revenue tracking
- Order statistics

### Order Management
- View all orders in table or card view
- Update order status
- Call customers directly
- Bulk operations
- Order history tracking

## 10. Troubleshooting

### Common Issues:

1. **"Error loading products from Supabase"**
   - Check your SUPABASE_URL and SUPABASE_ANON_KEY
   - Ensure the schema was executed correctly
   - Check Supabase logs in dashboard

2. **"Failed to save order"**
   - Verify RLS policies aren't blocking inserts
   - Check network connectivity
   - Review browser console for errors

3. **Dashboard not loading data**
   - Ensure admin dashboard has correct environment variables
   - Check browser developer tools for API errors
   - Verify CORS settings in Supabase if needed

## 11. Security Best Practices

1. **Never commit real API keys to Git**
2. **Use environment variables for all secrets**
3. **Enable RLS for production**
4. **Regularly rotate your Supabase service role key**
5. **Monitor your Supabase logs for suspicious activity**

## 12. Next Steps

- Set up automated backups
- Configure email notifications for orders
- Add user authentication for admin dashboard
- Implement inventory tracking
- Set up analytics tracking with Google Analytics

For support, check the Supabase documentation: https://supabase.com/docs
