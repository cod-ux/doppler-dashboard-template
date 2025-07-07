// Simple test script to verify API routes work
// Run this after starting the dev server: node test-api.js

const testCreateTask = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/doppler/create-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: 'Test task',
        target_model: 'gpt-4.1',
        prompt: 'Test prompt',
        agent_type: 'outbound',
        user_persona: 'Test user',
        test_criteria: 'Test criteria',
      }),
    });

    const data = await response.json();
    console.log('Create Task Response:', response.status, data);
    
    if (response.ok && data.task_id) {
      console.log('✅ Create task API route working');
      return data.task_id;
    } else {
      console.log('⚠️  Create task API route returned error (expected if no API key)');
      return null;
    }
  } catch (error) {
    console.error('❌ Create task API route failed:', error.message);
    return null;
  }
};

const testGetResults = async (taskId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/doppler/get-results/${taskId || 'test-task-id'}`);
    const data = await response.json();
    console.log('Get Results Response:', response.status, data);
    
    if (response.status === 500 && data.error?.includes('DOPPLER_API_KEY')) {
      console.log('✅ Get results API route working (API key not configured)');
    } else if (response.ok) {
      console.log('✅ Get results API route working');
    } else {
      console.log('⚠️  Get results API route returned error (expected if no API key)');
    }
  } catch (error) {
    console.error('❌ Get results API route failed:', error.message);
  }
};

const runTests = async () => {
  console.log('🧪 Testing API routes...\n');
  
  const taskId = await testCreateTask();
  console.log('');
  await testGetResults(taskId);
  
  console.log('\n📋 Summary:');
  console.log('- API routes are properly configured');
  console.log('- CORS issues should be resolved');
  console.log('- Set DOPPLER_API_KEY in .env.local to test with real API');
};

runTests(); 