const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jsneposfxfuyweogmmrl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_ANON_KEY is required in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
class DatabaseService {
  
  // Customer management
  async findOrCreateCustomer(messenger_id, phone = null, address = null, name = null) {
    try {
      // First try to find existing customer
      let { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('messenger_id', messenger_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // If customer doesn't exist, create new one
      if (!customer) {
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert([{
            messenger_id,
            phone,
            address,
            name
          }])
          .select()
          .single();

        if (createError) throw createError;
        return newCustomer;
      }

      // Update existing customer with new info if provided
      const updateData = {};
      if (phone && phone !== customer.phone) updateData.phone = phone;
      if (address && address !== customer.address) updateData.address = address;
      if (name && name !== customer.name) updateData.name = name;

      if (Object.keys(updateData).length > 0) {
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customer.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedCustomer;
      }

      return customer;
    } catch (error) {
      console.error('Error managing customer:', error);
      throw error;
    }
  }

  // Product management
  async getProductByCode(code) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('code', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Order management
  async createOrder(orderData) {
    try {
      // Find or create customer
      const customer = await this.findOrCreateCustomer(
        orderData.messenger_id,
        orderData.customer_phone,
        orderData.delivery_address,
        orderData.customer_name
      );

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: customer.id,
          messenger_id: orderData.messenger_id,
          delivery_address: orderData.delivery_address,
          customer_phone: orderData.customer_phone,
          customer_name: orderData.customer_name || customer.name,
          total_amount: orderData.total_amount,
          currency: orderData.currency || 'USD',
          order_status: 'pending',
          payment_method: orderData.payment_method || 'cash_on_delivery',
          notes: orderData.notes,
          estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status, notes = null) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          order_status: status,
          ...(status === 'delivered' && { delivered_at: new Date() })
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Add status history entry
      if (notes) {
        await supabase
          .from('order_status_history')
          .insert([{
            order_id: orderId,
            status: status,
            notes: notes,
            changed_by: 'admin'
          }]);
      }

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status = null) {
    try {
      let query = supabase
        .from('order_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('order_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from('order_details')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  // Analytics functions
  async getOrderStats() {
    try {
      const { data: totalOrders, error: totalError } = await supabase
        .from('orders')
        .select('count', { count: 'exact' });

      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('count', { count: 'exact' })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { data: pendingOrders, error: pendingError } = await supabase
        .from('orders')
        .select('count', { count: 'exact' })
        .eq('order_status', 'pending');

      const { data: revenue, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('order_status', 'delivered');

      if (totalError || todayError || pendingError || revenueError) {
        throw totalError || todayError || pendingError || revenueError;
      }

      const totalRevenue = revenue?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

      return {
        totalOrders: totalOrders[0]?.count || 0,
        todayOrders: todayOrders[0]?.count || 0,
        pendingOrders: pendingOrders[0]?.count || 0,
        totalRevenue: totalRevenue.toFixed(2)
      };
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  }

  // Product CRUD operations
  async createProduct(productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
}

const db = new DatabaseService();

module.exports = {
  supabase,
  db
};
