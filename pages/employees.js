// Employees page specific logic
// variables
let allEmployees = [];
let currentPage = 1;
const itemsPerPage = 10;
let employeeToDelete = null;

const API_BASE_URL = "https://ramtechbackend-production.up.railway.app";

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing employees page...');
    
    // Initialize event listeners
    setupEventListeners();
    loadAllEmployees();
});

// LOAD EMPLOYEES
async function loadAllEmployees() {
    try {
        console.log('Loading employees...');
        const response = await fetch(`${API_BASE_URL}/employees/getemployees`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Employees loaded:', result);
        
        if (result.data) {
            allEmployees = result.data;
            renderAllEmployees();
            setupPagination();
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        alert('Error loading employees: ' + error.message);
    }
}

// 2. RENDER TABLE
function renderAllEmployees(filteredEmployees = allEmployees) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageEmployees = filteredEmployees.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('allEmployeesBody');
    tableBody.innerHTML = '';
    
    if (pageEmployees.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    No employees found
                </td>
            </tr>
        `;
        return;
    }
    
    pageEmployees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.employee_id}</td>
            <td>${employee.f_name} ${employee.l_name || ''}</td>
            <td>${employee.contact || 'N/A'}</td>
            <td>${employee.position || 'N/A'}</td>
            <td>${employee.salary ? 'GHc ' + employee.salary : 'N/A'}</td>
            <td>${employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editEmployee(${employee.employee_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="showDeleteConfirm(${employee.employee_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. ADD/SAVE EMPLOYEE
async function saveEmployee(e) {
    e.preventDefault();
    console.log('Saving employee...');
    
    // Get form data
    const employeeId = document.getElementById('employeeId').value;
    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    
    // Validation
    if (!fname || !lname) {
        alert('First name and last name are required!');
        return;
    }
    
    const employeeData = {
       
        f_name: document.getElementById('fname').value.trim(),
        l_name: document.getElementById('lname').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        position: document.getElementById('position').value,
        salary: document.getElementById('salary').value,
        hire_date: document.getElementById('hiredate').value || null
    };
    
    // Add employee_id for updates
    if (employeeId) {
        employeeData.employee_id = parseInt(employeeId);
    }
    
    try {
        const url = employeeId 
            ? `${API_BASE_URL}/employees/editemployee/${employeeId}`  
            : `${API_BASE_URL}/employees/addemployee`;             
            
        const method = employeeId ? 'PUT' : 'POST';
        
        console.log('Sending request:', { url, method, data: employeeData });
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData)
        });

         // First check if response is JSON
         const contentType = response.headers.get('content-type');
         if (!contentType || !contentType.includes('application/json')) {
             const text = await response.text();
             console.error('Non-JSON response:', text.substring(0, 200));
             throw new Error(`Server returned ${response.status}: ${response.statusText}. Check if endpoint exists.`);
         }
         
         
         // Show success message
         alert(employeeId ? 'Employee updated successfully!' : 'Employee added successfully!');
         
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save employee');
        }
        
        // Show success message
        alert(employeeId ? 'Employee updated successfully!' : 'Employee added successfully!');
        
        // Close modal and reload data
        closeModal('employeeModal');
        loadAllEmployees();
        
    } catch (error) {
        console.error('Error saving employee:', error);
        alert('Error: ' + error.message);
    }
}

// 4. DELETE EMPLOYEE
async function deleteEmployee() {
    if (!employeeToDelete) return;
    
    console.log('Attempting to delete employee ID:', employeeToDelete);
    
    try {
       
        const url = `${API_BASE_URL}/employees/deleteemployee/${employeeToDelete}`;
        
        console.log('DELETE URL:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        let result = {
            success: false,
            message: 'Unknown error occurred'
        };
        console.log('DELETE Response status:', response.status);
        console.log('DELETE Response headers:', Object.fromEntries(response.headers.entries()));

        console.log('Delete response:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete employee');
        }
        
        // Show success message
        alert('Employee deleted successfully!');
        
        // Close modal and reload data
        closeModal('confirmModal');
        loadAllEmployees();
        
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Error: ' + error.message);
    }
    
    employeeToDelete = null;
}

// 5. EDIT EMPLOYEE
function editEmployee(employeeId) {
    console.log('Editing employee ID:', employeeId);
    const employee = allEmployees.find(e => e.employee_id == employeeId);
    
    if (employee) {
        openEmployeeModal(employee);
    } else {
        alert('Employee not found!');
    }
}

// 6. MODAL FUNCTIONS
function openEmployeeModal(employee = null) {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const modalTitle = document.getElementById('modal-title');
    
    if (employee) {
        modalTitle.textContent = 'Edit Employee';
        document.getElementById('employeeId').value = employee.employee_id;
        document.getElementById('fname').value = employee.f_name || '';
        document.getElementById('lname').value = employee.f_name || '';
        document.getElementById('contact').value = employee.contact || '';
        document.getElementById('position').value = employee.position || 'Manager';
        
        // Format salary - remove any non-numeric characters
        const salary = employee.salary ? employee.salary.replace(/[^0-9]/g, '') : '';
        document.getElementById('salary').value = salary;
        
         // Format date for input
         if (employee.hire_date) {
            const date = new Date(employee.hire_date);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('hiredate').value = formattedDate;
        } else {
            document.getElementById('hiredate').value = '';
        }
        
    } else {
        modalTitle.textContent = 'Add Employee';
        form.reset();
        document.getElementById('employeeId').value = '';
        document.getElementById('hiredate').value = new Date().toISOString().split('T')[0];
    }
    
    modal.style.display = 'flex';
}

function showDeleteConfirm(employeeId) {
    employeeToDelete = employeeId;
    const employee = allEmployees.find(e => e.employee_id == employeeId);
    
    if (employee) {
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete ${employee.f_name} ${employee.l_name}?`;
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
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', saveEmployee);
    }
    
    // Confirmation modal buttons
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmDelete = document.getElementById('confirm-delete');
    
    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => closeModal('confirmModal'));
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', deleteEmployee);
    }
    
    // Add Employee button
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => openEmployeeModal());
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterEmployees);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderAllEmployees();
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allEmployees.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderAllEmployees();
                updatePagination();
            }
        });
    }
}

// 8. HELPER FUNCTIONS
function filterEmployees() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        renderAllEmployees();
        return;
    }
    
    const filtered = allEmployees.filter(employee =>
        (employee.F_name && employee.F_name.toLowerCase().includes(searchTerm)) ||
        (employee.L_name && employee.L_name.toLowerCase().includes(searchTerm)) ||
        (employee.position && employee.position.toLowerCase().includes(searchTerm)) ||
        (employee.contact && employee.contact.toLowerCase().includes(searchTerm))
    );
    
    currentPage = 1;
    renderAllEmployees(filtered);
    setupPagination(filtered.length);
}

function setupPagination(totalItems = allEmployees.length) {
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

//  CSS for better UX
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
`;
document.head.appendChild(style);

console.log('Employees script loaded successfully!');