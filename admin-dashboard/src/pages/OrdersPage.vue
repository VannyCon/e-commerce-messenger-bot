<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="text-h4 text-weight-bold q-my-none">Orders Management</h4>
        <p class="text-grey-6">Manage and track all customer orders</p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh"
          @click="loadOrders"
          :loading="loading"
          class="q-mr-sm"
        />
      </div>
    </div>

    <!-- Filters -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-gutter-md items-center">
          <div class="col-auto">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              label="Filter by Status"
              outlined
              clearable
              style="min-width: 200px"
              @update:model-value="loadOrders"
            />
          </div>
          <div class="col-auto">
            <q-input
              v-model="searchQuery"
              label="Search orders..."
              outlined
              clearable
              debounce="300"
              @update:model-value="loadOrders"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn-toggle
              v-model="viewMode"
              :options="[
                { label: 'Table', value: 'table', icon: 'table_view' },
                { label: 'Cards', value: 'cards', icon: 'view_module' }
              ]"
              outline
              color="primary"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Table View -->
    <q-card v-if="viewMode === 'table'">
      <q-table
        :rows="filteredOrders"
        :columns="orderColumns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @request="onTableRequest"
        selection="multiple"
        v-model:selected="selectedOrders"
      >
        <!-- Status Column -->
        <template #body-cell-order_status="props">
          <q-td :props="props">
            <q-select
              v-model="props.row.order_status"
              :options="statusSelectOptions"
              outlined
              dense
              @update:model-value="updateOrderStatus(props.row.id, $event)"
              :color="getStatusColor(props.row.order_status)"
            />
          </q-td>
        </template>

        <!-- Amount Column -->
        <template #body-cell-total_amount="props">
          <q-td :props="props">
            <div class="text-weight-bold text-positive">
              ${{ Number(props.value).toFixed(2) }}
            </div>
          </q-td>
        </template>

        <!-- Date Column -->
        <template #body-cell-created_at="props">
          <q-td :props="props">
            <div>{{ formatDate(props.value) }}</div>
            <div class="text-caption text-grey-6">
              {{ getTimeAgo(props.value) }}
            </div>
          </q-td>
        </template>

        <!-- Items Column -->
        <template #body-cell-items="props">
          <q-td :props="props">
            <q-btn
              flat
              color="primary"
              :label="`${props.value?.length || 0} items`"
              size="sm"
              @click="showOrderItems(props.row)"
            />
          </q-td>
        </template>

        <!-- Actions Column -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn-group flat>
              <q-btn
                flat
                color="primary"
                icon="visibility"
                size="sm"
                @click="viewOrderDetails(props.row)"
              >
                <q-tooltip>View Details</q-tooltip>
              </q-btn>
              <q-btn
                flat
                color="positive"
                icon="phone"
                size="sm"
                @click="callCustomer(props.row.customer_phone)"
              >
                <q-tooltip>Call Customer</q-tooltip>
              </q-btn>
            </q-btn-group>
          </q-td>
        </template>

        <!-- Top Section -->
        <template #top-right>
          <q-btn-group v-if="selectedOrders.length > 0">
            <q-btn
              color="positive"
              icon="check"
              label="Mark Delivered"
              @click="bulkUpdateStatus('delivered')"
            />
            <q-btn
              color="negative"
              icon="cancel"
              label="Cancel"
              @click="bulkUpdateStatus('cancelled')"
            />
          </q-btn-group>
        </template>
      </q-table>
    </q-card>

    <!-- Cards View -->
    <div v-else class="row q-gutter-md">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card class="order-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-h6 text-weight-bold">
                  {{ order.order_number }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ formatDate(order.created_at) }}
                </div>
              </div>
              <div class="col-auto">
                <q-chip
                  :color="getStatusColor(order.order_status)"
                  text-color="white"
                  size="md"
                >
                  {{ order.order_status }}
                </q-chip>
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-weight-medium q-mb-xs">
                <q-icon name="person" class="q-mr-xs" />
                {{ order.customer_phone }}
              </div>
              <div class="text-caption text-grey-6">
                <q-icon name="location_on" class="q-mr-xs" />
                {{ order.delivery_address }}
              </div>
            </div>

            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-weight-bold text-positive">
                  ${{ Number(order.total_amount).toFixed(2) }}
                </div>
                <div class="text-caption">
                  {{ order.items?.length || 0 }} items
                </div>
              </div>
              <div class="col-auto">
                <q-btn-group>
                  <q-btn
                    flat
                    color="primary"
                    icon="visibility"
                    @click="viewOrderDetails(order)"
                  />
                  <q-btn
                    flat
                    color="positive"
                    icon="phone"
                    @click="callCustomer(order.customer_phone)"
                  />
                </q-btn-group>
              </div>
            </div>
          </q-card-section>

          <q-card-actions>
            <q-select
              v-model="order.order_status"
              :options="statusSelectOptions"
              outlined
              dense
              class="full-width"
              @update:model-value="updateOrderStatus(order.id, $event)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Order Details Dialog -->
    <q-dialog v-model="showOrderDialog" :maximized="$q.screen.lt.sm">
      <q-card style="min-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Order Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedOrder">
          <div class="row q-gutter-lg">
            <div class="col-12 col-md-6">
              <div class="text-h6 q-mb-md">Order Information</div>
              <q-list dense>
                <q-item>
                  <q-item-section>
                    <q-item-label>Order Number</q-item-label>
                    <q-item-label caption>{{ selectedOrder.order_number }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label>Customer Phone</q-item-label>
                    <q-item-label caption>{{ selectedOrder.customer_phone }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label>Delivery Address</q-item-label>
                    <q-item-label caption>{{ selectedOrder.delivery_address }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label>Total Amount</q-item-label>
                    <q-item-label caption class="text-positive text-weight-bold">
                      ${{ Number(selectedOrder.total_amount).toFixed(2) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label>Status</q-item-label>
                    <q-item-label caption>
                      <q-chip
                        :color="getStatusColor(selectedOrder.order_status)"
                        text-color="white"
                        size="sm"
                      >
                        {{ selectedOrder.order_status }}
                      </q-chip>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-h6 q-mb-md">Order Items</div>
              <q-list bordered>
                <q-item
                  v-for="item in selectedOrder.items"
                  :key="item.product_code"
                >
                  <q-item-section>
                    <q-item-label>{{ item.product_name }}</q-item-label>
                    <q-item-label caption>
                      {{ item.quantity }} × ${{ Number(item.unit_price).toFixed(2) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-bold">
                      ${{ Number(item.total_price).toFixed(2) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
          <q-btn
            label="Call Customer"
            color="positive"
            icon="phone"
            @click="selectedOrder?.customer_phone && callCustomer(selectedOrder.customer_phone)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiService, type Order } from 'src/services/api'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const orders = ref<Order[]>([])
const selectedOrders = ref<Order[]>([])
const statusFilter = ref<string | null>(null)
const searchQuery = ref('')
const viewMode = ref('table')
const showOrderDialog = ref(false)
const selectedOrder = ref<Order | null>(null)

const pagination = ref({
  sortBy: 'created_at',
  descending: true,
  page: 1,
  rowsPerPage: 10
})

const statusOptions = [
  { label: 'All Orders', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' }
]

const statusSelectOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' }
]

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
    name: 'items',
    label: 'Items',
    align: 'center' as const,
    field: 'items'
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

const filteredOrders = computed(() => {
  let filtered = [...orders.value]

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.order_status === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order =>
      order.order_number.toLowerCase().includes(query) ||
      order.customer_phone.toLowerCase().includes(query) ||
      order.delivery_address.toLowerCase().includes(query)
    )
  }

  return filtered
})

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

function formatDate(dateString: string) {
  return format(parseISO(dateString), 'MMM dd, yyyy HH:mm')
}

function getTimeAgo(dateString: string) {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
}

async function loadOrders() {
  loading.value = true
  try {
    orders.value = await apiService.getOrders(statusFilter.value || undefined)
  } catch (error) {
    console.error('Error loading orders:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load orders'
    })
  } finally {
    loading.value = false
  }
}

async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await apiService.updateOrderStatus(orderId, newStatus)
    $q.notify({
      type: 'positive',
      message: 'Order status updated successfully'
    })
    await loadOrders()
  } catch (error) {
    console.error('Error updating order status:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to update order status'
    })
  }
}

async function bulkUpdateStatus(status: string) {
  if (selectedOrders.value.length === 0) return

  try {
    await Promise.all(
      selectedOrders.value.map(order => 
        apiService.updateOrderStatus(order.id, status)
      )
    )
    $q.notify({
      type: 'positive',
      message: `${selectedOrders.value.length} orders updated successfully`
    })
    selectedOrders.value = []
    await loadOrders()
  } catch (error) {
    console.error('Error bulk updating orders:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to update orders'
    })
  }
}

function viewOrderDetails(order: Order) {
  selectedOrder.value = order
  showOrderDialog.value = true
}

function showOrderItems(order: Order) {
  viewOrderDetails(order)
}

function callCustomer(phone: string) {
  if (phone) {
    window.open(`tel:${phone}`)
  }
}

interface TableRequestProps {
  pagination: {
    sortBy: string
    descending: boolean
    page: number
    rowsPerPage: number
  }
}

function onTableRequest(props: TableRequestProps) {
  pagination.value = props.pagination
  void loadOrders()
}

onMounted(() => {
  void loadOrders()
})
</script>

<style scoped>
.order-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
</style>
