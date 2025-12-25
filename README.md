# AI Art Gallery - AI绘画艺术图书馆 🎨

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一个功能强大的本地AI绘画作品管理系统，支持图片展示、提示词管理、AI智能标注、私密画廊等功能。

[功能特点](#-功能特点) • [快速开始](#-快速开始) • [使用说明](#-使用说明) • [配置说明](#️-配置说明)

</div>

---

## ✨ 功能特点

### 🖼️ 画廊管理
- **优雅的画廊展示** - 响应式瀑布流布局，支持网格/列表视图切换
- **智能分类系统** - 自定义中文分类，灵活管理作品
- **强大的搜索功能** - 支持按标题、提示词、标签搜索
- **详细的元数据** - 自动提取EXIF信息（模型、采样器、参数等）

### 🤖 AI智能功能
- **AI自动打标签** - 使用Ollama/OpenAI自动分析图片生成标签
- **AI反推提示词** - 智能分析图片反推生成提示词
- **手动触发更新** - 上传后可随时手动执行AI分析
- **多模型支持** - 支持Ollama本地模型和OpenAI GPT-4 Vision

### 🔐 安全与隐私
- **私密画廊** - 密码保护的私密作品空间
- **管理员模式** - 双模式设计，普通用户只读，管理员可编辑
- **独立元数据存储** - 每张图片单独JSON文件，数据安全可靠

### 📤 导入导出
- **拖拽上传** - 支持批量拖拽上传图片
- **批量导出** - 一键导出所有提示词为Markdown格式
- **数据持久化** - 本地JSON数据库，完全掌控数据

---

## 🚀 快速开始

### 方式一：一键启动（推荐Windows用户）

1. **双击运行安装脚本**
   ```
   双击 setup.bat
   ```
   脚本会自动检测并安装缺失的组件

2. **双击启动应用**
   ```
   双击 start.bat
   ```
   应用会自动在浏览器中打开

### 方式二：手动安装

#### 环境要求
- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **Ollama**（可选，用于本地AI功能）

#### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/RichmanDP/ai-art-gallery.git
   cd ai-art-gallery
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动应用**
   ```bash
   npm run dev
   ```

4. **访问应用**
   - 前端：http://localhost:3000
   - 后端：http://localhost:5555

---

## 📖 使用说明

### 基础使用流程

#### 1. 切换到管理员模式
点击右上角 **"普通模式"** 按钮切换为 **"管理模式"**

#### 2. 配置AI服务（可选）
- 点击 **"设置"** 按钮
- 选择AI服务提供商：
  - **Ollama**（本地免费）
  - **OpenAI**（需要API Key）
- 点击 **"测试AI连接"** 验证配置

#### 3. 上传图片
- 点击 **"上传作品"**
- 可勾选：
  - ☑️ AI自动打标签
  - ☑️ AI反推提示词
- 填写信息并上传

#### 4. 管理作品
在图片详情页可以：
- 🌟 **AI反推提示词** - 重新生成提示词
- 🏷️ **AI打标签** - 重新生成标签
- ✏️ **编辑信息**
- 📋 **复制提示词**
- 🗑️ **删除作品**

#### 5. 私密画廊
- 点击 **"进入私密"** 按钮
- 输入密码（默认：`admin123`）
- 查看私密作品

---

## ⚙️ 配置说明

### AI服务配置

#### Ollama（本地免费）
1. 安装Ollama：https://ollama.ai/
2. 下载视觉模型：
   ```bash
   ollama pull llava
   ```
3. 在设置中配置：
   - URL: `http://localhost:11434`
   - 模型: `llava`

#### OpenAI（云端付费）
在设置中输入API Key即可使用

---

## 🛠️ 技术栈

- **前端**：React 18 + TypeScript + Vite
- **UI**：Tailwind CSS + Framer Motion
- **后端**：Node.js + Express
- **AI**：Ollama + OpenAI API

---

## 📝 更新日志

### v1.0.0 (2025-12-25)
- ✨ 初始版本发布
- 🎨 优雅的画廊界面
- 🤖 AI智能标注功能
- 🔐 私密画廊
- 📤 批量导出

---

## 👨‍💻 作者

**清鹤堂主 (RichmanDP)**

- GitHub: [@RichmanDP](https://github.com/RichmanDP)
- 项目地址: [https://github.com/RichmanDP/ai-art-gallery](https://github.com/RichmanDP/ai-art-gallery)

---

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by 清鹤堂主

</div>
