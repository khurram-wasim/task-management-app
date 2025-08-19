#!/usr/bin/env node

// Simple API Integration Test Script
// This tests the frontend-backend integration without requiring database setup

const API_BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(description, method, url, data = null, expectedStatus = 200) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.text();
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === expectedStatus) {
      console.log('   ✅ PASS');
      if (result) {
        try {
          const json = JSON.parse(result);
          console.log('   Response:', JSON.stringify(json, null, 2).slice(0, 200) + (JSON.stringify(json, null, 2).length > 200 ? '...' : ''));
        } catch {
          console.log('   Response:', result.slice(0, 100) + (result.length > 100 ? '...' : ''));
        }
      }
      return { success: true, status: response.status, data: result };
    } else {
      console.log('   ❌ FAIL');
      console.log('   Response:', result.slice(0, 200));
      return { success: false, status: response.status, error: result };
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Integration Tests');
  console.log('=' .repeat(50));
  
  let passed = 0;
  let total = 0;

  // Test 1: Health Check
  total++;
  const healthTest = await testEndpoint(
    'Health Check',
    'GET',
    `${API_BASE_URL}/health`
  );
  if (healthTest.success) passed++;

  // Test 2: Swagger Documentation Availability
  total++;
  const docsTest = await testEndpoint(
    'API Documentation (Swagger UI)',
    'GET',
    'http://localhost:3001/api-docs/',
    null,
    200
  );
  if (docsTest.success || docsTest.status === 302) { // 302 redirect is also acceptable
    console.log('   ✅ PASS (Swagger UI accessible)');
    passed++;
  }

  // Test 3: CORS Headers
  total++;
  console.log(`\n🔍 Testing: CORS Headers`);
  console.log(`   GET ${API_BASE_URL}/health with Origin header`);
  try {
    const corsResponse = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    const corsHeaders = corsResponse.headers.get('access-control-allow-origin');
    if (corsHeaders) {
      console.log('   ✅ PASS');
      console.log(`   CORS Header: ${corsHeaders}`);
      passed++;
    } else {
      console.log('   ❌ FAIL - No CORS headers found');
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  // Test 4: API Routes Structure (should return 404 for non-existent routes)
  total++;
  const notFoundTest = await testEndpoint(
    'Non-existent Route (should return 404)',
    'GET',
    `${API_BASE_URL}/nonexistent`,
    null,
    404
  );
  if (notFoundTest.success) passed++;

  // Test 5: Auth Route Structure (should require proper data)
  total++;
  const authStructureTest = await testEndpoint(
    'Auth Route Structure (should return validation error)',
    'POST',
    `${API_BASE_URL}/auth/login`,
    { invalid: 'data' },
    400
  );
  if (authStructureTest.success) passed++;

  // Test 6: WebSocket Endpoint (basic connection test)
  total++;
  console.log(`\n🔍 Testing: WebSocket Connection`);
  console.log(`   Attempting connection to ws://localhost:3001/api/ws`);
  
  try {
    const WebSocket = (await import('ws')).default;
    const ws = new WebSocket('ws://localhost:3001/api/ws');
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 3000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('   ✅ PASS - WebSocket connection successful');
        ws.close();
        passed++;
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        if (error.code === 'ECONNREFUSED') {
          console.log('   ❌ FAIL - WebSocket server not running');
        } else {
          console.log('   ❌ FAIL - WebSocket error:', error.message);
        }
        reject(error);
      });
    });
  } catch (error) {
    console.log('   ❌ FAIL - WebSocket test failed:', error.message);
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log(`   Passed: ${passed}/${total} (${Math.round((passed/total) * 100)}%)`);
  
  if (passed === total) {
    console.log('   🎉 All tests passed! Frontend-Backend integration is ready.');
    return true;
  } else {
    console.log('   ⚠️  Some tests failed. Check the issues above.');
    return false;
  }
}

// Run the tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});