const fs = require('fs');
const path = require('path');

// Production credentials for single client
const DEFAULT_USERS = {
    aquasenseadmin: { password: 'xFt31jj_bsu', role: 'administrator' }
};

console.log('🔐 Production auth initialized with single client credentials');

// Validate login credentials
function validateLogin(username, password) {
    console.log(`🔍 Login attempt: ${username}`);
    
    const user = DEFAULT_USERS[username];
    if (!user) {
        console.log(`❌ User not found: ${username}`);
        return { success: false, message: 'Invalid credentials' };
    }
    
    if (password === user.password) {
        console.log(`✅ Login successful: ${username}`);
        return { 
            success: true, 
            user: {
                username: username,
                role: user.role
            }
        };
    }
    
    console.log(`❌ Invalid password for: ${username}`);
    return { success: false, message: 'Invalid credentials' };
}

module.exports = {
    validateLogin
};
