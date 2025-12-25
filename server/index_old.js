import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import exifr from 'exifr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

// 确保必要的目录存在
const uploadsDir = path.join(__dirname, '../uploads');
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'gallery.json');

[uploadsDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 初始化数据库文件
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ images: [], categories: [
    'Portrait', 'Landscape', 'Animal', 'Abstract', 'Realistic', 'Anime', 'Fantasy', 'Sci-Fi'
  ], nextId: 1 }, null, 2));
}

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持图片格式 (JPEG, PNG, WebP)'));
  }
});

// 读取数据库
const readDB = () => {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
};

// 写入数据库
const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// 提取图片元数据
const extractMetadata = async (filePath) => {
  try {
    const exifData = await exifr.parse(filePath, {
      userComment: true,
      // Stable Diffusion 参数通常在 UserComment 或 ImageDescription 中
      pick: ['UserComment', 'ImageDescription', 'Software', 'Model', 'Make']
    });

    if (!exifData) return null;

    // 解析 Stable Diffusion 参数
    let prompt = '';
    let negativePrompt = '';
    let parameters = {};
    let model = '';

    // 从 UserComment 或 ImageDescription 中提取
    const comment = exifData.UserComment || exifData.ImageDescription || '';
    
    if (comment) {
      // Stable Diffusion WebUI 格式
      const lines = comment.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('Negative prompt:')) {
          negativePrompt = line.replace('Negative prompt:', '').trim();
        } else if (line.includes('Steps:') || line.includes('Sampler:')) {
          // 参数行
          const params = line.split(',').map(p => p.trim());
          params.forEach(param => {
            const [key, value] = param.split(':').map(s => s.trim());
            if (key && value) {
              parameters[key] = value;
            }
          });
        } else if (i === 0 && !line.startsWith('Negative prompt:')) {
          // 第一行通常是正向提示词
          prompt = line;
        }
      }

      // 提取模型信息
      if (parameters.Model) {
        model = parameters.Model;
      } else if (exifData.Software) {
        model = exifData.Software;
      }
    }

    return {
      prompt,
      negativePrompt,
      parameters,
      model,
      software: exifData.Software || '',
      rawExif: comment
    };
  } catch (error) {
    console.error('提取元数据失败:', error);
    return null;
  }
};

// API 路由

// 获取所有图片
app.get('/api/images', (req, res) => {
  try {
    const db = readDB();
    const { category, search } = req.query;
    
    let images = db.images;

    // 分类筛选
    if (category && category !== 'all') {
      images = images.filter(img => img.category === category);
    }

    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      images = images.filter(img => 
        img.prompt?.toLowerCase().includes(searchLower) ||
        img.model?.toLowerCase().includes(searchLower) ||
        img.category?.toLowerCase().includes(searchLower)
      );
    }

    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单张图片详情
app.get('/api/images/:id', (req, res) => {
  try {
    const db = readDB();
    const image = db.images.find(img => img.id === parseInt(req.params.id));
    
    if (!image) {
      return res.status(404).json({ success: false, error: '图片不存在' });
    }

    res.json({ success: true, image });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 上传图片
app.post('/api/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    const filePath = req.file.path;
    const metadata = await extractMetadata(filePath);

    const db = readDB();
    const newImage = {
      id: db.nextId++,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      uploadDate: new Date().toISOString(),
      prompt: metadata?.prompt || req.body.prompt || '',
      negativePrompt: metadata?.negativePrompt || req.body.negativePrompt || '',
      model: metadata?.model || req.body.model || '',
      parameters: metadata?.parameters || {},
      category: req.body.category || 'Abstract',
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
      software: metadata?.software || ''
    };

    db.images.unshift(newImage);
    writeDB(db);

    res.json({ success: true, image: newImage, metadata });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新图片信息
app.put('/api/images/:id', (req, res) => {
  try {
    const db = readDB();
    const imageIndex = db.images.findIndex(img => img.id === parseInt(req.params.id));
    
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, error: '图片不存在' });
    }

    db.images[imageIndex] = {
      ...db.images[imageIndex],
      ...req.body,
      id: db.images[imageIndex].id,
      filename: db.images[imageIndex].filename,
      path: db.images[imageIndex].path,
    };

    writeDB(db);
    res.json({ success: true, image: db.images[imageIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除图片
app.delete('/api/images/:id', (req, res) => {
  try {
    const db = readDB();
    const imageIndex = db.images.findIndex(img => img.id === parseInt(req.params.id));
    
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, error: '图片不存在' });
    }

    const image = db.images[imageIndex];
    const filePath = path.join(__dirname, '..', image.path);

    // 删除文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.images.splice(imageIndex, 1);
    writeDB(db);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取分类列表
app.get('/api/categories', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, categories: db.categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加分类
app.post('/api/categories', (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ success: false, error: '分类名称不能为空' });
    }

    const db = readDB();
    if (!db.categories.includes(category)) {
      db.categories.push(category);
      writeDB(db);
    }

    res.json({ success: true, categories: db.categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取统计信息
app.get('/api/stats', (req, res) => {
  try {
    const db = readDB();
    const stats = {
      totalImages: db.images.length,
      categories: db.categories.length,
      byCategory: {},
      byModel: {}
    };

    // 按分类统计
    db.images.forEach(img => {
      stats.byCategory[img.category] = (stats.byCategory[img.category] || 0) + 1;
      if (img.model) {
        stats.byModel[img.model] = (stats.byModel[img.model] || 0) + 1;
      }
    });

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎨 AI Art Gallery 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 图片存储目录: ${uploadsDir}`);
  console.log(`📊 数据库路径: ${dbPath}`);
});
