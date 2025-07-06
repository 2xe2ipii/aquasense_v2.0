// Test authentication system
const auth = require('./auth');

console.log('=== Testing Authentication System ===');

// Test 1: Default login
console.log('\n1. Testing default admin login:');
const loginResult = auth.validateLogin('admin', 'admin123');
console.log('Result:', loginResult);

// Test 2: Change password
console.log('\n2. Testing password change:');
const changeResult = auth.changePassword('admin', 'admin123', 'newpassword123');
console.log('Result:', changeResult);

// Test 3: Login with new password
console.log('\n3. Testing login with new password:');
const newLoginResult = auth.validateLogin('admin', 'newpassword123');
console.log('Result:', newLoginResult);

// Test 4: Login with old password (should fail)
console.log('\n4. Testing login with old password (should fail):');
const oldLoginResult = auth.validateLogin('admin', 'admin123');
console.log('Result:', oldLoginResult);

console.log('\n=== Test Complete ===');
