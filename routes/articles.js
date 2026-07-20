const express = require('express');
const router = express.Router();
const Article = require('../models/Article');


router.get('/', async (req, res) => {
    try {
        const articles = await Article.find({}).sort({ createdAt: -1 });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});


router.post('/', async (req, res) => {
    try {
        const article = new Article(req.body);
        await article.save();
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!article) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa bài viết' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

module.exports = router;
