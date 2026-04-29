function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadProducts() {
    const response = await fetch('/api/products');
    const products = await response.json();
    const container = document.getElementById('products');

    if (products.length === 0) {
        container.innerHTML = '<p>No products available.</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(p.name)}</h5>
                    <p class="card-text">${escapeHtml(p.description)}</p>
                    <p class="card-text"><strong>${escapeHtml(p.price)} CZK</strong></p>
                </div>
            </div>
        </div>
    `).join('');
}

loadProducts();
