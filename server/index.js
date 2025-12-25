import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import exifr from 'exifr';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5555;

// 确保必要的目录存在
const uploadsDir = path.join(__dirname, '../uploads');
const metadataDir = path.join(uploadsDir, 'metadata'); // 元数据存储目录
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'gallery.json');
const configPath = path.join(dataDir, 'config.json');

[uploadsDir, metadataDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 初始化配置文件
if (!fs.existsSync(configPath)) {
  const defaultConfig = {
    aiTagging: {
      enabled: false,
      provider: 'ollama', // 'ollama' | 'openai' | 'custom'
      ollamaUrl: 'http://localhost:11434',
      apiKey: '',
      model: 'llava',
      prompt: '请分析这张AI生成的图片，提取3-5个关键标签。标签应该简洁准确，用中文逗号分隔。只返回标签，不要其他说明。'
    },
    privateGallery: {
      enabled: false,
      passwordHash: '' // 使用SHA256加密
    }
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

// 初始化数据库文件
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ 
    images: [], 
    categories: [
      '人物', '风景', '动物', '抽象', '写实', '动漫', '奇幻', '科幻'
    ], 
    nextId: 1 
  }, null, 2));
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

// 读取配置
const readConfig = () => {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
};

// 写入配置
const writeConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

// 密码哈希
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 提取图片元数据
const extractMetadata = async (filePath) => {
  try {
    const exifData = await exifr.parse(filePath, {
      userComment: true,
      pick: ['UserComment', 'ImageDescription', 'Software', 'Model', 'Make', 'parameters']
    });

    if (!exifData) return null;

    let prompt = '';
    let negativePrompt = '';
    let parameters = {};
    let model = '';

    const comment = exifData.UserComment || exifData.ImageDescription || exifData.parameters || '';
    
    if (comment) {
      const lines = comment.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('Negative prompt:')) {
          negativePrompt = line.replace('Negative prompt:', '').trim();
        } else if (line.includes('Steps:') || line.includes('Sampler:')) {
          const params = line.split(',').map(p => p.trim());
          params.forEach(param => {
            const [key, value] = param.split(':').map(s => s.trim());
            if (key && value) {
              parameters[key] = value;
            }
          });
          
          if (parameters.Model) {
            model = parameters.Model;
          }
        } else if (!prompt && line && !line.startsWith('Negative') && !line.includes('Steps:')) {
          prompt = line;
        }
      }
    }

    model = model || exifData.Software || exifData.Model || exifData.Make || '';

    return {
      prompt,
      negativePrompt,
      parameters,
      model
    };
  } catch (error) {
    console.error('提取元数据失败:', error);
    return null;
  }
};

