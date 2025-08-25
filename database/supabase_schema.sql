-- Supabase Database Schema for Food Ordering System
-- Execute these commands in your Supabase SQL editor

-- Enable Row Level Security (RLS) and required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for order status
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- 1. Customers Table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    messenger_id VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products Table (replaces hardcoded food menu)
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- F001, F002, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL, -- ORD-20240101-001
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    messenger_id VARCHAR(255) NOT NULL, -- For quick lookup
    delivery_address TEXT NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    order_status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'cash_on_delivery',
    notes TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Order Items Table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_code VARCHAR(10) NOT NULL, -- Store code for reference
    product_name VARCHAR(255) NOT NULL, -- Store name at time of order
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Order Status History Table (for tracking)
CREATE TABLE order_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    changed_by VARCHAR(255), -- admin username or 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_messenger_id ON customers(messenger_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_messenger_id ON orders(messenger_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_active ON products(is_active);

-- Create functions for auto-generating order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    today_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    counter INTEGER;
    order_num VARCHAR(20);
BEGIN
    -- Get today's order count
    SELECT COUNT(*) + 1 INTO counter
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: ORD-20240101-001
    order_num := 'ORD-' || today_date || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to track order status changes
CREATE OR REPLACE FUNCTION track_order_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if status actually changed
    IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
        INSERT INTO order_status_history (order_id, status, notes, changed_by)
        VALUES (NEW.id, NEW.order_status, 'Status updated', 'system');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_order_status
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION track_order_status_changes();

-- Insert sample products based on your existing menu
INSERT INTO products (code, name, description, price, category, is_active) VALUES
('F001', 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 12.99, 'Pizza', true),
('F002', 'Chicken Burger', 'Grilled chicken breast with lettuce, tomato, and mayo', 9.99, 'Burgers', true),
('F003', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing and croutons', 8.99, 'Salads', true),
('F004', 'Spaghetti Carbonara', 'Creamy pasta with bacon, eggs, and parmesan cheese', 14.99, 'Pasta', true),
('F005', 'Fish & Chips', 'Beer-battered fish with crispy fries', 13.99, 'Seafood', true),
('F006', 'Vegetable Stir Fry', 'Mixed vegetables with teriyaki sauce and rice', 10.99, 'Asian', true),
('F007', 'BBQ Ribs', 'Slow-cooked ribs with BBQ sauce and coleslaw', 18.99, 'Grilled', true),
('F008', 'Chocolate Cake', 'Rich chocolate cake with chocolate frosting', 6.99, 'Desserts', true);

-- Enable Row Level Security (optional - for multi-tenant apps)
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create a view for easy order management
CREATE VIEW order_details AS
SELECT 
    o.id,
    o.order_number,
    o.messenger_id,
    c.name as customer_name,
    c.phone as customer_phone,
    o.delivery_address,
    o.total_amount,
    o.currency,
    o.order_status,
    o.payment_status,
    o.payment_method,
    o.notes,
    o.estimated_delivery_time,
    o.delivered_at,
    o.created_at,
    o.updated_at,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'product_code', oi.product_code,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
        )
    ) as items
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY 
    o.id, o.order_number, o.messenger_id, c.name, c.phone, 
    o.delivery_address, o.total_amount, o.currency, o.order_status, 
    o.payment_status, o.payment_method, o.notes, o.estimated_delivery_time, 
    o.delivered_at, o.created_at, o.updated_at
ORDER BY o.created_at DESC;
