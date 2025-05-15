// frontend/js/app.js

// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Backend API URL

// Global variables
let allProducts = [];
let filteredProducts = [];
const productsPerPage = 8;
let currentPage = 1;

// DOM elements
const productGrid = document.getElementById('productGrid');
const loadingElement = document.getElementById('loading');
const paginationElement = document.getElementById('pagination');
const categoryFilter = document.getElementById('categoryFilter');
const sortBySelect = document.getElementById('sortBy');
const searchInput = document.getElementById('searchInput');

// Fetch products from the server
async function fetchProducts() {
    try {
        loadingElement.style.display = 'block';
        
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts];
        
        applyFilters();
        loadingElement.style.display = 'none';
    } catch (error) {
        loadingElement.textContent = 'Error loading products. Please try again later.';
        loadingElement.classList.add('error');
        console.error('Error fetching products:', error);
    }
}

// Render products on the page
function renderProducts() {
    // Clear existing products
    productGrid.innerHTML = '';
    
    // Calculate products for current page
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (currentProducts.length === 0) {
        productGrid.innerHTML = '<div class="error">No products found matching your criteria.</div>';
        return;
    }
    
    // Create product cards
    currentProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        productCard.innerHTML = `
            <img src="${API_BASE_URL}/products/images/${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <div class="product-name">${product.title}</div>
                <div class="product-price">$${product.currentPrice.toFixed(2)}</div>
                <div class="product-description">${product.description.substring(0, 60)}${product.description.length > 60 ? '...' : ''}</div>
                <button class="add-to-cart" data-id="${product._id}">Add to Cart</button>
            </div>
        `;
        
        productGrid.appendChild(productCard);
    });
    
    // Setup add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            addToCart(productId);
        });
    });
    
    // Update pagination
    renderPagination();
}

// Apply filters and sorting to products
function applyFilters() {
    const categoryValue = categoryFilter.value;
    const searchValue = searchInput.value.toLowerCase();
    const sortValue = sortBySelect.value;
    
    // Filter by category and search term
    filteredProducts = allProducts.filter(product => {
        const matchesCategory = !categoryValue || product.console === categoryValue;
        const matchesSearch = !searchValue || 
            product.title.toLowerCase().includes(searchValue) || 
            product.description.toLowerCase().includes(searchValue);
        
        return matchesCategory && matchesSearch;
    });
    
    // Apply sorting
    switch (sortValue) {
        case 'price_asc':
            filteredProducts.sort((a, b) => a.currentPrice - b.currentPrice);
            break;
        case 'price_desc':
            filteredProducts.sort((a, b) => b.currentPrice - a.currentPrice);
            break;
        case 'name_asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name_desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    
    // Reset to first page and render
    currentPage = 1;
    renderProducts();
}

// Render pagination controls
function renderPagination() {
    paginationElement.innerHTML = '';
    
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
        }
    });
    paginationElement.appendChild(prevButton);
    
    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderProducts();
        });
        paginationElement.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
        }
    });
    paginationElement.appendChild(nextButton);
}

// Add to cart functionality (placeholder)
function addToCart(productId) {
    console.log(`Product added to cart: ${productId}`);
    // Here you would typically send a request to add the item to a cart API
    // or store it in localStorage for a simple implementation
    alert('Product added to cart!');
}

// Event listeners
categoryFilter.addEventListener('change', applyFilters);
sortBySelect.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});