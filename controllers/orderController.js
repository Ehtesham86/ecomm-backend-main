const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Address = require('../models/addressModel');
const Card = require('../models/cardModel');
const mongoose = require('mongoose');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { createInvoicePDF } = require('./pdfGenerator');

async function sendEmail({ to, subject, text, attachments }) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        attachments,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
    }
}

async function processCardPayment(amount, cardDetails) {
    const paymentRequest = {
        amount: amount * 100,
        currency: 'GBP',
        cardDetails,
        orderReference: `ORDER-${Date.now()}`,
    };

    const paymentConfig = {
        headers: {
            Authorization: `Bearer ${process.env.PAYMENTSENSE_JWT}`,
            'Gateway-Username': process.env.PAYMENTSENSE_GATEWAY_USERNAME,
            'Content-Type': 'application/json',
        },
    };

    console.log('Payment Request:', paymentRequest);
    console.log('Payment Config:', paymentConfig);

    try {
        const response = await axios.post(
            'https://api.paymentsense.com/api/v2/transactions',
            paymentRequest,
            paymentConfig
        );

        return response.data && response.data.status === 'success';
    } catch (error) {
        console.error('Payment API Error:', error.response?.data || error.message);
        return false;
    }
}

exports.placeOrder = async (req, res) => {
    const {
        deliveryAddress,
        deliveryInstructions,
        paymentMethod,
        paymentDetails,
        suppliers,
    } = req.body;

    try {
        const shopDetails = req.user;
        let totalOrderPrice = 0;
        const allProducts = [];

        for (const supplier of suppliers) {
            for (const product of supplier.products) {
                const dbProduct = await Product.findById(product.productId);
                if (!dbProduct) {
                    return res.status(404).json({ error: `Product with ID ${product.productId} not found` });
                }
                totalOrderPrice += dbProduct.price * product.quantity;
                allProducts.push({
                    product: product.productId,
                    quantity: product.quantity,
                    deliveryDate: supplier.deliveryDate
                });
            }
        }

        if (paymentMethod === 'Card Payment') {
            const card = await Card.findById(paymentDetails.cardId);
            if (!card) {
                return res.status(404).json({ status: false, error: 'Card not found' });
            }

            const cardDetails = {
                cardHolderName: card.cardHolderName,
                cardNumber: card.cardNumber,
                expiryDate: card.expiryDate,
                cvv: card.cvv
            };

            const paymentSuccess = await processCardPayment(totalOrderPrice, cardDetails);
            if (!paymentSuccess) {
                return res.status(400).json({ status: false, error: 'Payment failed' });
            }
        }

        const order = new Order({
            branch: shopDetails._id,
            products: allProducts,
            totalPrice: totalOrderPrice,
            status: 'Pending',
            createdAt: new Date()
        });
        await order.save();

        // Generate PDF invoice
        const adminPDF = await createInvoicePDF([order], deliveryAddress, deliveryInstructions, paymentMethod);

        // Send emails
        await sendEmail({
            to: shopDetails.email,
            subject: 'Complete Order Details',
            text: `Dear ${shopDetails.firstname}, please find the complete order details attached.`,
            attachments: [{ filename: 'ShopOrder.pdf', content: adminPDF }],
        });

        await sendEmail({
            to: 'masad3290@gmail.com',
            subject: 'New Order Placed',
            text: 'A new order has been placed. Please find the complete details attached.',
            attachments: [{ filename: 'AdminOrder.pdf', content: adminPDF }],
        });

        // Clear cart data from cookies
        res.cookie('cart', '', { expires: new Date(0), httpOnly: true });

        res.status(201).json({ status: true, message: 'Order placed successfully' });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ status: false, error: 'Failed to place order' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('branch', 'firstname lastname email address paymentMethod')
            .populate('products.product', 'supplier category image name sku price vat');

        res.json({ status: true, orders: orders });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get orders' });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const order = await Order.find({ _id: req.params.id })
            .populate('branch', 'firstname lastname email address paymentMethod')
            .populate({
                path: 'products.product',
                populate: {
                    path: 'supplier',
                    select: 'name email phone address' // Select supplier fields you want to include
                }
            })
            .populate('products.product.category', 'name description'); // Optional: Populate category if needed

        res.json({ status: true, order });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get orders' });
    }
};

exports.getOrdersBySupplier = async (req, res) => {
    try {
        const supplierId = new mongoose.Types.ObjectId(req.params.supplierId);

        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branchDetails',
                },
            },
            {
                $match: {
                    'productDetails.supplier': supplierId,
                },
            },
            {
                $project: {
                    branch: '$branchDetails',
                    totalPrice: 1,
                    deliveryDate: 1,
                    status: 1,
                    createdAt: 1,
                    products: {
                        $filter: {
                            input: '$productDetails',
                            as: 'product',
                            cond: { $eq: ['$$product.supplier', supplierId] },
                        },
                    },
                },
            },
        ]);

        res.json({ status: true, order: orders });
    } catch (error) {
        console.error('Error fetching orders by supplier:', error);
        res.status(500).json({ status: false, error: 'Failed to get orders' });
    }
};

