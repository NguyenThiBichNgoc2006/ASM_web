const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const jwt = require('jsonwebtoken');

// Middleware bắt buộc auth
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Không có token xác thực' });
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        next();
    } catch {
        res.status(403).json({ message: 'Token không hợp lệ' });
    }
};

// Middleware admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Từ chối truy cập. Chỉ dành cho admin.' });
    }
    next();
};

// 1. Get all contacts (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Submit a new contact (Public)
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();
        res.status(201).json({ message: 'Contact submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update contact status / reply (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, reply } = req.body;
        const updatedContact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status, reply },
            { new: true }
        );
        res.json(updatedContact);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete a contact (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Contact deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
