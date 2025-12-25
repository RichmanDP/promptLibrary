# 🎉 AI Art Gallery - 功能更新说明

## 📦 本次更新内容 (2025-12-25)

### 1. ✅ 优化数据存储结构

#### 改进点：
- **独立元数据存储**：每张图片的元数据现在单独保存在 `uploads/metadata/{id}.json` 文件中
- **数据持久化**：即使系统更新，上传的图片和对应的JSON元数据不会丢失
- **自动同步**：图片上传、更新、删除时自动同步元数据文件

#### 存储结构：
```
uploads/
├── image1.jpg              # 图片文件
├── image2.png
└── metadata/               # 元数据目录
    ├── 1.json             # 图片1的元数据
    └── 2.json             # 图片2的元数据
```

### 2. ✅ 批量导出提示词为MD格式

#### 功能特性：
- **一键导出**：在设置页面点击"导出提示词 (MD)"按钮
- **支持筛选**：可按分类导出，支持包含/排除私密图片
- **完整信息**：导出内容包括：
  - 图片基本信息
  - 分类、模型、标签
  - 正向/负向提示词
  - 生成参数
  - 上传时间

#### 导出格式示例：
```markdown
# AI绘画提示词库

> 导出时间: 2025-12-25
> 总计: 10 张图片

---

## 1. beautiful_portrait.png

**分类**: 人物
**模型**: Stable Diffusion XL
**标签**: 人物, 写实, 女性

### 正向提示词
```
masterpiece, best quality, beautiful woman, detailed face...
```

### 负向提示词
```
bad anatomy, low quality...
```

### 生成参数
- **Steps**: 30
- **CFG Scale**: 7.5
- **Sampler**: DPM++ 2M Karras
```

#### API接口：
```
GET /api/export/prompts?category=人物&includePrivate=false
```

### 3. ✅ 优化设置页面

#### 新增功能：
1. **AI连接测试**
   - 点击"测试 AI 连接"按钮
   - 自动检测 Ollama 服务状态
   - 验证模型是否已下载
   - 测试 OpenAI API Key 有效性
   - 实时显示测试结果

2. **保存并返回**
   - 保存设置后自动返回画廊页面
   - 避免手动点击返回

3. **一键导出**
   - 设置页面增加"导出提示词 (MD)"按钮
   - 方便快速导出所有提示词

#### API接口：
```
POST /api/test-ai-connection
Response: {
  "success": true,
  "message": "✅ 连接成功！找到模型: llava",
  "models": ["llava", "llava:13b", "bakllava"]
}
```

### 4. ✅ 增强上传功能

#### AI辅助功能：
上传图片时可以勾选以下选项：

1. **🏷️ AI自动打标签**
   - 上传后自动使用AI分析图片
   - 生成3-5个关键标签
   - 使用配置中的AI提示词

2. **🔮 AI反推提示词**
   - 当提示词为空时启用
   - AI分析图片内容并生成详细提示词
   - 支持自定义反推提示词：
     ```
     例如：请详细分析这张AI生成的图片，反推出可能的生成提示词。
     提示词应该详细描述图片的主题、风格、构图、色彩、光影等要素。
     ```

#### 工作流程：
```
上传图片 
  ↓
[勾选] AI自动打标签
  ↓
[勾选] AI反推提示词 (可自定义提示)
  ↓
自动提取EXIF元数据
  ↓
AI分析生成标签和提示词
  ↓
保存到数据库和元数据文件
```

#### API参数：
```javascript
FormData {
  image: File,
  prompt: string,
  category: string,
  isPrivate: boolean,
  enableAutoTag: boolean,          // 新增
  enableReversePrompt: boolean,    // 新增
  reversePromptText: string        // 新增
}
```

## 🔧 新增API接口

### 1. 批量导出提示词
```
GET /api/export/prompts
Query参数:
  - category: 分类筛选 (可选)
  - includePrivate: 是否包含私密图片 (true/false)
Response: Markdown文件下载
```

