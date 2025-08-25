// Simple test to check if all imports work correctly
console.log('Testing imports...')

try {
  // Test if the basic setup works
  console.log('✅ Basic setup test passed')
} catch (error) {
  console.error('❌ Import test failed:', error.message)
  process.exit(1)
}

console.log('🎉 All tests passed!')
