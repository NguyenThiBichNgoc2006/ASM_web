const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware xác thực token (optional - cho phép guest)
const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;
        } catch (e) { /* token không hợp lệ, tiếp tục với guest */ }
    }
    next();
};

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

// POST - Tạo đơn hàng mới (cho phép guest)
router.post('/', checkAuth, async (req, res) => {
    try {
        const { customerInfo, items, totalAmount, paymentMethod, pointsUsed } = req.body;

        if (!customerInfo || !items || !items.length) {
            return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
        }

        const newOrder = new Order({
            userId: req.user ? req.user.id : null,
            customerInfo,
            items,
            totalAmount,
            paymentMethod: paymentMethod || 'cod',
            status: 'pending'
        });

        await newOrder.save();

        let newPoints = null;
        if (newOrder.userId) {
            const POINTS_PER_ORDER = 10;
            const User = require('../models/User'); 
            const used = parseInt(pointsUsed) || 0;
            const netPointsChange = POINTS_PER_ORDER - used;
            
            let rewardHistoryEntries = [];
            if (used > 0) {
                rewardHistoryEntries.push({
                    orderId: newOrder._id,
                    points: -used,
                    note: 'Dùng điểm thanh toán đơn #' + String(newOrder._id).slice(-6).toUpperCase(),
                    createdAt: new Date(Date.now() - 1000)
                });
            }
            rewardHistoryEntries.push({
                orderId: newOrder._id,
                points: POINTS_PER_ORDER,
                note: 'Đặt hàng thành công đơn #' + String(newOrder._id).slice(-6).toUpperCase(),
                createdAt: new Date()
            });

            const updateFields = {
                $inc: { points: netPointsChange },
                $push: { rewardHistory: { $each: rewardHistoryEntries } }
            };
            
            if (customerInfo) {
                const userDoc = await User.findById(newOrder.userId);
                if (userDoc) {
                    let setFields = {};
                    if (customerInfo.name) setFields.name = customerInfo.name;
                    if (customerInfo.phone) setFields.phone = customerInfo.phone;
                    if (customerInfo.address) setFields.address = customerInfo.address;
                    if (Object.keys(setFields).length > 0) {
                        updateFields.$set = setFields;
                    }
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                newOrder.userId,
                updateFields,
                { new: true }
            );
            newPoints = updatedUser.points;
            var finalUpdatedUser = updatedUser;
        }

        res.status(201).json({
            message: 'Đặt hàng thành công',
            orderId: newOrder._id,
            order: newOrder,
            newPoints: newPoints,
            user: typeof finalUpdatedUser !== 'undefined' ? finalUpdatedUser : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// GET - Lấy tất cả đơn hàng (admin)
router.get('/', requireAuth, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// GET - Lấy đơn hàng của user đang đăng nhập
router.get('/my-orders', requireAuth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// PUT - Cập nhật trạng thái đơn hàng (admin)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        // Lấy đơn hàng trước khi cập nhật để kiểm tra trạng thái cũ
        const oldOrder = await Order.findById(req.params.id);
        if (!oldOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        // ✅ Cộng 10 điểm thưởng khi đơn hàng hoàn thành (chỉ cộng 1 lần)
        if (status === 'completed' && oldOrder.status !== 'completed' && order.userId) {
            const POINTS_PER_ORDER = 10;
            await User.findByIdAndUpdate(
                order.userId,
                {
                    $inc: { points: POINTS_PER_ORDER },
                    $push: {
                        rewardHistory: {
                            orderId: order._id,
                            points: POINTS_PER_ORDER,
                            note: `Đơn hàng #${String(order._id).slice(-6).toUpperCase()} hoàn thành`,
                            createdAt: new Date()
                        }
                    }
                }
            );
        }

        res.json({ message: 'Cập nhật thành công', order });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

module.exports = router;
