const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực token
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không có token xác thực' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch {
        res.status(403).json({ message: 'Token không hợp lệ' });
    }
}

// GET all users (admin only)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// GET thông tin cá nhân của user đang đăng nhập
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// PUT cập nhật thông tin cá nhân của user đang đăng nhập
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const { name, phone, address, avatar, currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Cập nhật các trường thông tin cơ bản
        if (name)    user.name    = name;
        if (phone !== undefined) user.phone   = phone;
        if (address !== undefined) user.address = address;
        if (avatar)  user.avatar  = avatar;

        // Đổi mật khẩu nếu được yêu cầu
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.json({
            message: 'Cập nhật thông tin thành công',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                avatar: user.avatar,
                role: user.role,
                points: user.points || 0,
                rewardHistory: user.rewardHistory || []
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// PUT update user role/status (admin)
router.put('/:id', async (req, res) => {
    try {
        const { role, status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, status },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa người dùng' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

module.exports = router;