// exports.getOrdersBySupplier = async (req, res) => {
//     try {
//         const supplierId = new mongoose.Types.ObjectId(req.params.supplierId);

//         const orders = await Order.aggregate([
//             // Lookup products
//             {
//                 $lookup: {
//                     from: "products",
//                     localField: "products.product",
//                     foreignField: "_id",
//                     as: "productDetails",
//                 },
//             },

//             // Lookup branches
//             {
//                 $lookup: {
//                     from: "users",
//                     localField: "branch",
//                     foreignField: "_id",
//                     as: "branchDetails",
//                 },
//             },

//             // Add a field with filtered products by the supplier
//             {
//                 $addFields: {
//                     filteredProducts: {
//                         $filter: {
//                             input: "$productDetails",
//                             as: "product",
//                             cond: { $eq: ["$$product.supplier", supplierId] },
//                         },
//                     },
//                 },
//             },

//             // Match orders with at least one product from the supplier
//             {
//                 $match: {
//                     filteredProducts: { $ne: [] },
//                 },
//             },

//             // Format the response
//             {
//                 $project: {
//                     branch: "$branchDetails",
//                     totalPrice: 1,
//                     deliveryDate: 1,
//                     status: 1,
//                     createdAt: 1,
//                     products: {
//                         $map: {
//                             input: "$filteredProducts",
//                             as: "product",
//                             in: {
//                                 product: "$$product._id",
//                                 name: "$$product.name",
//                                 price: "$$product.price",
//                                 quantity: {
//                                     $arrayElemAt: [
//                                         "$products.quantity",
//                                         { $indexOfArray: ["$products.product", "$$product._id"] },
//                                     ],
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//         ]);

//         res.json({ status: true, orders });
//     } catch (error) {
//         console.error("Error fetching orders by supplier:", error);
//         res.status(500).json({ status: false, error: "Failed to get orders" });
//     }
// };


exports.getSupplierOrder = async (req, res) => {
    try {
        const supplierId = new mongoose.Types.ObjectId(req.params.supplierId);
        const orderId = new mongoose.Types.ObjectId(req.params.orderId);

        const orderDetails = await Order.aggregate([
            { $match: { _id: orderId } },

            { $unwind: "$products" },

            {
                $lookup: {
                    from: "products", 
                    localField: "products.product",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },

            { $unwind: "$productDetails" },

            { $match: { "productDetails.supplier": supplierId } },

            {
                $lookup: {
                    from: "users",
                    localField: "branch",
                    foreignField: "_id",
                    as: "branchDetails",
                },
            },

            { $unwind: "$branchDetails" },

            {
                $group: {
                    _id: "$_id",
                    branch: { $first: "$branchDetails" },
                    deliveryDate: { $first: "$deliveryDate" },
                    status: { $first: "$status" },
                    createdAt: { $first: "$createdAt" },
                    totalPrice: { $first: "$totalPrice" },
                    products: {
                        $push: {
                            product: "$products.product",
                            quantity: "$products.quantity",
                            details: "$productDetails",
                        },
                    },
                },
            },
        ]);


        res.json({ status: true, order: orderDetails.length ? orderDetails[0] : [] });
    } catch (error) {
        console.error('Error fetching orders by supplier:', error);
        res.status(500).json({ status: false, error: 'Failed to get orders' });
    }
};

exports.getOrdersForBranch = async (req, res) => {
    try {
        const order = await Order.find({ branch: req.params.branchId })
            .populate('branch', 'firstname email address paymentMethod')
            .populate({
                path: 'products.product',
                populate: {
                    path: 'supplier',
                    select: 'name email phone address'
                }
            })
            .populate('products.product.category', 'name description');

        res.json({ status: true, order });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get orders' });
    }
};

exports.deliveryAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ branch: req.user.id });
        res.status(201).json({ status: true, addresses });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: 'Failed to fetch address' });
    }
};

exports.addDeliveryAddress = async (req, res) => {
    const { addressLine1, addressLine2, county, postcode, townCity } = req.body;
    const { id } = req.user;
    const payload = { addressLine1, addressLine2, county, postcode, townCity, branch: id };
    try {
        const address = new Address(payload);
        await address.save();
        res.status(201).json({ status: true, message: "Address added successfully", address });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: 'Failed to add address' });
    }
};

exports.cardDetails = async (req, res) => {
    try {
        const cards = await Card.find({ branch: req.user.id }).select('-cvv');
        res.status(201).json({ status: true, cards });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: 'Failed to fetch card' });
    }
};

exports.addCard = async (req, res) => {
    const { cardNumber, expiryDate, cvv, cardHolderName } = req.body;
    const { id } = req.user;
    const payload = { cardNumber, expiryDate, cvv, cardHolderName, branch: id };
    try {
        const card = new Card(payload);
        await card.save();
        res.status(201).json({ status: true, message: "Card added successfully", card });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: 'Failed to add card' });
    }
};