// Customers page specific logic

// Global variables
let allCustomers = [];
let currentPage = 1;
const itemsPerPage = 10;
let customerToDelete = null;

const API_BASE_URL = "https://ramtechbackend-production.up.railway.app";

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing customers page...');
    
    // Initialize event listeners
    setupEventListeners();
    loadAllCustomers();
});

// 1. LOAD CUSTOMERS
async function loadAllCustomers() {
    try {
        console.log('Loading customers...');
        const response = await fetch(`${API_BASE_URL}/customers/getcustomers`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Customers loaded:', result);
        
        if (result.data) {
            allCustomers = result.data;
            renderAllCustomers();
            setupPagination();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        alert('Error loading customers: ' + error.message);
    }
}

// 2. RENDER TABLE
function renderAllCustomers(filteredCustomers = allCustomers) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('allCustomersBody');
    tableBody.innerHTML = '';
    
    if (pageCustomers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No customers found
                </td>
            </tr>
        `;
        return;
    }
    
    pageCustomers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.customer_id}</td>
            <td>${customer.F_name} ${customer.L_name || ''}</td>
            <td>${customer.contact || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.customer_type || 'Regular'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editCustomer(${customer.customer_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteConfirm(${customer.customer_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. ADD/SAVE CUSTOMER
async function saveCustomer(e) {
    e.preventDefault();
    console.log('Saving customer...');
    
    // Get form data
    const customerId = document.getElementById('customerId').value;
    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    
    // Validation
    if (!fname) {
        alert('First name is required!');
        return;
    }
    
    const customerData = {
        F_name: fname,
        L_name: lname,
        contact: document.getElementById('contact').value.trim(),
        email: document.getElementById('email').value.trim(),
        customer_type: document.getElementById('customerType').value
    };
    
    // Add customer_id for updates
    if (customerId) {
        customerData.customer_id = parseInt(customerId);
    }
    
    try {
        const url = customerId 
            ? `${API_BASE_URL}/customers/editcustomer/${customerId}`  
            : `${API_BASE_URL}/customers/addcustomer`;             
            
        const method = customerId ? 'PUT' : 'POST';
        
        console.log('Sending request:', { url, method, data: customerData });
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });

        // First check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error(`Server returned ${response.status}: ${response.statusText}. Check if endpoint exists.`);
        }
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save customer');
        }
        
        // Show success message
        alert(customerId ? 'Customer updated successfully!' : 'Customer added successfully!');
        
        // Close modal and reload data
        closeModal('customerModal');
        loadAllCustomers();
        
    } catch (error) {
        console.error('Error saving customer:', error);
        alert('Error: ' + error.message);
    }
}

// 4. DELETE CUSTOMER
async function deleteCustomer() {
    if (!customerToDelete) return;
    
    console.log('Attempting to delete customer ID:', customerToDelete);
    
    try {
        const url = `${API_BASE_URL}/customers/deletecustomer/${customerToDelete}`;
        
        console.log('DELETE URL:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('DELETE Response status:', response.status);
        console.log('DELETE Response headers:', Object.fromEntries(response.headers.entries()));

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
            throw new Error(result.message || 'Failed to delete customer');
        }
        
        // Show success message
        alert('Customer deleted successfully!');
        
        // Close modal and reload data
        closeModal('confirmModal');
        loadAllCustomers();
        
    } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error: ' + error.message);
    }
    
    customerToDelete = null;
}

// 5. EDIT CUSTOMER
function editCustomer(customerId) {
    console.log('Editing customer ID:', customerId);
    const customer = allCustomers.find(c => c.customer_id == customerId);
    
    if (customer) {
        openCustomerModal(customer);
    } else {
        alert('Customer not found!');
    }
}

// 6. MODAL FUNCTIONS
function openCustomerModal(customer = null) {
    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    const modalTitle = document.getElementById('modal-title');
    
    if (customer) {
        modalTitle.textContent = 'Edit Customer';
        document.getElementById('customerId').value = customer.customer_id;
        document.getElementById('fname').value = customer.F_name || '';
        document.getElementById('lname').value = customer.L_name || '';
        document.getElementById('contact').value = customer.contact || '';
        document.getElementById('email').value = customer.email || '';
        document.getElementById('customerType').value = customer.customer_type || 'Retailler';
    } else {
        modalTitle.textContent = 'Add Customer';
        form.reset();
        document.getElementById('customerId').value = '';
        document.getElementById('customerType').value = 'Retailler';
    }
    
    modal.style.display = 'flex';
}

function showDeleteConfirm(customerId) {
    customerToDelete = customerId;
    const customer = allCustomers.find(c => c.customer_id == customerId);
    
    if (customer) {
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete ${customer.F_name} ${customer.L_name || ''}?`;
    }
    
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 7. EVENT LISTENERS
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
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', saveCustomer);
    }
    
    // Confirmation modal buttons
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmDelete = document.getElementById('confirm-delete');
    
    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => closeModal('confirmModal'));
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', deleteCustomer);
    }
    
    // Add Customer button
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', () => openCustomerModal());
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterCustomers);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterCustomers);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderAllCustomers();
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allCustomers.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderAllCustomers();
                updatePagination();
            }
        });
    }
}

// 8. HELPER FUNCTIONS
function filterCustomers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filtered = allCustomers;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(customer =>
            (customer.F_name && customer.F_name.toLowerCase().includes(searchTerm)) ||
            (customer.L_name && customer.L_name.toLowerCase().includes(searchTerm)) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
            (customer.contact && customer.contact.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by type
    if (typeFilter) {
        filtered = filtered.filter(customer => 
            customer.customer_type === typeFilter
        );
    }
    
    currentPage = 1;
    renderAllCustomers(filtered);
    setupPagination(filtered.length);
}

function setupPagination(totalItems = allCustomers.length) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
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
        padding: 5px 10px;
        margin: 0 2px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .edit-btn {
        background: #4CAF50;
        color: white;
    }
    
    .delete-btn {
        background: #f44336;
        color: white;
    }
    
    .badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .badge[data-type="Retailler"] {
        background-color: #e3f2fd;
        color: #1976d2;
    }
    
    .badge[data-type="Constructor"] {
        background-color: #f3e5f5;
        color: #7b1fa2;
    }
    
    .badge[data-type="Wholesaller"] {
        background-color: #e8f5e8;
        color: #2e7d32;
    }
`;
document.head.appendChild(style);

console.log('Customers script loaded successfully!');



