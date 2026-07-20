const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    avatar: { type: String, default: '' },
    role: { type: String, default: 'user' },
    points: { type: Number, default: 0 },
    rewardHistory: [{
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        points: { type: Number },
        note: { type: String },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
