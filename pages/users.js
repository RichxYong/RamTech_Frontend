// Users page specific logic
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Global variables
let allUsers = [];
let currentPage = 1;
const itemsPerPage = 10;
let userToDelete = null;

const API_BASE_URL = "https://ramtechbackend-production.up.railway.app";


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing users page...');
    
    // Check user role to show/hide add button
    checkUserRole();
    
    // Initialize event listeners
    setupEventListeners();
    loadAllUsers();
});

// Check user role and show/hide add button
function checkUserRole() {
    const userData = localStorage.getItem('ramtech_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const addUserBtn = document.getElementById('addUserBtn');
            
            // Only show add button for admin users
            if (addUserBtn && user.role === 'admin') {
                addUserBtn.style.display = 'inline-flex';
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// 1. LOAD USERS
async function loadAllUsers() {
    try {
        console.log('Loading users...');
        const token = localStorage.getItem('ramtech_token');
        
        const response = await fetch(`${API_BASE_URL}/users/getusers`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.href = '../login.html';
                return;
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Users loaded:', result);
        
        if (result.success && result.data) {
            allUsers = result.data;
            renderAllUsers();
            setupPagination();
        } else {
            throw new Error(result.message || 'Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users: ' + error.message);
    }
}

// 2. RENDER TABLE
function renderAllUsers(filteredUsers = allUsers) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageUsers = filteredUsers.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    if (pageUsers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    pageUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Format last login date
        let lastLogin = 'Never';
        if (user.last_login) {
            const date = new Date(user.last_login);
            lastLogin = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
        
        // Status badge
        const statusClass = user.is_active ? 'active' : 'inactive';
        const statusText = user.is_active ? 'Active' : 'Inactive';
        
        // Role badge with different colors
        let roleClass = 'role';
        switch(user.role) {
            case 'admin':
                roleClass += ' admin';
                break;
            case 'manager':
                roleClass += ' manager';
                break;
            default:
                roleClass += ' employee';
        }
        
        row.innerHTML = `
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.email}</td>
            <td>${user.password_hash}</td>
            <td>${roleClass}</td>
            <td>${statusClass}</td>
            <td>${lastLogin}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser(${user.user_id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteConfirm(${user.user_id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. ADD/SAVE USER
async function saveUser(e) {
    e.preventDefault();
    console.log('Saving user...');
    
    // Get form data
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const first_name = document.getElementById('first_name').value.trim();
    const last_name = document.getElementById('last_name').value.trim();
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const role = document.getElementById('role').value;
    
    // Validation
    if (!username || !email || !first_name || !last_name) {
        alert('All fields except password are required!');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // For new users, password is required
    if (!userId && !password) {
        alert('Password is required for new users!');
        return;
    }
    
    // Check password confirmation
    if (password && password !== confirm_password) {
        alert('Passwords do not match!');
        return;
    }
    
    const userData = {
        username: username,
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: role
    };
    
    // Add password for new users or password change
    if (password) {
        userData.password = password;
    }
    
    try {
        const token = localStorage.getItem('ramtech_token');
        const url = userId 
            ? `${API_BASE_URL}/users/edituser/${userId}`  
            : `${API_BASE_URL}/users/adduser`;
            
        const method = userId ? 'PUT' : 'POST';
        
        console.log('Sending request:', { url, method });
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        // Check response
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save user');
        }
        
        // Show success message
        alert(userId ? 'User updated successfully!' : 'User added successfully!');
        
        // Close modal and reload data
        closeModal('userModal');
        loadAllUsers();
        
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Error: ' + error.message);
    }
}

// 4. DELETE USER
async function deleteUser() {
    if (!userToDelete) return;
    
    console.log('Attempting to delete user ID:', userToDelete);
    
    try {
        const token = localStorage.getItem('ramtech_token');
        const url = `${API_BASE_URL}/users/deleteuser/${userToDelete}`;
        
        console.log('DELETE URL:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('DELETE Response status:', response.status);

        const contentType = response.headers.get('content-type');
        let result;
        
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.log('Non-JSON response:', text);
            result = { success: response.ok };
        }
        
        console.log('Delete response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete user');
        }
        
        // Show success message
        alert('User deleted successfully!');
        
        // Close modal and reload data
        closeModal('confirmModal');
        loadAllUsers();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error: ' + error.message);
    }
    
    userToDelete = null;
}

// 5. TOGGLE USER STATUS
async function toggleUserStatus(userId, activate) {
    if (!confirm(`Are you sure you want to ${activate ? 'activate' : 'deactivate'} this user?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('ramtech_token');
        const url = `${API_BASE_URL}/users/${userId}/status`;
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: activate })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to update user status');
        }
        
        alert(`User ${activate ? 'activated' : 'deactivated'} successfully!`);
        loadAllUsers();
        
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Error: ' + error.message);
    }
}

// 6. EDIT USER
function editUser(userId) {
    console.log('Editing user ID:', userId);
    const user = allUsers.find(u => u.user_id == userId);
    
    if (user) {
        openUserModal(user);
    } else {
        alert('User not found!');
    }
}

// 7. MODAL FUNCTIONS
function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const modalTitle = document.getElementById('modal-title');
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm_password');
    
    if (user) {
        modalTitle.textContent = 'Edit User';
        document.getElementById('userId').value = user.user_id;
        document.getElementById('username').value = user.username || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('first_name').value = user.first_name || '';
        document.getElementById('last_name').value = user.last_name || '';
        document.getElementById('role').value = user.role || 'employee';
        
        // Password not required for editing
        passwordField.required = false;
        confirmPasswordField.required = false;
        passwordField.placeholder = 'Leave blank to keep current password';
        confirmPasswordField.placeholder = 'Leave blank to keep current password';
    } else {
        modalTitle.textContent = 'Add User';
        form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('role').value = 'employee';
        
        // Password required for new users
        passwordField.required = true;
        confirmPasswordField.required = true;
        passwordField.placeholder = 'Enter password';
        confirmPasswordField.placeholder = 'Confirm password';
    }
    
    modal.style.display = 'flex';
}

function showDeleteConfirm(userId) {
    userToDelete = userId;
    const user = allUsers.find(u => u.user_id == userId);
    
    if (user) {
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete user  ? .`;
    }
    
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 8. EVENT LISTENERS
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Close modals when clicking X
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', saveUser);
    }
    
    // Confirmation modal buttons
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmDelete = document.getElementById('confirm-delete');
    
    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => closeModal('confirmModal'));
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', deleteUser);
    }
    
    // Add User button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserModal());
    }
}

// 9. HELPER FUNCTIONS
function setupPagination(totalItems = allUsers.length) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function updatePagination() {
    setupPagination();
}

// CSS for better UX
const style = document.createElement('style');
style.textContent = `
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 400px;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .action-btn {
        padding: 5px 8px;
        margin: 0 2px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .edit-btn {
        background: #4CAF50;
        color: white;
    }
    
    .delete-btn {
        background: #f44336;
        color: white;
    }
    
    .deactivate-btn {
        background: #ff9800;
        color: white;
    }
    
    .activate-btn {
        background: #2196F3;
        color: white;
    }
    
    .badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .badge-active {
        background-color: #e8f5e8;
        color: #2e7d32;
    }
    
    .badge-inactive {
        background-color: #ffebee;
        color: #c62828;
    }
    
    .badge-role {
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .badge-admin {
        background-color: #f3e5f5;
        color: #7b1fa2;
        border: 1px solid #7b1fa2;
    }
    
    .badge-manager {
        background-color: #e3f2fd;
        color: #1976d2;
        border: 1px solid #1976d2;
    }
    
    .badge-employee {
        background-color: #f5f5f5;
        color: #616161;
        border: 1px solid #9e9e9e;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
    }
    
    .btn:hover {
        background-color: #45a049;
    }
    
    .btn-primary {
        background-color: #2196F3;
        width: 100%;
        padding: 10px;
        font-size: 16px;
    }
    
    .btn-primary:hover {
        background-color: #0b7dda;
    }
`;
document.head.appendChild(style);

console.log('Users script loaded successfully!');