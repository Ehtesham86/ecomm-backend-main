const Supplier = require('../models/supplierModel');
const Holiday = require('../models/holidayModel');
const Order = require('../models/orderModel');
const Delivery = require('../models/deliveryModel');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/supplier_icons/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadSupplierIcon = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
}).single('image');

exports.createSupplier = async (req, res) => {
    uploadSupplierIcon(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: false, error: err.message });
        }
        const { name, email, phone, streetAddress, city, postcode, holidays, status } = req.body;
        const imageUrl = req.file ? `/uploads/supplier_icons/${req.file.filename}` : null;

        try {
            const holidayList = holidays.split(',').map(h => h.trim());
            const holidayDates = holidayList
                .filter(item => !isNaN(Date.parse(item)))
                .map(item => new Date(item));

            const holiday = new Holiday({ holidays: holidayDates });
            await holiday.save();

            const address = {
                street: streetAddress,
                city: city,
                postcode: postcode
            }

            const supplier = new Supplier({ icon: imageUrl, name: name, email: email, phone: phone, address: address, holidays: holiday._id, status: status });
            await supplier.save();

            res.status(201).json({ status: true, supplier });
        } catch (error) {
            res.status(500).json({ status: false, error: 'Failed to add supplier' });
        }
    });

};

exports.updateSupplier = async (req, res) => {
    uploadSupplierIcon(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ status: false, error: err.message });
        }
        const { id, name, email, phone, streetAddress, city, postcode, deliveryDays, holidays, status } = req.body;
        const imageUrl = req.file ? `/uploads/supplier_icons/${req.file.filename}` : null;

        try {
            const supplier = await Supplier.findById(id);
            if (!supplier) {
                return res.status(404).json({ status: false, error: 'Supplier not found' });
            }

            let holiday;
            if (holidays) {
                let holidaysArray = JSON.parse(holidays);

                let formattedHolidays = holidaysArray.map(dateStr => {
                    let date = new Date(dateStr.split('/').reverse().join('-'));

                    let options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
                    return date.toLocaleDateString('en-GB', options);
                }).join(',');
                const holidayList = formattedHolidays.split(',').map(h => h.trim());
                const holidayDates = holidayList
                    .filter(item => !isNaN(Date.parse(item)))
                    .map(item => new Date(item));

                if (supplier.holidays) {
                    holiday = await Holiday.findById(supplier.holidays);
                    holiday.holidays = holidayDates;
                    await holiday.save();
                } else {
                    holiday = new Holiday({ holidays: holidayDates });
                    await holiday.save();
                }
            }

            supplier.name = name || supplier.name;
            supplier.email = email || supplier.email;
            supplier.phone = phone || supplier.phone;
            supplier.address = {
                street: streetAddress || supplier.address.street,
                city: city || supplier.address.city,
                postcode: postcode || supplier.address.postcode
            };
            supplier.deliveryDays = deliveryDays ? JSON.parse(deliveryDays) : supplier.deliveryDays;
            supplier.status = status || supplier.status;
            supplier.icon = imageUrl || supplier.icon;

            await supplier.save();

            res.status(200).json({ status: true, supplier });
        } catch (error) {
            console.error('Error updating supplier:', error);
            res.status(500).json({ status: false, error: 'Failed to update supplier' });
        }
    });
};

exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().populate('holidays');
        res.json({ status: true, suppliers: suppliers });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get suppliers' });
    }
};

exports.getSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.find({ _id: req.params.id }).populate('holidays');
        res.json({ status: true, supplier });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get suppliers' });
    }
};

exports.setHoliday = async (req, res) => {
    const { supplierId, newHolidays } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            throw new Error('Invalid Supplier ID');
        }

        if (!Array.isArray(newHolidays) || !newHolidays.every((date) => !isNaN(new Date(date)))) {
            throw new Error('Invalid holidays format. Must be an array of valid dates.');
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            throw new Error('Supplier not found');
        }

        let holidayDoc;

        if (supplier.holidays) {
            holidayDoc = await Holiday.findByIdAndUpdate(
                supplier.holidays,
                { holidays: newHolidays },
                { new: true }
            );
        } else {
            holidayDoc = new Holiday({ holidays: newHolidays });
            await holidayDoc.save();

            supplier.holidays = holidayDoc._id;
            await supplier.save();
        }

        console.log('Holidays updated successfully:', holidayDoc);
        res.json({ status: true, holiday: holidayDoc });
    } catch (error) {
        console.error('Error updating supplier holidays:', error);
        res.status(500).json({ status: false, error: 'Failed to create holiday' });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ status: false, error: 'Supplier not found' });
        }

        const orders = await Order.find({ 'products.product.supplier': req.params.id });

        if (orders.length > 0) {
            return res.status(400).json({ status: false, error: 'Cannot delete supplier because there are active orders linked to it' });
        }

        await Supplier.findByIdAndDelete(req.params.id);

        res.json({ status: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ status: false, error: 'Failed to delete supplier' });
    }
};


exports.getDeliveryDays = async (req, res) => {
    try {
        const deliveryDays = await Delivery.find().populate('branch supplier');
        res.json({ status: true, deliveryDays });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get suppliers' });
    }
};

exports.getDeliveryDay = async (req, res) => {
    try {
        const deliveryDays = await Delivery.find({ _id: req.params.id }).populate('branch supplier');
        res.json({ status: true, deliveryDays });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get suppliers' });
    }
};

exports.getDeliveryDaysWithShop = async (req, res) => {
    try {
        const deliveryDays = await Delivery.findOne({ supplier: req.params.supplierId, branch: req.user._id }).populate('branch supplier');
        res.json({ status: true, deliveryDays });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get suppliers' });
    }
};


exports.addDeliveryDays = async (req, res) => {
    const { branch, supplier, days } = req.body;
    try {
        const delivery = new Delivery({ branch, supplier, days });
        await delivery.save();

        res.status(201).json({ status: true, delivery });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to add delivery' });
    }
};

exports.editDeliveryDays = async (req, res) => {
    const { branch, supplier, days } = req.body;
    const id = req.params.id;
    try {
        const delivery = await Delivery.findByIdAndUpdate(id, { branch, supplier, days });
        res.status(201).json({ status: true, message: "Delivery days updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: 'Failed to update delivery days' });
    }
};

exports.deleteDeliveryDays = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({ status: false, error: 'Delivery Days not found' });
        }

        await Delivery.findByIdAndDelete(req.params.id);

        res.json({ status: true, message: 'Delivery Days deleted successfully' });
    } catch (error) {
        console.error('Error deleting delivery days:', error);
        res.status(500).json({ status: false, error: 'Failed to delete delivery days' });
    }
};