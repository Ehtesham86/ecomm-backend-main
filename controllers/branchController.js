const User = require('../models/userModel');

exports.createBranch = async (req, res) => {
    const { name, email, password, streetAddress, city, role, postalCode, paymentMethod, status } = req.body;
    const address = {
        street: streetAddress, city: city, postcode: postalCode,
    }
    try {
        console.log(req.body);
        const user = new User({ firstname: name, email, password, role, address, paymentMethod, status });
        await user.save();
        res.status(201).json({ status: true, message: "Shop created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: 'Failed to create shop' });
    }
};

exports.getBranches = async (req, res) => {
    try {
        const branches = await User.find({ role: 'branch' }).select('-password');
        res.json({ status: true, branches: branches });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get shops' });
    }
};

exports.getBranch = async (req, res) => {
    try {
        const branch = await User.find({ _id: req.params.id }).select('-password');

        res.json({ status: true, branch: branch });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Failed to get shop' });
    }
};

exports.updateBranch = async (req, res) => {
    const { id, name, email, streetAddress, city, role, postalCode, paymentMethod, status } = req.body;
    const address = {
        street: streetAddress, city: city, postcode: postalCode,
    }
    try {
        console.log(req.body);
        const user = await User.findByIdAndUpdate(id, { firstname: name, email, role, address, paymentMethod, status });
        res.status(201).json({ status: true, message: "Shop updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: 'Failed to create shop' });
    }
};

exports.deleteBranch = async (req, res) => {
    try {
        const shop = await User.findById(req.params.id);

        if (!shop) {
            return res.status(404).json({ status: false, error: 'Shop not found' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ status: true, message: 'Shop deleted successfully' });
    } catch (error) {
        console.error('Error deleting shop:', error);
        res.status(500).json({ status: false, error: 'Failed to delete shop' });
    }
};
