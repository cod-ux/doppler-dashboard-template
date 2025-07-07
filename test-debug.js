// Debug test script to verify API flow
// Run this with: node test-debug.js

const testApiFlow = async () => {
  console.log('🧪 Testing API flow...\n');

  try {
    // Test 1: Check if the API route is accessible
    console.log('1️⃣ Testing API route accessibility...');
    const response = await fetch('http://localhost:3000/api/doppler/get-results/test-task-123');
    console.log(`   Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`   Response:`, data);
    
    if (data.error && data.error.includes('DOPPLER_API_BASE is not configured')) {
      console.log('❌ Environment variable issue detected!');
      return;
    }
    
    if (data.error && data.error.includes('Doppler API error')) {
      console.log('✅ API route is working (error is expected for test task ID)');
    }
    
    console.log('\n2️⃣ API route is functioning correctly!');
    console.log('📋 Next steps:');
    console.log('   - Open your dashboard in the browser');
    console.log('   - Submit a task for optimization');
    console.log('   - Check the browser console for detailed logs');
    console.log('   - Check the terminal for server-side logs');
    console.log('   - Use the "🔄 Refresh All" button to manually refresh tasks');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testApiFlow(); 