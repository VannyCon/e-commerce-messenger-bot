<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="text-h4 text-weight-bold q-my-none">Products Management</h4>
        <p class="text-grey-6">Manage your food menu and inventory</p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Add Product"
          @click="showProductDialog = true"
          class="q-mr-sm"
        />
        <q-btn
          color="secondary"
          icon="refresh"
          label="Refresh"
          @click="loadProducts"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Filters -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-gutter-md items-center">
          <div class="col-auto">
            <q-select
              v-model="categoryFilter"
              :options="categoryOptions"
              label="Filter by Category"
              outlined
              clearable
              style="min-width: 200px"
            />
          </div>
          <div class="col-auto">
            <q-input
              v-model="searchQuery"
              label="Search products..."
              outlined
              clearable
              debounce="300"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-toggle
              v-model="showInactive"
              label="Show Inactive"
              color="negative"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Products Grid -->
    <div class="row q-gutter-md">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="product-card" :class="{ 'inactive-product': !product.is_active }">
          <!-- Product Image -->
          <div class="product-image-container">
            <img
              :src="product.image_url || '/api/placeholder/300/200'"
              :alt="product.name"
              class="product-image"
              @error="handleImageError"
            />
            <div v-if="!product.is_active" class="inactive-overlay">
              <q-chip color="negative" text-color="white" size="sm">
                Inactive
              </q-chip>
            </div>
          </div>

          <q-card-section>
            <div class="row items-start q-mb-sm">
              <div class="col">
                <div class="text-h6 text-weight-bold">{{ product.name }}</div>
                <q-chip
                  :color="getCategoryColor(product.category)"
                  text-color="white"
                  size="sm"
                  class="q-mt-xs"
                >
                  {{ product.category }}
                </q-chip>
              </div>
              <div class="col-auto">
                <div class="text-h6 text-weight-bold text-positive">
                  ${{ Number(product.price).toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="text-caption text-grey-6 q-mb-md">
              Code: {{ product.code }}
            </div>

            <div class="product-description">
              {{ product.description }}
            </div>
          </q-card-section>

          <q-card-actions>
            <q-btn
              flat
              color="primary"
              icon="edit"
              label="Edit"
              @click="editProduct(product)"
              class="q-mr-sm"
            />
            <q-btn
              flat
              :color="product.is_active ? 'negative' : 'positive'"
              :icon="product.is_active ? 'visibility_off' : 'visibility'"
              :label="product.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleProductStatus(product)"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" class="col-12">
        <q-card class="text-center q-pa-xl">
          <q-icon name="inventory_2" size="4rem" color="grey-4" />
          <div class="text-h6 text-grey-6 q-mt-md">No products found</div>
          <div class="text-grey-5 q-mb-lg">
            {{ products.length === 0 ? 'Start by adding your first product' : 'Try adjusting your filters' }}
          </div>
          <q-btn
            color="primary"
            icon="add"
            label="Add Product"
            @click="showProductDialog = true"
          />
        </q-card>
      </div>
    </div>

    <!-- Product Dialog -->
    <q-dialog v-model="showProductDialog" :maximized="$q.screen.lt.sm">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ editingProduct ? 'Edit Product' : 'Add New Product' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveProduct" class="q-gutter-md">
            <div class="row q-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="productForm.code"
                  label="Product Code *"
                  outlined
                  :rules="[val => !!val || 'Code is required']"
                  hint="e.g., F001, F002"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="productForm.name"
                  label="Product Name *"
                  outlined
                  :rules="[val => !!val || 'Name is required']"
                />
              </div>
            </div>

            <div class="row q-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="productForm.price"
                  label="Price *"
                  outlined
                  type="number"
                  step="0.01"
                  min="0"
                  :rules="[val => val > 0 || 'Price must be greater than 0']"
                  prefix="$"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="productForm.category"
                  :options="allCategories"
                  label="Category *"
                  outlined
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  new-value-mode="add-unique"
                  :rules="[val => !!val || 'Category is required']"
                />
              </div>
            </div>

            <q-input
              v-model="productForm.description"
              label="Description"
              outlined
              type="textarea"
              rows="3"
            />

            <q-input
              v-model="productForm.image_url"
              label="Image URL"
              outlined
              hint="Optional: Link to product image"
            />

            <q-toggle
              v-model="productForm.is_active"
              label="Active Product"
              color="positive"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="saveProduct"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiService, type Product } from 'src/services/api'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const saving = ref(false)
const products = ref<Product[]>([])
const showProductDialog = ref(false)
const editingProduct = ref<Product | null>(null)
const categoryFilter = ref<string | null>(null)
const searchQuery = ref('')
const showInactive = ref(false)

const productForm = ref({
  code: '',
  name: '',
  description: '',
  price: 0,
  image_url: '',
  category: '',
  is_active: true
})

const categoryOptions = computed(() => {
  const categories = [...new Set(products.value.map(p => p.category))]
  return [
    { label: 'All Categories', value: null },
    ...categories.map(cat => ({ label: cat, value: cat }))
  ]
})

const allCategories = computed(() => {
  const categories = [...new Set(products.value.map(p => p.category))]
  return categories.filter(Boolean)
})

const filteredProducts = computed(() => {
  let filtered = [...products.value]

  // Filter by active status
  if (!showInactive.value) {
    filtered = filtered.filter(product => product.is_active)
  }

  // Filter by category
  if (categoryFilter.value) {
    filtered = filtered.filter(product => product.category === categoryFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

function getCategoryColor(category: string) {
  const colors: { [key: string]: string } = {
    'Pizza': 'red',
    'Burgers': 'orange',
    'Salads': 'green',
    'Pasta': 'purple',
    'Seafood': 'blue',
    'Asian': 'teal',
    'Grilled': 'brown',
    'Desserts': 'pink'
  }
  return colors[category] || 'primary'
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/api/placeholder/300/200'
}

async function loadProducts() {
  loading.value = true
  try {
    products.value = await apiService.getProducts()
  } catch (error) {
    console.error('Error loading products:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load products'
    })
  } finally {
    loading.value = false
  }
}

function editProduct(product: Product) {
  editingProduct.value = product
  productForm.value = {
    code: product.code,
    name: product.name,
    description: product.description || '',
    price: Number(product.price),
    image_url: product.image_url || '',
    category: product.category,
    is_active: product.is_active
  }
  showProductDialog.value = true
}

function resetForm() {
  productForm.value = {
    code: '',
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: '',
    is_active: true
  }
  editingProduct.value = null
}

async function saveProduct() {
  saving.value = true
  try {
    if (editingProduct.value) {
      // Update existing product
      await apiService.updateProduct(editingProduct.value.id, productForm.value)
      $q.notify({
        type: 'positive',
        message: 'Product updated successfully'
      })
    } else {
      // Create new product
      await apiService.createProduct(productForm.value)
      $q.notify({
        type: 'positive',
        message: 'Product created successfully'
      })
    }
    
    showProductDialog.value = false
    resetForm()
    await loadProducts()
  } catch (error) {
    console.error('Error saving product:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to save product'
    })
  } finally {
    saving.value = false
  }
}

async function toggleProductStatus(product: Product) {
  try {
    await apiService.updateProduct(product.id, {
      is_active: !product.is_active
    })
    
    $q.notify({
      type: 'positive',
      message: `Product ${product.is_active ? 'deactivated' : 'activated'} successfully`
    })
    
    await loadProducts()
  } catch (error) {
    console.error('Error toggling product status:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to update product status'
    })
  }
}

onMounted(() => {
  void loadProducts()
})
</script>

<style scoped>
.product-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.inactive-product {
  opacity: 0.7;
}

.product-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inactive-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

.product-description {
  color: #666;
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
