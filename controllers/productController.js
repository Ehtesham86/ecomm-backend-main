const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Supplier = require('../models/supplierModel');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const categoryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/category_icons/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/product_images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const productUpdateStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/product_images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadProductImage = multer({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max file size for product image is 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
}).single('image');

const uploadUpdatedProductImage = multer({
    storage: productUpdateStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max file size for product image is 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
}).single('image');

const uploadCategoryIcon = multer({
    storage: categoryStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
}).single('image');

exports.addCategory = async (req, res) => {
    uploadCategoryIcon(req, res, async (err) => {
        if (err) {
            res.status(400).json({ status: false, error: err.message });
        }

        const { name } = req.body;
        const imageUrl = req.file ? `/uploads/category_icons/${req.file.filename}` : null;

        try {
            const category = new Category({ name: name, image: imageUrl });
            await category.save();
            res.status(201).json({ status: true, category });
        } catch (error) {
            res.status(500).json({ status: false, error: 'Failed to add category' });
        }
    });
};

exports.updateCategory = async (req, res) => {
    uploadCategoryIcon(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: false, error: err.message });
        }

        const { id, name } = req.body;
        const imageUrl = req.file ? `/uploads/category_icons/${req.file.filename}` : null;

        try {
            const updateData = { name };
            if (imageUrl) {
                updateData.image = imageUrl;
            }

            const category = await Category.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (!category) {
                return res.status(404).json({ status: false, error: 'Category not found' });
            }

            res.status(200).json({ status: true, category });
        } catch (error) {
            res.status(500).json({ status: false, error: 'Failed to update category' });
        }
    });
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ status: true, categories: categories });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get categories' });
    }
};

exports.getCategory = async (req, res) => {
    try {
        const categories = await Category.find({ _id: req.params.id });
        res.json({ status: true, categories: categories });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get categories' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ status: false, error: 'Category not found' });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.json({ status: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ status: false, error: 'Failed to delete category' });
    }
};


exports.addProduct = async (req, res) => {
    uploadProductImage(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: false, error: err.message });
        }

        const { supplier, category, name, sku, price, vat, status, description } = req.body;
        const productImageUrl = req.file ? `/uploads/product_images/${req.file.filename}` : null;

        const isVat = vat == 'false' ? 0 : (vat ? 20 : 0);

        console.log(vat);

        const payload = {
            supplier: supplier,
            category: category,
            image: productImageUrl,
            name,
            sku,
            price,
            vat: isVat,
            status,
            description
        };

        console.log(payload);

        try {
            const product = new Product(payload);

            await product.save();
            res.status(201).json({ status: true, product });
        } catch (error) {
            res.status(500).json({ status: false, error: 'Failed to add product' });
        }
    });
};

exports.updateProduct = async (req, res) => {
    uploadUpdatedProductImage(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: false, error: err.message });
        }
        const { id, supplier, category, name, sku, price, vat, status, description } = req.body;
        const productImageUrl = req.file ? `/uploads/product_images/${req.file.filename}` : null;

        try {
            console.log(req.body);
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ status: false, error: 'Product not found' });
            }

            const isVat = vat == 'true' ? 20 : 0;

            product.supplier = supplier;
            product.category = category;
            product.image = productImageUrl || product.image;
            product.name = name;
            product.sku = sku;
            product.price = price;
            product.vat = isVat;
            product.status = status;
            product.description = description;

            await product.save();
            res.status(200).json({ status: true, product });
        } catch (error) {
            res.status(500).json({ status: false, error: 'Failed to update product' });
        }
    });
};

exports.getAllProduct = async (req, res) => {
    try {
        const products = await Product.find().populate('supplier', 'name').populate('category', 'name');
        res.json({ status: true, products: products });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get products' });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.find({ _id: req.params.id }).populate('supplier', 'name').populate('category', 'name');
        res.json({ status: true, product });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get products' });
    }
};

exports.getProductsBySupplier = async (req, res) => {
    try {
        const products = await Product.find({ supplier: req.params.supplierId }).populate('supplier', 'name').populate('category', 'name');
        res.json({ status: true, products: products });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get products' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ status: false, error: 'Product not found' });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({ status: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ status: false, error: 'Failed to delete product' });
    }
};

exports.getSuppliersWithDetails = async (req, res) => {
    try {
        const branchId = req.user.id;
        const suppliers = await Supplier.aggregate([
            {
              $lookup: {
                from: 'products', // Collection name for products
                localField: '_id',
                foreignField: 'supplier',
                as: 'products',
              },
            },
            {
              $lookup: {
                from: 'categories', // Collection name for categories
                localField: 'products.category',
                foreignField: '_id',
                as: 'categories',
              },
            },
            {
              $lookup: {
                from: 'holidays', // Collection name for holidays
                localField: 'holidays',
                foreignField: '_id',
                as: 'holidays',
              },
            },
            {
              $lookup: {
                from: 'deliveries', // Collection name for deliveries
                let: { supplierId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ['$supplier', '$$supplierId'] }, { $eq: ['$branch', branchId] }] } } },
                  { $project: { days: 1, _id: 0 } },
                ],
                as: 'deliveryDays',
              },
            },
            {
              $addFields: {
                categorizedProducts: {
                  $map: {
                    input: '$categories',
                    as: 'category',
                    in: {
                      _id: '$$category._id',
                      name: '$$category.name',
                      image: '$$category.image',
                      createdAt: '$$category.createdAt',
                      products: {
                        $filter: {
                          input: '$products',
                          as: 'product',
                          cond: { $eq: ['$$product.category', '$$category._id'] },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                products: 0, // Remove the raw products array
                categories: 0, // Remove the raw categories array
              },
            },
          ]);

        res.json({ status: true, suppliers });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ status: false, error: 'Failed to get product' });
    }
};