function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

async function loadCart() {
    const cart = getCart();
    const ids = Object.keys(cart);
    const content = document.getElementById('cartContent');

    if (ids.length === 0) {
        content.innerHTML = `
            <p>Košík je prázdný.</p>
            <a href="index.html" class="btn btn-primary">Pokračovat v nákupu</a>
        `;
        return;
    }

    const response = await fetch('/api/products');
    const allProducts = await response.json();
    const validIds = new Set(allProducts.map(p => p.id));

    let removedAny = false;
    for (const id of ids) {
        if (!validIds.has(id)) {
            delete cart[id];
            removedAny = true;
        }
    }
    if (removedAny) {
        saveCart(cart);
        updateCartCount();
        return loadCart();
    }

    const items = ids.map(id => {
        const product = allProducts.find(p => p.id === id);
        return { ...product, quantity: cart[id] };
    });

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    content.innerHTML = `
        <table class="table align-middle">
            <thead>
                <tr>
                    <th>Obrázek</th>
                    <th>Název</th>
                    <th>Cena</th>
                    <th>Množství</th>
                    <th>Mezisoučet</th>
                    <th>Akce</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.image ? `<img src="${escapeHtml(item.image)}" style="height: 50px;">` : '—'}</td>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${escapeHtml(item.price)} Kč</td>
                        <td>
                            <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity('${escapeHtml(item.id)}', -1)">−</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity('${escapeHtml(item.id)}', 1)">+</button>
                        </td>
                        <td><strong>${item.price * item.quantity} Kč</strong></td>
                        <td><button class="btn btn-sm btn-danger" onclick="removeFromCart('${escapeHtml(item.id)}')">Smazat</button></td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4" class="text-end"><strong>Celkem:</strong></td>
                    <td colspan="2"><strong>${total} Kč</strong></td>
                </tr>
            </tfoot>
        </table>

        <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-outline-danger" onclick="clearCart()">Vyprázdnit košík</button>
            <button class="btn btn-success" onclick="placeOrder()">Objednat</button>
        </div>
    `;
}

function changeQuantity(id, delta) {
    const cart = getCart();
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) {
        delete cart[id];
    }
    saveCart(cart);
    updateCartCount();
    loadCart();
}

function removeFromCart(id) {
    const cart = getCart();
    delete cart[id];
    saveCart(cart);
    updateCartCount();
    loadCart();
}

function clearCart() {
    if (!confirm('Opravdu vyprázdnit košík?')) return;
    saveCart({});
    updateCartCount();
    loadCart();
}

function placeOrder() {
    if (!confirm('Dokončit objednávku?')) return;
    alert('Děkujeme za objednávku!');
    saveCart({});
    updateCartCount();
    loadCart();
}

updateCartCount();
loadCart();
