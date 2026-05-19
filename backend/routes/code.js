const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Only allow these specific files to be edited for security
const ALLOWED_FILES = [
  'index.html',
  'projects.html',
  'blog.html',
  'about.html',
  'post.html',
  'flappy.html',
  'admin.html',
  'css/style.css',
  'js/main.js',
  'js/api-config.js',
  'js/admin-api.js',
  'js/projects.js',
  'js/blog.js',
  'js/post.js',
  'js/flappy.js',
  'admin/index.html',
  'admin/css/admin.css',
  'admin/js/admin.js'
];

// Categorize files into Interface (Giao diện) and Functionality (Chức năng)
const FILE_CATEGORIES = {
  // Giao diện - Files that control the visual appearance
  interface: [
    'index.html',
    'projects.html',
    'blog.html',
    'about.html',
    'post.html',
    'flappy.html',
    'admin.html',
    'admin/index.html',
    'css/style.css',
    'admin/css/admin.css'
  ],
  // Chức năng - Files that control the functionality/logic
  functionality: [
    'js/main.js',
    'js/api-config.js',
    'js/admin-api.js',
    'js/projects.js',
    'js/blog.js',
    'js/post.js',
    'js/flappy.js',
    'admin/js/admin.js'
  ]
};

router.get('/', authMiddleware, (req, res) => {
  try {
    const file = req.query.file;
    if (!file || !ALLOWED_FILES.includes(file)) {
      return res.status(403).json({ error: 'File not allowed or not specified' });
    }

    const filePath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authMiddleware, (req, res) => {
  try {
    const { file, content } = req.body;
    if (!file || !ALLOWED_FILES.includes(file)) {
      return res.status(403).json({ error: 'File not allowed or not specified' });
    }
    
    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const filePath = path.join(ROOT_DIR, file);
    fs.writeFileSync(filePath, content, 'utf-8');
    
    res.json({ success: true, message: 'File saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get files list, optionally filtered by category
router.get('/list', authMiddleware, (req, res) => {
  const category = req.query.category;
  
  if (category === 'interface') {
    return res.json({ files: FILE_CATEGORIES.interface });
  } else if (category === 'functionality') {
    return res.json({ files: FILE_CATEGORIES.functionality });
  }
  
  // Return all files with categories
  res.json({ 
    files: ALLOWED_FILES,
    categories: FILE_CATEGORIES
  });
});

module.exports = router;
