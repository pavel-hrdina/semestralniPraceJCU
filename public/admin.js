let editingId = null;

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getToken() {
    return localStorage.getItem('adminToken');
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const errorEl = document.getElementById('loginError');
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        errorEl.textContent = '';
        showAdmin();
    } else if (response.status === 429) {
        errorEl.textContent = 'Too many attempts, try later';
    } else {
        errorEl.textContent = 'Invalid credentials';
    }
}

async function logout() {
    const token = getToken();
    if (token) {
        await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Authorization': token }
        });
    }
    localStorage.removeItem('adminToken');
    location.reload();
}

function showAdmin() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    loadProducts();
}

async function loadProducts() {
    const response = await fetch('/api/products');
    const products = await response.json();
    const tbody = document.getElementById('productsTable');

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.price)}</td>
            <td>${escapeHtml(p.description)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editProduct('${escapeHtml(p.id)}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${escapeHtml(p.id)}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function saveProduct() {
    const product = {
        name: document.getElementById('name').value,
        price: Number(document.getElementById('price').value),
        description: document.getElementById('description').value
    };

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': getToken()
        },
        body: JSON.stringify(product)
    });

    if (response.ok) {
        clearForm();
        loadProducts();
    } else if (response.status === 401) {
        logout();
    } else {
        const err = await response.json();
        alert(err.error || 'Error');
    }
}

async function editProduct(id) {
    const response = await fetch(`/api/products/${id}`);
    const product = await response.json();

    document.getElementById('name').value = product.name;
    document.getElementById('price').value = product.price;
    document.getElementById('description').value = product.description;

    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('submitBtn').textContent = 'Save';
    document.getElementById('cancelBtn').style.display = 'inline-block';
}

function cancelEdit() {
    clearForm();
}

function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    document.getElementById('description').value = '';
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add Product';
    document.getElementById('submitBtn').textContent = 'Add';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;

    const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() }
    });

    if (response.ok) {
        loadProducts();
    } else if (response.status === 401) {
        logout();
    }
}

if (getToken()) {
    showAdmin();
}
