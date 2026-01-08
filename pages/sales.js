// Sales page specific logic

//  variables
let allSales = [];
let allCustomers = [];
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 10;
let saleToDelete = null;

const API_BASE_URL = "https://ramtechbackend-production.up.railway.app";

// DOM element references
let saleModal, confirmModal, closeModalBtns, confirmCancelBtn, confirmDeleteBtn, saleForm;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing sales page...');
    
    // Initialize DOM references
    initializeDOMReferences();
    
    // Load data and setup events
    loadAllSales();
    loadCustomersForDropdown();
    loadProductsForDropdown();
    setupEventListeners();
    setupSalePageEvents();
});

function initializeDOMReferences() {
    saleModal = document.getElementById('saleModal');
    confirmModal = document.getElementById('confirmModal');
    closeModalBtns = document.querySelectorAll('.close');
    confirmCancelBtn = document.getElementById('confirm-cancel');
    confirmDeleteBtn = document.getElementById('confirm-delete');
    saleForm = document.getElementById('saleForm');
}



// Load all sales from the database
async function loadAllSales() {
    try {
        console.log('Loading sales...');
        const response = await fetch(`${API_BASE_URL}/sales/getsales`);
    

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Sales loaded:', result);
    
    if (result.data) {
        allSales = result.data;
        renderAllSales();
        setupPagination();
    }
} catch (error) {
    console.error('Error loading sales:', error);
    alert('Error loading sales: ' + error.message);
}
}

// Load customers for dropdown
async function loadCustomersForDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/customers/getcustomers`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        if (data && data.data) {
            allCustomers = data.data;
            populateCustomerDropdown();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Load products for dropdown
async function loadProductsForDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/getproducts`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        if (data && data.data) {
            allProducts = data.data;
            populateProductDropdown();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function populateCustomerDropdown() {
    const dropdown = document.getElementById('customer_id');
    if (!dropdown) return;
    
    // Clear existing options except the first one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    allCustomers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.customer_id;
        option.textContent = `${customer.F_name} ${customer.L_name || ''}`;
        dropdown.appendChild(option);
    });
}

function populateProductDropdown() {
    const dropdown = document.getElementById('product_id');
    if (!dropdown) return;
    
    // Clear existing options except the first one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.product_id;
       
        const price = product.unit_price || 0;
        option.textContent = `${product.product_name} - GHc ${parseFloat(price).toFixed(2)}`;
        option.dataset.unitPrice = price;
        dropdown.appendChild(option);
    });
}

