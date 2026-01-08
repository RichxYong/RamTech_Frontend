


// API  Configuration to the Backend
const API_BASE_URL = 'https://ramtechbackend-production.up.railway.app';

// DOM Elements
const customerCountEl = document.getElementById('customer-count');
const productCountEl = document.getElementById('product-count');
const saleCountEl = document.getElementById('sale-count');
const employeeCountEl = document.getElementById('employee-count');
const supplierCountEl = document.getElementById('supplier-count');
const revenueTotalEl = document.getElementById('revenue-total');

const customersBodyEl = document.getElementById('customers-body');


// State
let customers = [];


// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    loadRecentCustomers();
    setupEventListeners();
});


// Fetch Data Functions
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error('Database response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('Error loading data. Please check your Database server.', 'error');
        return null;
    }
}

async function loadDashboardData() {
    // To Load counts from various endpoints
    const [customersData, productsData, salesData, employeesData, suppliersData] = await Promise.all([
        fetchData('/customers/getcustomers'),
        fetchData('/products/getproducts'),
        fetchData('/sales/getsales'),
        fetchData('/employees/getemployees'),
        fetchData('/employees/getemployees'),
        fetchData('/suppliers/getsuppliers')
    ]);
    
    if (customersData) {
        customerCountEl.textContent = customersData.count || customersData.data?.length || 0;
    }
    
    if (productsData) {
        productCountEl.textContent = productsData.count || productsData.data?.length || 0;
    }

    if (employeesData) {
        employeeCountEl.textContent = employeesData.count || employeesData.data?.length || 0;
    }

    if (suppliersData) {
        supplierCountEl.textContent = suppliersData.count || suppliersData.data?.length || 0;
    }
    
   
    if (salesData) {
        saleCountEl.textContent = salesData.count || salesData.data?.length || 0;
        
        // Calculate total revenue
        if (salesData.data && salesData.data.length > 0) {
            const total = salesData.data.reduce((sum, sale) => 
                sum + parseFloat(sale.total_amount || 0), 0);
            revenueTotalEl.textContent = `Ghc ${total.toFixed(2)}`;
        }
    }
}
// to load rescentt customers
async function loadRecentCustomers() {
    const data = await fetchData('/customers/getcustomers');
    if (data && data.data) {
        customers = data.data;
        renderCustomersTable(customers.slice(0, 2)); // Show only  2 recent
    }
}

// Render customers Functions
function renderCustomersTable(customersList) {
    customersBodyEl.innerHTML = '';
    
    customersList.forEach(customer => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${customer.customer_id}</td>
            <td>${customer.F_name} ${customer.L_name || ''}</td>
            <td>${customer.contact || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.customer_type || 'Retailler'}</td>
            
        `;
        
        customersBodyEl.appendChild(row);
    });
}


document.head.appendChild(style)

//code for the login authentication
// Auth functions
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
         
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store token and user info
            localStorage.setItem('ramtech_token', data.data.token);
            localStorage.setItem('ramtech_user', JSON.stringify(data.data.user));
            localStorage.setItem('ramtech_logged_in', 'true');
            
            return { success: true, data: data.data };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

function logout() {
    fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
     
    });
    
    // Clear all auth data
    localStorage.removeItem('ramtech_token');
    localStorage.removeItem('ramtech_user');
    localStorage.removeItem('ramtech_logged_in');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

function isLoggedIn() {
    return localStorage.getItem('ramtech_logged_in') === 'true';
}

function getCurrentUser() {
    const user = localStorage.getItem('ramtech_user');
    return user ? JSON.parse(user) : null;
}

function getAuthHeaders() {
    const token = localStorage.getItem('ramtech_token');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Update fetchData function to include auth
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: getAuthHeaders(),
          
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return null;
        }
        
        if (!response.ok) {
            throw new Error('Database response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('Error loading data. Please check your Database server.', 'error');
        return null;
    }
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on login page
    if (window.location.pathname.includes('login.html')) {
        // If already logged in, redirect to dashboard
        if (isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }
        return;
    }
    
    // For protected pages, check authentication
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verify token with backend
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: getAuthHeaders(),
         
        });
        
        if (!response.ok) {
            logout();
            return;
        }
        
        // Update UI with user info
        const user = getCurrentUser();
        if (user) {
            updateUserUI(user);
        }
        
        // Load dashboard data
        loadDashboardData();
        loadRecentCustomers();
        setupEventListeners();
        
    } catch (error) {
        console.error('Auth verification error:', error);
        logout();
    }
});

