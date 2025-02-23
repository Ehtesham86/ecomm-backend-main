const Order = require('../models/orderModel');
const Supplier = require('../models/supplierModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const moment = require('moment');


const getDateRange = (option) => {
    let startDate, endDate;

    switch (option) {
        case 'Today':
            startDate = moment().startOf('day');
            endDate = moment().endOf('day');
            break;
        case 'Yesterday':
            startDate = moment().subtract(1, 'day').startOf('day');
            endDate = moment().subtract(1, 'day').endOf('day');
            break;
        case 'Week to date':
            startDate = moment().startOf('week');
            endDate = moment();
            break;
        case 'Last week':
            startDate = moment().subtract(1, 'week').startOf('week');
            endDate = moment().subtract(1, 'week').endOf('week');
            break;
        case 'Month to date':
            startDate = moment().startOf('month');
            endDate = moment();
            break;
        case 'Last month':
            startDate = moment().subtract(1, 'month').startOf('month');
            endDate = moment().subtract(1, 'month').endOf('month');
            break;
        case 'Quarter to date':
            startDate = moment().startOf('quarter');
            endDate = moment();
            break;
        case 'Last quarter':
            startDate = moment().subtract(1, 'quarter').startOf('quarter');
            endDate = moment().subtract(1, 'quarter').endOf('quarter');
            break;
        case 'Year to date':
            startDate = moment().startOf('year');
            endDate = moment();
            break;
        case 'Last year':
            startDate = moment().subtract(1, 'year').startOf('year');
            endDate = moment().subtract(1, 'year').endOf('year');
            break;
        default:
            throw new Error('Invalid date range option');
    }

    return { startDate: startDate.toDate(), endDate: endDate.toDate() };
};

exports.getReports = async (req, res) => {
    try {
        const range = req.params.filter;

        const { startDate, endDate } = getDateRange(range);

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate('products.product branch');

        let grossSales = 0;
        let taxesPaid = 0;
        let totalOrders = orders.length;
        let orderDetails = [];

        orders.forEach(order => {
            let orderGrossSales = 0;
            let orderTaxes = 0;

            order.products.forEach(item => {
                const productPrice = item.product.price;
                const productVAT = item.product.vat || 0;

                const itemGrossSales = productPrice * item.quantity;
                const itemTax = (productPrice * productVAT * item.quantity) / 100;

                orderGrossSales += itemGrossSales;
                orderTaxes += itemTax;
            });

            grossSales += orderGrossSales;
            taxesPaid += orderTaxes;

            orderDetails.push({
                orderId: order._id,
                branch: order.branch,
                products: order.products,
                grossSales: orderGrossSales.toFixed(2),
                taxes: orderTaxes.toFixed(2),
                netSales: (orderGrossSales - orderTaxes).toFixed(2),
                deliveryDate: order.deliveryDate,
                status: order.status
            });
        });

        const netSales = grossSales - taxesPaid;

        const report = {
            summary: {
                totalOrders,
                grossSales: grossSales.toFixed(2),
                taxesPaid: taxesPaid.toFixed(2),
                netSales: netSales.toFixed(2)
            },
            orderDetails
        }
        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstname, lastname, email } = req.body;
        const userId = req.user.id;

        const user = await User.findByIdAndUpdate(userId, { firstname, lastname, email }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const authPayload = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(authPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ user, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile.' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { password, newPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        const isMatch = await user.isPasswordMatch(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password.' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const suppliers = await Supplier.countDocuments();
        const branches = await User.find({ role: 'branch' }).countDocuments();
        const orders = await Order.countDocuments();
        const products = await Product.countDocuments();
        const sales = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalSum: { $sum: "$totalPrice" }
                }
            }
        ]);

        const stats = {
            "suppliers": suppliers,
            "branches": branches,
            "orders": orders,
            "products": products,
            "sales": sales.length > 0 ? sales[0].totalSum : 0,
        }

        res.status(201).json({ status: true, stats: stats });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get stats' });
    }
}