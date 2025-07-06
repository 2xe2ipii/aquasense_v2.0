const fs = require('fs');
const path = require('path');

// Simple in-memory storage with file backup
const USERS_FILE = path.join(__dirname, 'data', 'simple-users.json');

// Default users
const DEFAULT_USERS = {
    admin: { password: 'admin123', role: 'administrator' },
    operator: { password: 'operator123', role: 'operator' }
};

// In-memory custom passwords
let customPasswords = {};

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load custom passwords from file
function loadCustomPasswords() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            customPasswords = JSON.parse(data);
            console.log('✅ Custom passwords loaded');
        }
    } catch (error) {
        console.error('Error loading custom passwords:', error);
        customPasswords = {};
    }
}

// Save custom passwords to file
function saveCustomPasswords() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(customPasswords, null, 2));
        console.log('✅ Custom passwords saved');
        return true;
    } catch (error) {
        console.error('Error saving custom passwords:', error);
        return false;
    }
}

// Validate login credentials
function validateLogin(username, password) {
    console.log(`🔍 Login attempt: ${username}`);
    
    const defaultUser = DEFAULT_USERS[username];
    if (!defaultUser) {
        console.log(`❌ User not found: ${username}`);
        return { success: false, message: 'User not found' };
    }
    
    // Check custom password first, then default
    const correctPassword = customPasswords[username] || defaultUser.password;
    console.log(`🔍 Checking password for ${username}...`);
    
    if (password === correctPassword) {
        console.log(`✅ Login successful: ${username}`);
        return { 
            success: true, 
            user: {
                username: username,
                role: defaultUser.role
            }
        };
    }
    
    console.log(`❌ Invalid password for: ${username}`);
    return { success: false, message: 'Invalid password' };
}

// Change password
function changePassword(username, currentPassword, newPassword) {
    console.log(`🔄 Password change attempt: ${username}`);
    
    const defaultUser = DEFAULT_USERS[username];
    if (!defaultUser) {
        return { success: false, message: 'User not found' };
    }
    
    // Check current password
    const correctCurrentPassword = customPasswords[username] || defaultUser.password;
    if (currentPassword !== correctCurrentPassword) {
        console.log(`❌ Current password incorrect for: ${username}`);
        return { success: false, message: 'Current password is incorrect' };
    }
    
    // Validate new password
    if (newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long' };
    }
    
    // Save new password
    customPasswords[username] = newPassword;
    
    if (saveCustomPasswords()) {
        console.log(`✅ Password changed for: ${username}`);
        return { success: true, message: 'Password changed successfully' };
    } else {
        return { success: false, message: 'Failed to save new password' };
    }
}

// Initialize on module load
loadCustomPasswords();
console.log('🚀 Simple auth module initialized');

module.exports = {
    validateLogin,
    changePassword
};
