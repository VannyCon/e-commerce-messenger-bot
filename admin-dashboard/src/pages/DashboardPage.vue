<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="text-h4 text-weight-bold q-my-none">Dashboard</h4>
        <p class="text-grey-6">Welcome to your food ordering control center</p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh"
          @click="loadData"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-gutter-lg q-mb-xl">
      <div class="col-12 col-md-3">
        <q-card class="stat-card bg-gradient-blue">
          <q-card-section class="text-center text-white">
            <q-icon name="receipt_long" size="3rem" class="q-mb-md" />
            <div class="text-h3 text-weight-bold">{{ stats.totalOrders }}</div>
            <div class="text-h6">Total Orders</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="stat-card bg-gradient-green">
          <q-card-section class="text-center text-white">
            <q-icon name="today" size="3rem" class="q-mb-md" />
            <div class="text-h3 text-weight-bold">{{ stats.todayOrders }}</div>
            <div class="text-h6">Today's Orders</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="stat-card bg-gradient-orange">
          <q-card-section class="text-center text-white">
            <q-icon name="pending" size="3rem" class="q-mb-md" />
            <div class="text-h3 text-weight-bold">{{ stats.pendingOrders }}</div>
            <div class="text-h6">Pending Orders</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="stat-card bg-gradient-purple">
          <q-card-section class="text-center text-white">
            <q-icon name="attach_money" size="3rem" class="q-mb-md" />
            <div class="text-h3 text-weight-bold">${{ stats.totalRevenue }}</div>
            <div class="text-h6">Total Revenue</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="row q-gutter-lg q-mb-xl">
      <!-- Sales Chart -->
      <div class="col-12 col-md-8">
        <q-card class="chart-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="trending_up" class="q-mr-sm" />
              Sales Overview (Last 7 Days)
            </div>
            <div style="height: 300px">
              <canvas ref="salesChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Top Products -->
      <div class="col-12 col-md-4">
        <q-card class="chart-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="star" class="q-mr-sm" />
              Top Products
            </div>
            <div v-if="topProducts.length === 0" class="text-center text-grey-5 q-pa-xl">
              <q-icon name="inventory_2" size="3rem" />
              <div class="q-mt-md">No data available</div>
            </div>
            <q-list v-else>
              <q-item
                v-for="(product, index) in topProducts"
                :key="product.name"
                class="q-mb-sm"
              >
                <q-item-section avatar>
                  <q-avatar :color="getProductColor(index)" text-color="white" size="md">
                    {{ index + 1 }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ product.name }}</q-item-label>
                  <q-item-label caption>{{ product.quantity }} sold</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="text-weight-bold text-positive">${{ product.revenue.toFixed(2) }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="row">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-weight-bold">
                  <q-icon name="schedule" class="q-mr-sm" />
                  Recent Orders
                </div>
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  color="primary"
                  label="View All"
                  @click="router.push('/orders')"
                />
              </div>
            </div>
          </q-card-section>

          <q-table
            :rows="recentOrders"
            :columns="orderColumns"
            row-key="id"
            :loading="loading"
            flat
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-order_status="props">
              <q-td :props="props">
                <q-chip
                  :color="getStatusColor(props.value)"
                  text-color="white"
                  size="sm"
                >
                  {{ props.value }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-total_amount="props">
              <q-td :props="props">
                <div class="text-weight-bold">${{ props.value }}</div>
              </q-td>
            </template>

            <template #body-cell-created_at="props">
              <q-td :props="props">
                {{ formatDate(props.value) }}
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  color="primary"
                  icon="visibility"
                  size="sm"
                  @click="viewOrder(props.row.id)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { apiService, type Order, type OrderStats, type TopProduct } from 'src/services/api'
import { format, parseISO } from 'date-fns'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const loading = ref(false)
const stats = ref<OrderStats>({
  totalOrders: 0,
  todayOrders: 0,
  pendingOrders: 0,
  totalRevenue: '0.00'
})
const recentOrders = ref<Order[]>([])
const topProducts = ref<TopProduct[]>([])
const salesChart = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

const orderColumns = [
  {
    name: 'order_number',
    label: 'Order #',
    align: 'left' as const,
    field: 'order_number',
    sortable: true
  },
  {
    name: 'customer_phone',
    label: 'Customer',
    align: 'left' as const,
    field: 'customer_phone',
    sortable: true
  },
  {
    name: 'total_amount',
    label: 'Amount',
    align: 'right' as const,
    field: 'total_amount',
    sortable: true
  },
  {
    name: 'order_status',
    label: 'Status',
    align: 'center' as const,
    field: 'order_status',
    sortable: true
  },
  {
    name: 'created_at',
    label: 'Date',
    align: 'left' as const,
    field: 'created_at',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: 'actions'
  }
]

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

function getProductColor(index: number) {
  const colors = ['primary', 'secondary', 'accent', 'positive', 'negative']
  return colors[index % colors.length]
}

function formatDate(dateString: string) {
  return format(parseISO(dateString), 'MMM dd, yyyy HH:mm')
}

function viewOrder(orderId: string) {
  void router.push(`/orders/${orderId}`)
}

async function loadStats() {
  try {
    stats.value = await apiService.getOrderStats()
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

async function loadRecentOrders() {
  try {
    const orders = await apiService.getOrders()
    recentOrders.value = orders.slice(0, 10)
  } catch (error) {
    console.error('Error loading recent orders:', error)
  }
}

async function loadTopProducts() {
  try {
    topProducts.value = await apiService.getTopProducts(5)
  } catch (error) {
    console.error('Error loading top products:', error)
  }
}

async function loadSalesChart() {
  try {
    const salesData = await apiService.getDailySales(7)
    
    await nextTick()
    
    if (salesChart.value) {
      const ctx = salesChart.value.getContext('2d')
      
      if (chartInstance) {
        chartInstance.destroy()
      }
      
      const dates = Object.keys(salesData).sort()
      const values = dates.map(date => salesData[date] || 0)
      
      chartInstance = new Chart(ctx!, {
        type: 'line',
        data: {
          labels: dates.map(date => format(parseISO(date), 'MMM dd')),
          datasets: [{
            label: 'Sales ($)',
            data: values,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value
                }
              }
            }
          }
        }
      })
    }
  } catch (error) {
    console.error('Error loading sales chart:', error)
  }
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      loadRecentOrders(),
      loadTopProducts(),
      loadSalesChart()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped>
.stat-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.chart-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.bg-gradient-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg-gradient-green {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.bg-gradient-orange {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.bg-gradient-purple {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}
</style>
