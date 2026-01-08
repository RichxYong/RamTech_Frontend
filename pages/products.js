// Products page specific logic

// Global variables
let allProducts = [];
let allSuppliers = [];
let currentPage = 1;
const itemsPerPage = 10;
let productToDelete = null;

const API_BASE_URL = "https://ramtechbackend-production.up.railway.app";

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing products page...');
    
    
    // Initialize event listeners
    setupEventListeners();
    loadAllProducts();
});

// 1. LOAD PRODUCTS
async function loadAllProducts() {
    try {
        console.log('Loading products...');
        const response = await fetch(`${API_BASE_URL}/products/getproducts`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Products loaded:', result);
        
        if (result.data) {
            allProducts = result.data;
            renderAllProducts();
            setupPagination();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Error loading products: ' + error.message);
    }
}


// Load suppliers for dropdown


document.addEventListener("DOMContentLoaded", () => {
    loadSuppliersForDropdown();
});

async function loadSuppliersForDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/suppliers/getsuppliers`);
        const data = await response.json();

        console.log("Suppliers loaded:", data);

        allSuppliers = data.data ?? data;
        populateSupplierDropdown();
    } catch (error) {
        console.error("Failed to load suppliers:", error);
    }
}

function populateSupplierDropdown() {
    const dropdown = document.getElementById("supplier_id");
    if (!dropdown) {
        console.error("supplier_id dropdown not found");
        return;
    }

    dropdown.length = 1; // keep "Select Supplier"

    allSuppliers.forEach(supplier => {
        const option = document.createElement("option");
        option.value = supplier.supplier_id;
        option.textContent = `${supplier.f_name} ${supplier.l_name || ""}`;
        dropdown.appendChild(option);
    });
}


// 2. RENDER TABLE
function renderAllProducts(filteredProducts = allProducts) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('allProductsBody');
    tableBody.innerHTML = '';
    
    if (pageProducts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    No products found
                </td>
            </tr>
        `;
        return;
    }
    
    pageProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.product_name || 'N/A'}</td>
            <td>${product.description_description || 'N/A'}</td>
            <td>${product.category || 'N/A'}</td>
            <td>${product.unit_price ? 'GHc ' + product.unit_price : 'N/A'}</td>
            <td>${product.supplier_id || 'N/A'}</td>
            <td>${product.current_stock|| 0}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${product.product_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteConfirm(${product.product_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. ADD/SAVE PRODUCT
async function saveProduct(e) {
    e.preventDefault();
    console.log('Saving product...');
    
    // Get form data
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('pname').value.trim();
    
    // Validation
    if (!pname) {
        alert('Product name is required!');
        return;
    }
    
    const productData = {
        product_name: productName,
        product_description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value.trim(),
        unit_price: parseFloat(document.getElementById('unitprice').value) || 0,
        supplier_id: document.getElementById('supplier_id').value.trim(),
        current_stock: parseInt(document.getElementById('stock').value) || 0
    };
    
    // Add product_id for updates
    if (productId) {
        productData.product_id = parseInt(productId);
    }
    
    try {
        const url = productId 
            ? `${API_BASE_URL}/products/editproduct/${productId}`  
            : `${API_BASE_URL}/products/addproduct`;             
            
        const method = productId ? 'PUT' : 'POST';
        
        console.log('Sending request:', { url, method, data: productData });
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
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
            throw new Error(result.message || 'Failed to save product');
        }
        
        // Show success message
        alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
        
        // Close modal and reload data
        closeModal('productModal');
        loadAllProducts();
        
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error: ' + error.message);
    }
}

// 4. DELETE PRODUCT
async function deleteProduct() {
    if (!productToDelete) return;
    
    console.log('Attempting to delete product ID:', productToDelete);
    
    try {
        const url = `${API_BASE_URL}/products/deleteproduct/${productToDelete}`;
        
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
            throw new Error(result.message || 'Failed to delete product');
        }
        
        // Show success message
        alert('Product deleted successfully!');
        
        // Close modal and reload data
        closeModal('confirmModal');
        loadAllProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error: ' + error.message);
    }
    
    productToDelete = null;
}

// 5. EDIT PRODUCT
function editProduct(productId) {
    console.log('Editing product ID:', productId);
    const product = allProducts.find(p => p.product_id == productId);
    
    if (product) {
        openProductModal(product);
    } else {
        alert('Product not found!');
    }
}

// 6. MODAL FUNCTIONS
function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const modalTitle = document.getElementById('modal-title');
    
    if (product) {
        modalTitle.textContent = 'Edit Product';
        document.getElementById('productId').value = product.product_id;
        document.getElementById('pname').value = product.product_name || '';
        document.getElementById('description').value = product.description || '';
        document.getElementById('category').value = product.category || '';
        document.getElementById('unitprice').value = product.price || '';
        document.getElementById('stock').value = product.stock_quantity || '';
    } else {
        modalTitle.textContent = 'Add Product';
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('category').value = 'Electrical';
        document.getElementById('unitprice').value = '0';
        document.getElementById('stock').value = '0';
    }
    
    modal.style.display = 'flex';
}

function showDeleteConfirm(productId) {
    productToDelete = productId;
    const product = allProducts.find(p => p.product_id == productId);
    
    if (product) {
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete "${product.product_name}"?`;
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
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }
    
    // Confirmation modal buttons
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmDelete = document.getElementById('confirm-delete');
    
    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => closeModal('confirmModal'));
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', deleteProduct);
    }
    
    // Add Product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openProductModal());
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderAllProducts();
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allProducts.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderAllProducts();
                updatePagination();
            }
        });
    }
}

// 8. HELPER FUNCTIONS
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filtered = allProducts;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(product =>
            (product.product_name && product.product_name.toLowerCase().includes(searchTerm)) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by category
    if (categoryFilter) {
        filtered = filtered.filter(product => 
            product.category === categoryFilter
        );
    }
    
    currentPage = 1;
    renderAllProducts(filtered);
    setupPagination(filtered.length);
}

function setupPagination(totalItems = allProducts.length) {
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
    
    .stock-low {
        color: #f44336;
        font-weight: bold;
    }
    
    .stock-ok {
        color: #4CAF50;
    }
`;
document.head.appendChild(style);

console.log('Products script loaded successfully!');