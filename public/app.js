function getCart() {
    const raw = localStorage.getItem('cart');
    return raw ? JSON.parse(raw) : {};
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    document.getElementById('cartCount').textContent = count;
}

function addToCart(id) {
    const cart = getCart();
    cart[id] = (cart[id] || 0) + 1;
    saveCart(cart);
    updateCartCount();
}

async function loadProducts() {
    const response = await fetch('/api/products');
    const products = await response.json();
    const container = document.getElementById('products');

    if (products.length === 0) {
        container.innerHTML = '<p>Žádné produkty nejsou k dispozici.</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="col-md-4 mb-3">
            <div class="card h-100">
                ${p.image ? `<img src="${escapeHtml(p.image)}" class="card-img-top" style="height: 200px; object-fit: cover;">` : ''}
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(p.name)}</h5>
                    <p class="card-text">${escapeHtml(p.description)}</p>
                    <p class="card-text mt-auto"><strong>${escapeHtml(p.price)} Kč</strong></p>
                    <button class="btn btn-primary" onclick="addToCart('${escapeHtml(p.id)}')">Přidat do košíku</button>
                </div>
            </div>
        </div>
    `).join('');
}

updateCartCount();
loadProducts();
