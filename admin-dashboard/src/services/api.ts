import { supabase } from '../boot/supabase'

export interface Product {
  id: string
  code: string
  name: string
  description: string
  price: number
  image_url?: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  messenger_id: string
  phone?: string
  address?: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  messenger_id: string
  delivery_address: string
  customer_phone: string
  customer_name?: string
  total_amount: number
  currency: string
  order_status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method: string
  notes?: string
  estimated_delivery_time?: string
  delivered_at?: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_code: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface OrderStats {
  totalOrders: number
  todayOrders: number
  pendingOrders: number
  totalRevenue: string
}

export interface OrderUpdateData {
  order_status: string
  updated_at: string
  delivered_at?: string
}

export interface SupabasePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
  schema: string
  table: string
}

export interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

class ApiService {
  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }

  // Orders
  async getOrders(status?: string): Promise<Order[]> {
    let query = supabase
      .from('order_details')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('order_status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getOrderById(id: string): Promise<Order> {
    const { data, error } = await supabase
      .from('order_details')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
    const updateData: OrderUpdateData = { 
      order_status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Add to status history if notes provided
    if (notes) {
      await supabase
        .from('order_status_history')
        .insert([{
          order_id: id,
          status: status,
          notes: notes,
          changed_by: 'admin'
        }])
    }

    return data
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Analytics
  async getOrderStats(): Promise<OrderStats> {
    // Total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Today's orders
    const today = new Date().toISOString().split('T')[0]
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    // Pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('order_status', 'pending')

    // Total revenue (delivered orders only)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('order_status', 'delivered')

    const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

    return {
      totalOrders: totalOrders || 0,
      todayOrders: todayOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalRevenue: totalRevenue.toFixed(2)
    }
  }

  // Real-time subscriptions
  subscribeToOrders(callback: (payload: SupabasePayload) => void) {
    return supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
      .subscribe()
  }

  async getDailySales(days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('order_status', 'delivered')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const salesByDate: { [date: string]: number } = {}
    data?.forEach(order => {
      const date = order.created_at.split('T')[0]
      salesByDate[date] = (salesByDate[date] || 0) + parseFloat(order.total_amount)
    })

    return salesByDate
  }

  async getTopProducts(limit: number = 5) {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        product_name,
        quantity,
        total_price,
        orders!inner(order_status)
      `)
      .eq('orders.order_status', 'delivered')

    if (error) throw error

    // Group by product and sum quantities
    const productStats: { [name: string]: { quantity: number, revenue: number } } = {}
    data?.forEach(item => {
      if (!productStats[item.product_name]) {
        productStats[item.product_name] = { quantity: 0, revenue: 0 }
      }
      const stats = productStats[item.product_name]
      if (stats) {
        stats.quantity += item.quantity
        stats.revenue += parseFloat(item.total_price)
      }
    })

    // Convert to array and sort by quantity
    return Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
  }
}

export const apiService = new ApiService()
