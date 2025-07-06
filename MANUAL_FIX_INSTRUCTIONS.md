# 🔧 MANUAL FIX for Password Change

## The Issue
The password change form has redacted field names in the JSON body that need to be manually fixed.

## Quick Fix Steps

### Step 1: Open `public/index.html`
Find line 1865-1866 (around the fetch request body):

**Currently shows:**
```javascript
body: JSON.stringify({
    username: currentUser,
    [REDACTED:password]: currentPassword,
    [REDACTED:password]: newPassword
})
```

### Step 2: Replace with this:
```javascript
body: JSON.stringify({
    username: currentUser,
    currentPassword: currentPassword,
    newPassword: newPassword
})
```

**Just replace:**
- `[REDACTED:password]: currentPassword,` → `currentPassword: currentPassword,`
- `[REDACTED:password]: newPassword` → `newPassword: newPassword`

### Step 3: Save and Test
1. Save the file
2. Restart server: `npm start`
3. You should see in console:
   ```
   🚀 Simple auth module initialized
   ```
4. Login with admin/admin123
5. Change password - you should see:
   ```
   🔄 Attempting password change for user: admin
   🔄 Password change attempt: admin
   ✅ Password changed for: admin
   ✅ Custom passwords saved
   ```
6. Logout and login with new password

## Alternative: Use Browser Console
If you can't edit the file:

1. Login to dashboard
2. Open browser console (F12)
3. Paste this code:
```javascript
// Override the password change function
document.getElementById('changePasswordForm').removeEventListener('submit', arguments.callee);
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    const currentUser = sessionStorage.getItem('aquasense_username');
    
    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        alert(result.message);
        
        if (result.success) {
            document.getElementById('changePasswordModal').style.display = 'none';
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});
```

4. Now try changing your password through Settings

This will temporarily fix the password change function until you can edit the file properly.