### 2. 测试AI连接
```
POST /api/test-ai-connection
Response: {
  "success": boolean,
  "message": string,
  "models"?: string[] // Ollama可用模型列表
}
```

### 3. AI反推提示词
```
POST /api/images/:id/reverse-prompt
Body: {
  "customPrompt": string // 自定义反推提示词 (可选)
}
Response: {
  "prompt": string
}
```

## 📝 使用指南

### 配置AI功能

1. **进入设置页面**
   - 切换到管理模式
   - 点击"设置"按钮

2. **配置Ollama（本地推荐）**
   ```bash
   # 1. 安装Ollama
   # 访问 https://ollama.ai 下载
   
   # 2. 下载视觉模型
   ollama pull llava
   # 或
   ollama pull llava:13b
   ollama pull bakllava
   ```

3. **在设置页面配置**
   - 启用 AI 自动打标签
   - 提供商：Ollama
   - 地址：`http://localhost:11434`
   - 模型：`llava`
   - 点击"测试 AI 连接"验证

4. **自定义AI提示词**
   ```
   打标签提示词：
   请分析这张AI生成的图片，提取3-5个关键标签。
   标签应该简洁准确，用中文逗号分隔。只返回标签，不要其他说明。
   
   反推提示词：
   请详细分析这张AI生成的图片，反推出可能的生成提示词。
   提示词应该详细描述图片的主题、风格、构图、色彩、光影等要素。
   ```

### 上传图片使用AI功能

1. **点击"上传作品"**
2. **选择图片**
3. **勾选AI选项**：
   - ✅ AI自动打标签
   - ✅ AI反推提示词（如果没有提示词）
   - 可输入自定义反推提示词
4. **点击上传**

### 导出提示词

1. **进入设置页面**
2. **点击"导出提示词 (MD)"**
3. **自动下载Markdown文件**
4. **可用于**：
   - AI学习训练数据
   - 提示词库整理
   - 知识库建设
   - 团队分享

## 🎯 技术亮点

### 1. 数据持久化
- 双重存储：数据库 + 独立JSON文件
- 图片和元数据分离存储
- 系统升级不丢失数据

### 2. AI集成
- 支持本地Ollama（无需API费用）
- 支持OpenAI GPT-4 Vision
- 可扩展其他AI服务

### 3. 灵活配置
- 自定义AI提示词
- 自定义反推提示词
- 可选AI功能开关

### 4. 用户体验
- 实时连接测试
- 一键导出
- 自动返回
- 智能提示

## 📊 数据流程

```
上传图片
  ↓
自动提取EXIF → 提示词、参数、模型
  ↓
[可选] AI打标签 → 生成标签
  ↓
[可选] AI反推提示词 → 生成提示词
  ↓
保存到数据库 (gallery.json)
  ↓
保存元数据文件 (uploads/metadata/{id}.json)
  ↓
完成上传
```

## 🔐 数据安全

- 元数据独立存储，防止数据丢失
- 密码使用SHA256加密
- 私密图片访问控制
- 导出时可选择是否包含私密内容

## 🚀 性能优化

- 异步AI处理
- 按需加载元数据
- 流式下载导出文件
- 智能缓存策略

## 📖 API文档

完整API文档请参考 README.md

## 💡 使用建议

1. **Ollama推荐模型**：
   - `llava` - 7B参数，速度快
   - `llava:13b` - 13B参数，效果更好
   - `bakllava` - 专门优化的版本

2. **反推提示词技巧**：
   - 使用详细的提示词描述需求
   - 指定输出格式（中文/英文）
   - 可以要求包含特定要素

3. **批量导出**：
   - 定期导出备份
   - 按分类导出便于整理
   - 导出的MD文件可直接用于AI训练

## 🎊 总结

本次更新主要解决了：
✅ 数据持久化问题
✅ AI功能增强
✅ 用户体验优化
✅ 数据导出需求

所有核心功能均已实现并测试通过！

---

**开发日期**: 2025-12-25  
**版本**: v2.0  
**开发者**: GitHub Copilot
