const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000; // Using port 5000 for backend

// Set up middleware
app.use(cors()); // Allow frontend to make requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Create product schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Create product model
const Product = mongoose.model('Product', productSchema);

// Set up storage for multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Create a unique filename
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Serve product images
app.get('/api/products/images/:imageName', (req, res) => {
    const imagePath = path.join(__dirname, 'uploads', req.params.imageName);
    res.sendFile(imagePath, err => {
        if (err) {
            res.status(404).json({ message: 'Image not found' });
        }
    });
});

// Add a new product
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, stock, rating } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Image file is required' });
        }
        
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            stock: stock || 0,
            rating: rating || 0,
            image: req.file.filename
        });
        
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a product
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, stock, rating } = req.body;
        const updateData = { name, description, price, category, stock, rating };
        
        // If a new image is uploaded, update the image field
        if (req.file) {
            updateData.image = req.file.filename;
            
            // Delete old image if it exists
            const product = await Product.findById(req.params.id);
            if (product && product.image) {
                const oldImagePath = path.join(__dirname, 'uploads', product.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Delete product image if it exists
        if (product.image) {
            const imagePath = path.join(__dirname, 'uploads', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed database with sample products (for development)
async function seedDatabase() {
    // Check if we already have products in the database
    const count = await Product.countDocuments();
    if (count > 0) {
        console.log('Database already has products, skipping seed.');
        return;
    }
    
    console.log('Seeding database with sample products...');
    
    const sampleProducts = [
        {
            name: 'Wireless Headphones',
            description: 'High-quality wireless headphones with noise cancellation.',
            price: 149.99,
            category: 'electronics',
            stock: 50,
            rating: 4.5,
            image: 'headphones.jpg' // This would need to be manually added to the uploads folder
        },
        {
            name: 'Smart Watch',
            description: 'Track your fitness and stay connected with this sleek smart watch.',
            price: 199.99,
            category: 'electronics',
            stock: 30,
            rating: 4.2,
            image: 'smartwatch.jpg'
        },
        {
            name: 'Cotton T-Shirt',
            description: 'Comfortable 100% cotton t-shirt available in multiple colors.',
            price: 19.99,
            category: 'clothing',
            stock: 100,
            rating: 4.0,
            image: 'tshirt.jpg'
        },
        {
            name: 'Denim Jeans',
            description: 'Classic denim jeans with a modern fit.',
            price: 59.99,
            category: 'clothing',
            stock: 75,
            rating: 4.3,
            image: 'jeans.jpg'
        },
        {
            name: 'Coffee Maker',
            description: 'Programmable coffee maker for the perfect morning brew.',
            price: 89.99,
            category: 'home',
            stock: 25,
            rating: 4.7,
            image: 'coffeemaker.jpg'
        },
        {
            name: 'Blender',
            description: 'High-powered blender for smoothies and more.',
            price: 79.99,
            category: 'home',
            stock: 20,
            rating: 4.1,
            image: 'blender.jpg'
        },
        {
            name: 'Wireless Earbuds',
            description: 'Compact wireless earbuds with amazing sound quality.',
            price: 129.99,
            category: 'electronics',
            stock: 40,
            rating: 4.6,
            image: 'earbuds.jpg'
        },
        {
            name: 'Running Shoes',
            description: 'Lightweight and comfortable running shoes for all terrains.',
            price: 89.99,
            category: 'clothing',
            stock: 60,
            rating: 4.4,
            image: 'shoes.jpg'
        }
    ];
    
    try {
        await Product.insertMany(sampleProducts);
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    
    // Seed the database when the server starts
    seedDatabase();
});