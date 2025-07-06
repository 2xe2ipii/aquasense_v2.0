// Replace the password change function in public/index.html with this:

// Handle password change form submission
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('passwordMessage');
    
    // Clear previous messages
    messageDiv.style.display = 'none';
    messageDiv.className = 'message';
    
    // Client-side validation
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('New password must be at least 6 characters long!', 'error');
        return;
    }
    
    // Get current user
    const currentUser = sessionStorage.getItem('aquasense_username');
    
    if (!currentUser) {
        showMessage('User session expired. Please log in again.', 'error');
        return;
    }
    
    try {
        // Server-side password change
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUser,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Password changed successfully!', 'success');
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeChangePasswordModal();
            }, 2000);
        } else {
            showMessage(result.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showMessage('Connection error. Please try again.', 'error');
    }
});
