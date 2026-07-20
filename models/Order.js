const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerInfo: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        note: { type: String }
    },
    items: [{
        productId: { type: Number, required: true }, // Using the custom ID from Product
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String }
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'processing', 'completed', 'cancelled'] },
    paymentMethod: { type: String, default: 'cod' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
