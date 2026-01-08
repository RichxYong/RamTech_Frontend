// Suppliers page specific logic

// Global variables
let allSuppliers = [];
let currentPage = 1;
const itemsPerPage = 10;
let supplierToDelete = null;

const API_BASE_URL = "https://ramtechbackend-production.up.railway.app";

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing suppliers page...');
    
    // Initialize event listeners
    setupEventListeners();
    loadAllSuppliers();
});

// 1. LOAD SUPPLIERS
async function loadAllSuppliers() {
    try {
        console.log('Loading suppliers...');
        const response = await fetch(`${API_BASE_URL}/suppliers/getsuppliers`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Suppliers loaded:', result);
        
        if (result.data) {
            allSuppliers = result.data;
            renderAllSuppliers();
            setupPagination();
        }
    } catch (error) {
        console.error('Error loading suppliers:', error);
        alert('Error loading suppliers: ' + error.message);
    }
}


// 2. RENDER TABLE
function renderAllSuppliers(filteredSuppliers = allSuppliers) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageSuppliers = filteredSuppliers.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('allSuppliersBody');
    tableBody.innerHTML = '';
    
    if (pageSuppliers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    No suppliers found
                </td>
            </tr>
        `;
        return;
    }
    
    pageSuppliers.forEach(supplier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${supplier.supplier_id}</td>
             <td>${supplier.f_name} ${supplier.l_name || ''}</td>
            <td>${supplier.contact || 'N/A'}</td>
            <td>${supplier.email || 'N/A'}</td>
            <td>${supplier.address || 'N/A'}</td>
            <td>${supplier.product_supplied || 'N/A'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editSupplier(${supplier.supplier_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteConfirm(${supplier.supplier_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. ADD/SAVE SUPPLIER
async function saveSupplier(e) {
    e.preventDefault();
    console.log('Saving supplier...');
    
    // Get form data
    const supplierId = document.getElementById('supplierId').value;
   
    // Validation
    
    
    const supplierData = {
        f_name: document.getElementById('fname').value.trim(),
        l_name: document.getElementById('lname').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        product_supplied: document.getElementById('productsupplied').value.trim(),
        
    };
    
    // Add supplier_id for updates
    if (supplierId) {
        supplierData.supplier_id = parseInt(supplierId);
    }
    
    try {
        const url = supplierId 
            ? `${API_BASE_URL}/suppliers/editsupplier/${supplierId}`  
            : `${API_BASE_URL}/suppliers/addsupplier`;             
            
        const method = supplierId ? 'PUT' : 'POST';
        
        console.log('Sending request:', { url, method, data: supplierData });
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(supplierData)
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
            throw new Error(result.message || 'Failed to save supplier');
        }
        
        // Show success message
        alert(supplierId ? 'Supplier updated successfully!' : 'Supplier added successfully!');
        
        // Close modal and reload data
        closeModal('supplierModal');
        loadAllSuppliers();
        
    } catch (error) {
        console.error('Error saving supplier:', error);
        alert('Error: ' + error.message);
    }
}

// 4. DELETE SUPPLIER
async function deleteSupplier() {
    if (!supplierToDelete) return;
    
    console.log('Attempting to delete supplier ID:', supplierToDelete);
    
    try {
        const url = `${API_BASE_URL}/suppliers/deletesupplier/${supplierToDelete}`;
        
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
            throw new Error(result.message || 'Failed to delete supplier');
        }
        
        // Show success message
        alert('Supplier deleted successfully!');
        
        // Close modal and reload data
        closeModal('confirmModal');
        loadAllSuppliers();
        
    } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error: ' + error.message);
    }
    
    supplierToDelete = null;
}

// 5. EDIT SUPPLIER
function editSupplier(supplierId) {
    console.log('Editing supplier ID:', supplierId);
    const supplier = allSuppliers.find(s => s.supplier_id == supplierId);
    
    if (supplier) {
        openSupplierModal(supplier);
    } else {
        alert('Supplier not found!');
    }
}

// 6. MODAL FUNCTIONS
function openSupplierModal(supplier = null) {
    const modal = document.getElementById('supplierModal');
    const form = document.getElementById('supplierForm');
    const modalTitle = document.getElementById('modal-title');
    
    if (supplier) {
        modalTitle.textContent = 'Edit Supplier';
        document.getElementById('supplierId').value = supplier.supplier_id;
        document.getElementById('fname').value.trim(),
        document.getElementById('lname').value.trim(),
        document.getElementById('contact').value = supplier.contact || '';
        document.getElementById('email').value = supplier.email || '';
        document.getElementById('address').value = supplier.address || '';
        document.getElementById('productsupplied').value = supplier.product_supplied || '';
        } else {
        modalTitle.textContent = 'Add Supplier';
        form.reset();
        document.getElementById('supplierId').value = '';
     
    }
    
    modal.style.display = 'flex';
}

function showDeleteConfirm(supplierId) {
    supplierToDelete = supplierId;
    const supplier = allSuppliers.find(s => s.supplier_id == supplierId);
    
    if (supplier) {
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete "${supplier.f_name}"?`;
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
    const supplierForm = document.getElementById('supplierForm');
    if (supplierForm) {
        supplierForm.addEventListener('submit', saveSupplier);
    }
    
    // Confirmation modal buttons
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmDelete = document.getElementById('confirm-delete');
    
    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => closeModal('confirmModal'));
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', deleteSupplier);
    }
    
    // Add Supplier button
    const addSupplierBtn = document.getElementById('addSupplierBtn');
    if (addSupplierBtn) {
        addSupplierBtn.addEventListener('click', () => openSupplierModal());
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterSuppliers);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderAllSuppliers();
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allSuppliers.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderAllSuppliers();
                updatePagination();
            }
        });
    }
}

// 8. HELPER FUNCTIONS
function filterSuppliers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        renderAllSuppliers();
        return;
    }
    
    const filtered = allSuppliers.filter(supplier =>
        (supplier.company_name && supplier.company_name.toLowerCase().includes(searchTerm)) ||
        (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm)) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm)) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm)) ||
        (supplier.city && supplier.city.toLowerCase().includes(searchTerm))
    );
    
    currentPage = 1;
    renderAllSuppliers(filtered);
    setupPagination(filtered.length);
}

function setupPagination(totalItems = allSuppliers.length) {
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
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .form-group textarea {
        min-height: 80px;
        resize: vertical;
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
`;
document.head.appendChild(style);

console.log('Suppliers script loaded successfully!');