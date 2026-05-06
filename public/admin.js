let editingId = null;
let currentImage = '';

const MAX_IMAGE_BYTES = 600 * 1024;


/**
 * Převede nebezpečné HTML znaky na bezpečné entity.
 * Slouží jako prevence proti XSS útokům při výpisu uživatelského textu.
 * 
 * @param {string} str - Textový řetězec k ošetření
 * @returns {string} Ošetřený řetězec s HTML entitami
 */
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
        errorEl.textContent = 'Příliš mnoho pokusů, zkus to později';
    } else {
        errorEl.textContent = 'Neplatné přihlašovací údaje';
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
            <td>${p.image ? `<img src="${escapeHtml(p.image)}" style="height: 50px;">` : '—'}</td>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.price)}</td>
            <td>${escapeHtml(p.description)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editProduct('${escapeHtml(p.id)}')">Upravit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${escapeHtml(p.id)}')">Smazat</button>
            </td>
        </tr>
    `).join('');
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
        alert('Obrázek je příliš velký. Maximum je 600 KB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result;
        showPreview(currentImage);
    };
    reader.readAsDataURL(file);
}

function showPreview(dataUrl) {
    document.getElementById('previewImg').src = dataUrl;
    document.getElementById('imagePreview').style.display = 'block';
}

function removeImage() {
    currentImage = '';
    document.getElementById('imageFile').value = '';
    document.getElementById('imagePreview').style.display = 'none';
}

async function saveProduct() {
    const product = {
        name: document.getElementById('name').value,
        price: Number(document.getElementById('price').value),
        description: document.getElementById('description').value,
        image: currentImage
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
        alert(err.error || 'Chyba');
    }
}

async function editProduct(id) {
    const response = await fetch(`/api/products/${id}`);
    const product = await response.json();

    document.getElementById('name').value = product.name;
    document.getElementById('price').value = product.price;
    document.getElementById('description').value = product.description;

    currentImage = product.image || '';
    if (currentImage) {
        showPreview(currentImage);
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }

    editingId = id;
    document.getElementById('formTitle').textContent = 'Upravit produkt';
    document.getElementById('submitBtn').textContent = 'Uložit';
    document.getElementById('cancelBtn').style.display = 'inline-block';
}

function cancelEdit() {
    clearForm();
}

function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    document.getElementById('description').value = '';
    document.getElementById('imageFile').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    currentImage = '';
    editingId = null;
    document.getElementById('formTitle').textContent = 'Přidat produkt';
    document.getElementById('submitBtn').textContent = 'Přidat';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function deleteProduct(id) {
    if (!confirm('Opravdu smazat tento produkt?')) return;

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