function renderAllSales(filteredSales = allSales) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageSales = filteredSales.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('allSalesBody');
    tableBody.innerHTML = '';
    
    if (pageSales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 20px;">
                    No sales found
                </td>
            </tr>
        `;
        return;
    }
    //render sales table
    pageSales.forEach(sale => {
        const customer = allCustomers.find(c => c.customer_id === sale.customer_id);
        const product = allProducts.find(p => p.product_id === sale.product_id);
        
        const customerName = customer ? `${customer.F_name} ${customer.L_name || ''}` : 'N/A';
        const productName = product ? product.product_name : 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.sale_id}</td>
            <td>${customerName}</td>
            <td>${productName}</td>
            <td>${sale.quantity || '0'}</td>
            <td>GHc ${parseFloat(sale.unit_price || 0).toFixed(2)}</td>
            <td>GHc ${parseFloat(sale.total_amount || 0).toFixed(2)}</td>
            <td>${sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}</td>
            <td>${sale.payment_method || "Cash"}
            <td>${sale.status || 'Completed'}</td>
             <td>
                <button class="action-btn edit-btn" onclick="editSale(${sale.sale_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteConfirm(${sale.sale_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function setupSalePageEvents() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterSales);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterSales);
    }
    
    // Calculate total amount when quantity or product changes
    const quantityInput = document.getElementById('quantity');
    const productSelect = document.getElementById('product_id');
    
    if (quantityInput) {
        quantityInput.addEventListener('input', calculateTotalAmount);
    }
    
    if (productSelect) {
        productSelect.addEventListener('change', function() {
            updateUnitPrice();
            calculateTotalAmount();
        });
    }
    
    // Pagination buttons
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderAllSales();
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allSales.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderAllSales();
                updatePagination();
            }
        });
    }
}

function updateUnitPrice() {
    const productSelect = document.getElementById('product_id');
    if (!productSelect) return;
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const unitPrice = selectedOption.dataset.unitPrice || 0;
    document.getElementById('unit_price').value = parseFloat(unitPrice).toFixed(2);
}

function calculateTotalAmount() {
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('unit_price').value) || 0;
    const totalAmount = quantity * unitPrice;
    document.getElementById('total_amount').value = totalAmount.toFixed(2);
}

function filterSales() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filtered = allSales;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(sale => {
            // Find customer and product for this sale
            const customer = allCustomers.find(c => c.customer_id === sale.customer_id);
            const product = allProducts.find(p => p.product_id === sale.product_id);
            
            const customerName = customer ? `${customer.F_name} ${customer.L_name || ''}`.toLowerCase() : '';
            const productName = product ? product.product_name.toLowerCase() : '';
            
            return customerName.includes(searchTerm) ||
                   productName.includes(searchTerm) ||
                   sale.sale_id.toString().includes(searchTerm);
        });
    }
    
    // Filter by type (status)
    if (typeFilter) {
        filtered = filtered.filter(sale => 
            sale.status === typeFilter
        );
    }
    
    currentPage = 1;
    renderAllSales(filtered);
    setupPagination(filtered.length);
}

function setupPagination(totalItems = allSales.length) {
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

// Sale CRUD Operations
function openSaleModal(sale = null) {
    if (!saleModal) return;
    
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('saleForm');
    
    if (sale) {
        modalTitle.textContent = 'Edit Sale';
        document.getElementById('saleId').value = sale.sale_id;
        document.getElementById('customer_id').value = sale.customer_id || '';
        document.getElementById('product_id').value = sale.product_id || '';
        document.getElementById('quantity').value = sale.quantity || '';
        document.getElementById('unit_price').value = sale.unit_price || '';
        document.getElementById('total_amount').value = sale.total_amount || '';
        
        // Format date for input
        if (sale.sale_date) {
            const date = new Date(sale.sale_date);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('sale_date').value = formattedDate;
        } else {
            document.getElementById('sale_date').value = '';
        }
        
        document.getElementById('paymentmethod').value = sale.payment_method || 'Cash';
        document.getElementById('status').value = sale.status || 'Completed';
    } else {
        modalTitle.textContent = 'Add Sale';
        form.reset();
        document.getElementById('saleId').value = '';
        document.getElementById('sale_date').value = new Date().toISOString().split('T')[0];
        document.getElementById('paymentmethod').value = 'Cash';
        document.getElementById('status').value = 'Completed';
    }
    
    saleModal.style.display = 'flex';
}

async function saveSale(e) {
    e.preventDefault();
    console.log('Saving sale...');
    
    const saleId = document.getElementById('saleId').value;
    const saleData = {
        customer_id: document.getElementById('customer_id').value,
        product_id: document.getElementById('product_id').value,
        quantity: parseInt(document.getElementById('quantity').value) || 0,
        unit_price: parseFloat(document.getElementById('unit_price').value) || 0,
        total_amount: parseFloat(document.getElementById('total_amount').value) || 0,
        sale_date: document.getElementById('sale_date').value || new Date().toISOString().split('T')[0],
        payment_method: document.getElementById('paymentmethod').value,
        status: document.getElementById('status').value
    };
    
    // Validation
    if (!saleData.customer_id || !saleData.product_id || !saleData.quantity || saleData.quantity <= 0) {
        showAlert('Customer, Product, and valid Quantity are required', 'error');
        return;
    }
    
    if (saleData.unit_price <= 0) {
        showAlert('Unit price must be greater than 0', 'error');
        return;
    }
    
    try {
        const endpoint = saleId 
            ? `/sales/editsale/${saleId}`
            : '/sales/addsale';
        
        const method = saleId ? 'PUT' : 'POST';
        
        console.log('Sending sale data:', saleData);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData)
        });
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save sale');
        }
        
        showAlert(
            saleId ? 'Sale updated successfully!' : 'Sale added successfully!',
            'success'
        );
        
        closeModal(saleModal);
        loadAllSales();
        
    } catch (error) {
        console.error('Error saving sale:', error);
        showAlert('Error saving sale: ' + error.message, 'error');
    }
}

function showDeleteConfirm(saleId) {
    saleToDelete = saleId;
    const sale = allSales.find(s => s.sale_id == saleId);
    
    if (sale) {
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete sale ${sale.sale_id} Sale?`;
    }
    
    confirmModal.style.display = 'flex';
}

async function deleteSale() {
    if (!saleToDelete) return;
    
    console.log('Deleting sale ID:', saleToDelete);
    
    try {
        const response = await fetch(`${API_BASE_URL}/sales/deletesale/${saleToDelete}`,
            { method: 'DELETE' }
        );
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete sale');
        }
        
        showAlert('Sale deleted successfully!', 'success');
        closeModal(confirmModal);
        loadAllSales();
        
    } catch (error) {
        console.error('Error deleting sale:', error);
        showAlert('Error deleting sale: ' + error.message, 'error');
    }
    
    saleToDelete = null;
}

function editSale(saleId) {
    console.log('Editing sale ID:', saleId);
    const sale = allSales.find(s => s.sale_id == saleId);
    
    if (sale) {
        openSaleModal(sale);
    } else {
        alert('Sale not found!');
    }
}

// Modal Functions
function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Close modals when clicking X
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    // Form submission
    if (saleForm) {
        saleForm.addEventListener('submit', saveSale);
    }
    
    // Confirmation modal buttons
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => closeModal(confirmModal));
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteSale);
    }
    
    // Add Sale button
    const addSaleBtn = document.getElementById('addSaleBtn');
    if (addSaleBtn) {
        addSaleBtn.addEventListener('click', () => openSaleModal());
    }
}

// function for alerts
function showAlert(message, type = 'info') {
    //using browerser alert
    alert(`${type.toUpperCase()}: ${message}`);
}

// CSS 
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
    
    .badge[data-status="Completed"] {
        background-color: #e8f5e8;
        color: #2e7d32;
    }
    
    .badge[data-status="Pending"] {
        background-color: #fff3e0;
        color: #ef6c00;
    }
    
    .badge[data-status="Cancelled"] {
        background-color: #ffebee;
        color: #c62828;
    }
`;
document.head.appendChild(style);

console.log('Sales script loaded successfully!');