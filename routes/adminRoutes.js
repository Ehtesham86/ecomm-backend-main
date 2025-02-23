const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');
const branchController = require('../controllers/branchController');
const supplierController = require('../controllers/supplierController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

const router = express.Router();

// router.get('/admin', authMiddleware, roleMiddleware(['admin']), adminController.adminAccess);

// router.get('/branch', authMiddleware, roleMiddleware(['branch', 'admin']), adminController.branchAccess);

router.get('/dashboard-stats', authMiddleware, roleMiddleware(['admin']), adminController.getDashboardStats);
router.get('/report-stats', authMiddleware, roleMiddleware(['admin']), adminController.getDashboardStats);
router.get('/reports/:filter', authMiddleware, roleMiddleware(['admin']), adminController.getReports);
router.put('/update-profile', authMiddleware, roleMiddleware(['admin']), adminController.updateProfile);
router.put('/update-password', authMiddleware, roleMiddleware(['admin']), adminController.updatePassword);

router.post('/create-branch', authMiddleware, roleMiddleware(['admin']), branchController.createBranch);
router.get('/get-branches', authMiddleware, roleMiddleware(['admin']), branchController.getBranches);
router.get('/get-branch/:id', authMiddleware, roleMiddleware(['admin']), branchController.getBranch);
router.post('/update-branch', authMiddleware, roleMiddleware(['admin']), branchController.updateBranch);
router.delete('/delete-branch/:id', authMiddleware, roleMiddleware(['admin']), branchController.deleteBranch);

router.post('/create-supplier', authMiddleware, roleMiddleware(['admin']), supplierController.createSupplier);
router.post('/update-supplier', authMiddleware, roleMiddleware(['admin']), supplierController.updateSupplier);
router.get('/get-suppliers', authMiddleware, roleMiddleware(['branch', 'admin']), supplierController.getSuppliers);
router.get('/get-supplier/:id', authMiddleware, roleMiddleware(['branch', 'admin']), supplierController.getSupplier);
router.post('/set-holiday', authMiddleware, roleMiddleware(['admin']), supplierController.setHoliday);
router.delete('/delete-supplier/:id', authMiddleware, roleMiddleware(['admin']), supplierController.deleteSupplier);

router.post('/add-category', authMiddleware, roleMiddleware(['admin']), productController.addCategory);
router.post('/update-category', authMiddleware, roleMiddleware(['admin']), productController.updateCategory);
router.get('/get-categories', authMiddleware, roleMiddleware(['branch', 'admin']), productController.getCategories);
router.get('/get-category/:id', authMiddleware, roleMiddleware(['branch', 'admin']), productController.getCategory);
router.delete('/delete-category/:id', authMiddleware, roleMiddleware(['admin']), productController.deleteCategory);

router.get('/get-delivery-days', authMiddleware, roleMiddleware(['admin']), supplierController.getDeliveryDays);
router.get('/get-delivery-day/:id', authMiddleware, roleMiddleware(['admin']), supplierController.getDeliveryDay);
router.post('/add-delivery-days', authMiddleware, roleMiddleware(['admin']), supplierController.addDeliveryDays);
router.post('/edit-delivery-days/:id', authMiddleware, roleMiddleware(['admin']), supplierController.editDeliveryDays);
router.delete('/delete-delivery-days/:id', authMiddleware, roleMiddleware(['admin']), supplierController.deleteDeliveryDays);

router.post('/add-product', authMiddleware, roleMiddleware(['admin']), productController.addProduct);
router.get('/get-product/:id', authMiddleware, roleMiddleware(['admin']), productController.getProduct);
router.post('/update-product', authMiddleware, roleMiddleware(['admin']), productController.updateProduct);
router.get('/get-all-products', authMiddleware, roleMiddleware(['admin']), productController.getAllProduct);
router.get('/get-products-by-suppliers/:supplierId', authMiddleware, roleMiddleware(['admin']), productController.getProductsBySupplier);
router.delete('/delete-product/:id', authMiddleware, roleMiddleware(['admin']), productController.deleteProduct);

router.get('/get-suppliers-with-details', authMiddleware, roleMiddleware(['branch']), productController.getSuppliersWithDetails );
router.get('/get-delivery-days-with-shop/:supplierId', authMiddleware, roleMiddleware(['branch']), supplierController.getDeliveryDaysWithShop );

router.post('/place_order', authMiddleware, roleMiddleware(['branch', 'admin']), orderController.placeOrder);
router.get('/get-all-orders', authMiddleware, roleMiddleware(['admin']), orderController.getAllOrders);
router.get('/get-order/:id', authMiddleware, roleMiddleware(['admin', 'branch']), orderController.getOrder);
router.get('/get-orders-for-supplier/:supplierId', authMiddleware, roleMiddleware(['admin']), orderController.getOrdersBySupplier);
router.get('/get-supplier-order/:supplierId/:orderId', authMiddleware, roleMiddleware(['admin']), orderController.getSupplierOrder);
router.get('/get-orders-for-branch/:branchId', authMiddleware, roleMiddleware(['admin']), orderController.getOrdersForBranch);

router.post('/add-delivery-address', authMiddleware, roleMiddleware(['branch']), orderController.addDeliveryAddress);
router.get('/delivery-addresses', authMiddleware, roleMiddleware(['branch']), orderController.deliveryAddresses);
router.post('/add-card', authMiddleware, roleMiddleware(['branch']), orderController.addCard);
router.get('/cards', authMiddleware, roleMiddleware(['branch']), orderController.cardDetails);

module.exports = router;
