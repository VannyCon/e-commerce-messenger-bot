<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-gradient-to-r">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="text-weight-bold">
          <q-icon name="restaurant" size="sm" class="q-mr-sm" />
          Food Order Admin
        </q-toolbar-title>

        <q-space />

        <!-- Real-time status indicator -->
        <q-chip
          :color="isOnline ? 'positive' : 'negative'"
          text-color="white"
          icon="circle"
          size="sm"
          class="q-mr-md"
        >
          {{ isOnline ? 'Online' : 'Offline' }}
        </q-chip>

        <!-- Notifications -->
        <q-btn flat round dense icon="notifications">
          <q-badge v-if="pendingOrdersCount > 0" color="red" floating>
            {{ pendingOrdersCount }}
          </q-badge>
          <q-menu>
            <q-list style="min-width: 300px">
              <q-item-label header>Recent Orders</q-item-label>
              <q-item
                v-for="order in recentOrders"
                :key="order.id"
                clickable
                @click="goToOrder(order.id)"
              >
                <q-item-section avatar>
                  <q-icon name="shopping_cart" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Order {{ order.order_number }}</q-item-label>
                  <q-item-label caption>${{ order.total_amount }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    :color="getStatusColor(order.order_status)"
                    text-color="white"
                    size="sm"
                  >
                    {{ order.order_status }}
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- User menu -->
        <q-btn flat round dense icon="account_circle">
          <q-menu>
            <q-list>
              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
      :width="280"
    >
      <q-scroll-area class="fit">
        <!-- Logo section -->
        <div class="q-pa-md text-center bg-primary text-white">
          <div class="text-h6 text-weight-bold">
            <q-icon name="restaurant" size="md" />
            <div>Food Admin</div>
          </div>
          <div class="text-caption">Order Management System</div>
        </div>

        <q-list>
          <!-- Dashboard -->
          <q-item
            clickable
            :active="router.currentRoute.value.name === 'dashboard'"
            active-class="text-primary bg-blue-1"
            @click="router.push('/')"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Orders -->
          <q-item
            clickable
            :active="router.currentRoute.value.name === 'orders'"
            active-class="text-primary bg-blue-1"
            @click="router.push('/orders')"
          >
            <q-item-section avatar>
              <q-icon name="receipt_long" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Orders</q-item-label>
            </q-item-section>
            <q-item-section side v-if="pendingOrdersCount > 0">
              <q-chip color="red" text-color="white" size="sm">
                {{ pendingOrdersCount }}
              </q-chip>
            </q-item-section>
          </q-item>

          <!-- Products -->
          <q-item
            clickable
            :active="router.currentRoute.value.name === 'products'"
            active-class="text-primary bg-blue-1"
            @click="router.push('/products')"
          >
            <q-item-section avatar>
              <q-icon name="inventory_2" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Products</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Customers -->
          <q-item
            clickable
            :active="router.currentRoute.value.name === 'customers'"
            active-class="text-primary bg-blue-1"
            @click="router.push('/customers')"
          >
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Customers</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <!-- Analytics -->
          <q-item
            clickable
            :active="router.currentRoute.value.name === 'analytics'"
            active-class="text-primary bg-blue-1"
            @click="router.push('/analytics')"
          >
            <q-item-section avatar>
              <q-icon name="analytics" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Analytics</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Settings -->
          <q-item
            clickable
            :active="router.currentRoute.value.name === 'settings'"
            active-class="text-primary bg-blue-1"
            @click="router.push('/settings')"
          >
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Settings</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiService, type Order, type SupabasePayload } from 'src/services/api'

const router = useRouter()
const leftDrawerOpen = ref(false)
const isOnline = ref(true)
const pendingOrdersCount = ref(0)
const recentOrders = ref<Order[]>([])

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function goToOrder(orderId: string) {
  void router.push(`/orders/${orderId}`)
}

function getStatusColor(status: string) {
  const colors: { [key: string]: string } = {
    pending: 'orange',
    confirmed: 'blue',
    preparing: 'purple',
    out_for_delivery: 'teal',
    delivered: 'green',
    cancelled: 'red'
  }
  return colors[status] || 'grey'
}

async function loadRecentOrders() {
  try {
    const orders = await apiService.getOrders()
    recentOrders.value = orders.slice(0, 5)
    pendingOrdersCount.value = orders.filter(o => o.order_status === 'pending').length
  } catch (error) {
    console.error('Error loading recent orders:', error)
  }
}

// Real-time subscription
let subscription: ReturnType<typeof apiService.subscribeToOrders> | null = null

onMounted(async () => {
  await loadRecentOrders()
  
  // Subscribe to real-time order updates
  subscription = apiService.subscribeToOrders((payload: SupabasePayload) => {
    console.log('Order update:', payload)
    void loadRecentOrders() // Reload orders when there's an update
  })

  // Check online status
  const handleOnline = () => { isOnline.value = true }
  const handleOffline = () => { isOnline.value = false }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Initial status
  isOnline.value = navigator.onLine
})

onUnmounted(() => {
  if (subscription) {
    void subscription.unsubscribe()
  }
  window.removeEventListener('online', () => {})
  window.removeEventListener('offline', () => {})
})
</script>

<style scoped>
.bg-gradient-to-r {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>