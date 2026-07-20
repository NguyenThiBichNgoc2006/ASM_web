const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Tạo avatar ngẫu nhiên từ DiceBear API
function generateRandomAvatar(name) {
    const styles = ['adventurer', 'avataaars', 'big-smile', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'pixel-art', 'thumbs'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const seed = encodeURIComponent(name + Date.now());
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check existing
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Email đã tồn tại' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo avatar ngẫu nhiên
        const avatar = generateRandomAvatar(name);

        user = new User({
            name,
            email,
            password: hashedPassword,
            avatar,
            points: 0
        });

        await user.save();
        res.status(201).json({ message: 'Đăng ký thành công', avatar });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Tài khoản không tồn tại' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Sai mật khẩu' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                points: user.points || 0
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

module.exports = router;