// AI自动打标签
const generateAutoTags = async (imagePath, imageData) => {
  const config = readConfig();
  
  console.log('🏷️  开始AI打标签...');
  console.log('配置:', { 
    enabled: config.aiTagging.enabled, 
    provider: config.aiTagging.provider,
    model: config.aiTagging.model 
  });
  
  if (!config.aiTagging.enabled) {
    console.log('⚠️  AI打标签未启用');
    return [];
  }

  try {
    if (config.aiTagging.provider === 'ollama') {
      // 调用 Ollama API
      console.log('📸 读取图片文件:', imagePath);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      console.log('🌐 调用 Ollama API:', config.aiTagging.ollamaUrl);
      const response = await fetch(`${config.aiTagging.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.aiTagging.model,
          prompt: config.aiTagging.prompt,
          images: [base64Image],
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ollama API 错误:', response.status, errorText);
        throw new Error(`Ollama API 错误: ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 Ollama 响应:', result.response);
      const tagsText = result.response || '';
      const tags = tagsText.split(/[,，、]/).map(t => t.trim()).filter(t => t);
      
      console.log('✅ 生成标签:', tags);
      return tags.slice(0, 5); // 最多5个标签
      
    } else if (config.aiTagging.provider === 'openai') {
      // 调用 OpenAI API (GPT-4 Vision)
      console.log('📸 读取图片文件:', imagePath);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      console.log('🌐 调用 OpenAI API');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.aiTagging.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: config.aiTagging.prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` }}
            ]
          }],
          max_tokens: 100
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API 错误:', response.status, errorText);
        throw new Error(`OpenAI API 错误: ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 OpenAI 响应:', result.choices[0]?.message?.content);
      const tagsText = result.choices[0]?.message?.content || '';
      const tags = tagsText.split(/[,，、]/).map(t => t.trim()).filter(t => t);
      
      console.log('✅ 生成标签:', tags);
      return tags.slice(0, 5);
    }
  } catch (error) {
    console.error('❌ AI打标签失败:', error.message);
    throw error; // 抛出错误而不是返回空数组
  }
  
  console.log('⚠️  未配置有效的AI服务提供商');
  return [];
};

// 保存图片元数据到独立JSON文件
const saveImageMetadata = (imageId, metadata) => {
  const metadataPath = path.join(metadataDir, `${imageId}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
};

// 读取图片元数据
const loadImageMetadata = (imageId) => {
  const metadataPath = path.join(metadataDir, `${imageId}.json`);
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }
  return null;
};

// 删除图片元数据
const deleteImageMetadata = (imageId) => {
  const metadataPath = path.join(metadataDir, `${imageId}.json`);
  if (fs.existsSync(metadataPath)) {
    fs.unlinkSync(metadataPath);
  }
};

// AI反推提示词
const reversePrompt = async (imagePath, customPrompt) => {
  const config = readConfig();
  
  console.log('🔄 开始AI反推提示词...');
  console.log('配置:', { 
    enabled: config.aiTagging.enabled, 
    provider: config.aiTagging.provider,
    model: config.aiTagging.model 
  });
  
  if (!config.aiTagging.enabled) {
    console.log('⚠️  AI反推未启用');
    return '';
  }

  const defaultPrompt = customPrompt || '请详细分析这张AI生成的图片，反推出可能的生成提示词。提示词应该详细描述图片的主题、风格、构图、色彩、光影等要素。直接输出提示词，不要其他解释。';

  try {
    if (config.aiTagging.provider === 'ollama') {
      console.log('📸 读取图片文件:', imagePath);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      console.log('🌐 调用 Ollama API:', config.aiTagging.ollamaUrl);
      const response = await fetch(`${config.aiTagging.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.aiTagging.model,
          prompt: defaultPrompt,
          images: [base64Image],
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ollama API 错误:', response.status, errorText);
        throw new Error(`Ollama API 错误: ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 Ollama 响应:', result.response?.substring(0, 100) + '...');
      return result.response || '';
      
    } else if (config.aiTagging.provider === 'openai') {
      console.log('📸 读取图片文件:', imagePath);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      console.log('🌐 调用 OpenAI API');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.aiTagging.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: defaultPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` }}
            ]
          }],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API 错误:', response.status, errorText);
        throw new Error(`OpenAI API 错误: ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 OpenAI 响应:', result.choices[0]?.message?.content?.substring(0, 100) + '...');
      return result.choices[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('❌ AI反推提示词失败:', error.message);
    throw error; // 抛出错误而不是返回空字符串
  }
  
  console.log('⚠️  未配置有效的AI服务提供商');
  return '';
};

// ==================== API 路由 ====================

// 获取所有图片
app.get('/api/images', (req, res) => {
  try {
    const db = readDB();
    const { category, search, isPrivate } = req.query;
    
    let images = db.images;
    
    // 筛选分类
    if (category && category !== 'all') {
      images = images.filter(img => img.category === category);
    }
    
    // 搜索
    if (search) {
      const searchLower = search.toLowerCase();
      images = images.filter(img => 
        img.prompt?.toLowerCase().includes(searchLower) ||
        img.model?.toLowerCase().includes(searchLower) ||
        img.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // 私密画廊过滤
    if (isPrivate === 'false') {
      images = images.filter(img => !img.isPrivate);
    }
    
    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取图片失败' });
  }
});

// 获取单个图片
app.get('/api/images/:id', (req, res) => {
  try {
    const db = readDB();
    const image = db.images.find(img => img.id === parseInt(req.params.id));
    
    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: '获取图片失败' });
  }
});

// 上传图片
app.post('/api/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片' });
    }

    const filePath = req.file.path;
    const metadata = await extractMetadata(filePath);
    
    const db = readDB();
    const id = db.nextId++;
    
    const imageData = {
      id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      uploadDate: new Date().toISOString(),
      prompt: metadata?.prompt || req.body.prompt || '',
      negativePrompt: metadata?.negativePrompt || req.body.negativePrompt || '',
      parameters: metadata?.parameters || {},
      model: metadata?.model || req.body.model || '',
      category: req.body.category || '未分类',
      tags: [],
      isPrivate: req.body.isPrivate === 'true'
    };

    // AI自动打标签（如果启用）
    if (req.body.enableAutoTag === 'true') {
      const autoTags = await generateAutoTags(filePath, imageData);
      imageData.tags = autoTags;
    }

    // AI反推提示词（如果启用且没有提示词）
    if (req.body.enableReversePrompt === 'true' && !imageData.prompt) {
      const reversedPrompt = await reversePrompt(filePath, req.body.reversePromptText);
      imageData.prompt = reversedPrompt;
    }

    // 保存到数据库
    db.images.unshift(imageData);
    writeDB(db);

    // 保存元数据到独立文件
    saveImageMetadata(id, imageData);

    res.json({ success: true, image: imageData });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ success: false, error: '上传图片失败' });
  }
});

// 更新图片
app.put('/api/images/:id', async (req, res) => {
  try {
    const db = readDB();
    const index = db.images.findIndex(img => img.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const { prompt, negativePrompt, parameters, model, category, tags, isPrivate } = req.body;
    
    db.images[index] = {
      ...db.images[index],
      prompt: prompt !== undefined ? prompt : db.images[index].prompt,
      negativePrompt: negativePrompt !== undefined ? negativePrompt : db.images[index].negativePrompt,
      parameters: parameters !== undefined ? parameters : db.images[index].parameters,
      model: model !== undefined ? model : db.images[index].model,
      category: category !== undefined ? category : db.images[index].category,
      tags: tags !== undefined ? tags : db.images[index].tags,
      isPrivate: isPrivate !== undefined ? isPrivate : db.images[index].isPrivate,
      updatedDate: new Date().toISOString()
    };

    writeDB(db);
    
    // 更新元数据文件
    saveImageMetadata(db.images[index].id, db.images[index]);
    
    res.json(db.images[index]);
  } catch (error) {
    res.status(500).json({ error: '更新图片失败' });
  }
});

// 删除图片
app.delete('/api/images/:id', (req, res) => {
  try {
    const db = readDB();
    const index = db.images.findIndex(img => img.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const image = db.images[index];
    const filePath = path.join(__dirname, '..', image.path);
    
    // 删除图片文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除元数据文件
    deleteImageMetadata(image.id);

    db.images.splice(index, 1);
    writeDB(db);

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除图片失败' });
  }
});

// ==================== 分类管理 ====================

// 获取所有分类
// 获取所有分类
app.get('/api/categories', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, categories: db.categories });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取分类失败' });
  }
});

// 添加分类
app.post('/api/categories', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '分类名称不能为空' });
    }

    const db = readDB();
    
    if (db.categories.includes(name)) {
      return res.status(400).json({ error: '分类已存在' });
    }

    db.categories.push(name);
    writeDB(db);

    res.json({ message: '添加成功', categories: db.categories });
  } catch (error) {
    res.status(500).json({ error: '添加分类失败' });
  }
});

// 删除分类
app.delete('/api/categories/:name', (req, res) => {
  try {
    const { name } = req.params;
    const db = readDB();
    
    const index = db.categories.indexOf(name);
    if (index === -1) {
      return res.status(404).json({ error: '分类不存在' });
    }

    db.categories.splice(index, 1);
    
    // 将使用该分类的图片改为"未分类"
    db.images.forEach(img => {
      if (img.category === name) {
        img.category = '未分类';
      }
    });
    
    writeDB(db);
    res.json({ message: '删除成功', categories: db.categories });
  } catch (error) {
    res.status(500).json({ error: '删除分类失败' });
  }
});

// ==================== 配置管理 ====================

// 获取配置
app.get('/api/config', (req, res) => {
  try {
    const config = readConfig();
    // 不返回密码哈希
    const safeConfig = {
      ...config,
      privateGallery: {
        enabled: config.privateGallery.enabled
      },
      aiTagging: {
        ...config.aiTagging,
        apiKey: config.aiTagging.apiKey ? '***' : '' // 隐藏API密钥
      }
    };
    res.json(safeConfig);
  } catch (error) {
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新配置
app.put('/api/config', (req, res) => {
  try {
    const config = readConfig();
    const updates = req.body;

    // 更新AI打标签配置
    if (updates.aiTagging) {
      config.aiTagging = {
        ...config.aiTagging,
        ...updates.aiTagging
      };
    }

    // 更新私密画廊配置
    if (updates.privateGallery) {
      if (updates.privateGallery.password) {
        config.privateGallery.passwordHash = hashPassword(updates.privateGallery.password);
      }
      if (updates.privateGallery.enabled !== undefined) {
        config.privateGallery.enabled = updates.privateGallery.enabled;
      }
    }

    writeConfig(config);
    
    const safeConfig = {
      ...config,
      privateGallery: {
        enabled: config.privateGallery.enabled
      },
      aiTagging: {
        ...config.aiTagging,
        apiKey: config.aiTagging.apiKey ? '***' : ''
      }
    };
    
    res.json(safeConfig);
  } catch (error) {
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 验证私密画廊密码
app.post('/api/verify-password', (req, res) => {
  try {
    const { password } = req.body;
    const config = readConfig();
    
    if (!config.privateGallery.enabled) {
      return res.json({ valid: true });
    }

    const hash = hashPassword(password);
    const valid = hash === config.privateGallery.passwordHash;
    
    res.json({ valid });
  } catch (error) {
    res.status(500).json({ error: '验证失败' });
  }
});

// AI重新打标签
app.post('/api/images/:id/retag', async (req, res) => {
  try {
    const db = readDB();
    const image = db.images.find(img => img.id === parseInt(req.params.id));
    
    if (!image) {
      return res.status(404).json({ success: false, error: '图片不存在' });
    }

    const filePath = path.join(__dirname, '..', image.path);
    const autoTags = await generateAutoTags(filePath, image);
    
    image.tags = autoTags;
    writeDB(db);
    
    // 同时保存到独立的metadata文件
    saveImageMetadata(image.id, image);

    res.json({ success: true, tags: autoTags });
  } catch (error) {
    console.error('AI打标签失败:', error);
    res.status(500).json({ success: false, error: 'AI打标签失败: ' + error.message });
  }
});

// 批量导出提示词为MD格式
app.get('/api/export/prompts', (req, res) => {
  try {
    const db = readDB();
    const { category, includePrivate } = req.query;
    
    let images = db.images;
    
    // 筛选分类
    if (category && category !== 'all') {
      images = images.filter(img => img.category === category);
    }
    
    // 是否包含私密图片
    if (includePrivate !== 'true') {
      images = images.filter(img => !img.isPrivate);
    }
    
    // 生成Markdown内容
    let markdown = `# AI绘画提示词库\n\n`;
    markdown += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    markdown += `> 总计: ${images.length} 张图片\n\n`;
    markdown += `---\n\n`;
    
    images.forEach((img, index) => {
      markdown += `## ${index + 1}. ${img.originalName || img.filename}\n\n`;
      
      if (img.category) {
        markdown += `**分类**: ${img.category}\n\n`;
      }
      
      if (img.model) {
        markdown += `**模型**: ${img.model}\n\n`;
      }
      
      if (img.tags && img.tags.length > 0) {
        markdown += `**标签**: ${img.tags.join(', ')}\n\n`;
      }
      
      if (img.prompt) {
        markdown += `### 正向提示词\n\n\`\`\`\n${img.prompt}\n\`\`\`\n\n`;
      }
      
      if (img.negativePrompt) {
        markdown += `### 负向提示词\n\n\`\`\`\n${img.negativePrompt}\n\`\`\`\n\n`;
      }
      
      if (img.parameters && Object.keys(img.parameters).length > 0) {
        markdown += `### 生成参数\n\n`;
        Object.entries(img.parameters).forEach(([key, value]) => {
          markdown += `- **${key}**: ${value}\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `**上传时间**: ${new Date(img.uploadDate).toLocaleString('zh-CN')}\n\n`;
      markdown += `---\n\n`;
    });
    
    // 设置响应头为下载文件
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="prompts_${Date.now()}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('导出失败:', error);
    res.status(500).json({ error: '导出提示词失败' });
  }
});

// 测试AI连接
app.post('/api/test-ai-connection', async (req, res) => {
  try {
    const config = readConfig();
    
    if (!config.aiTagging.enabled) {
      return res.json({ success: false, message: 'AI功能未启用' });
    }
    
    if (config.aiTagging.provider === 'ollama') {
      // 测试Ollama连接
      const response = await fetch(`${config.aiTagging.ollamaUrl}/api/tags`);
      
      if (!response.ok) {
        return res.json({ 
          success: false, 
          message: `无法连接到Ollama服务 (${config.aiTagging.ollamaUrl})` 
        });
      }
      
      const data = await response.json();
      const models = data.models || [];
      const hasModel = models.some(m => m.name.includes(config.aiTagging.model));
      
      if (!hasModel) {
        return res.json({ 
          success: false, 
          message: `模型 "${config.aiTagging.model}" 未找到。可用模型: ${models.map(m => m.name).join(', ')}` 
        });
      }
      
      return res.json({ 
        success: true, 
        message: `✅ 连接成功！找到模型: ${config.aiTagging.model}`,
        models: models.map(m => m.name)
      });
      
    } else if (config.aiTagging.provider === 'openai') {
      // 测试OpenAI连接
      if (!config.aiTagging.apiKey) {
        return res.json({ success: false, message: 'OpenAI API Key未配置' });
      }
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.aiTagging.apiKey}`
        }
      });
      
      if (!response.ok) {
        return res.json({ 
          success: false, 
          message: 'OpenAI API Key无效或网络连接失败' 
        });
      }
      
      return res.json({ 
        success: true, 
        message: '✅ OpenAI连接成功！' 
      });
    }
    
    res.json({ success: false, message: '未知的AI提供商' });
  } catch (error) {
    console.error('测试AI连接失败:', error);
    res.json({ 
      success: false, 
      message: `连接测试失败: ${error.message}` 
    });
  }
});

// AI反推提示词 API
app.post('/api/images/:id/reverse-prompt', async (req, res) => {
  try {
    const db = readDB();
    const image = db.images.find(img => img.id === parseInt(req.params.id));
    
    if (!image) {
      return res.status(404).json({ success: false, error: '图片不存在' });
    }

    const filePath = path.join(__dirname, '..', image.path);
    const { customPrompt } = req.body;
    const reversedPrompt = await reversePrompt(filePath, customPrompt);
    
    // 更新图片的prompt字段
    image.prompt = reversedPrompt;
    writeDB(db);
    
    // 同时保存到独立的metadata文件
    saveImageMetadata(image.id, image);
    
    res.json({ success: true, prompt: reversedPrompt });
  } catch (error) {
    console.error('AI反推提示词失败:', error);
    res.status(500).json({ success: false, error: 'AI反推提示词失败: ' + error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 上传目录: ${uploadsDir}`);
  console.log(`💾 数据库: ${dbPath}`);
});
