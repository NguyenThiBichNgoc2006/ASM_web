const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    category: { type: String, required: true },
    badge: { type: String, default: '' },
    title: { type: String, required: true },
    date: { type: String, required: true },
    image: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, default: 'Nội dung chi tiết bài viết đang được cập nhật...' }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
