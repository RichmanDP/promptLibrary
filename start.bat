@echo off
chcp 65001 >nul
title AI Art Gallery - 启动中...
color 0B

echo.
echo ========================================
echo    AI Art Gallery - AI绘画艺术图书馆
echo    作者: 清鹤堂主 (RichmanDP)
echo ========================================
echo.

:: 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: Node.js 未安装
    echo.
    echo 请先运行 setup.bat 进行环境检测和安装
    echo.
    pause
    exit /b 1
)

:: 检查依赖
if not exist "node_modules" (
    echo ❌ 错误: 依赖未安装
    echo.
    echo 请先运行 setup.bat 安装依赖
    echo.
    pause
    exit /b 1
)

:: 检查并创建必要的目录
if not exist "uploads" mkdir uploads
if not exist "uploads\metadata" mkdir uploads\metadata
if not exist "data" mkdir data

:: 检查配置文件
if not exist "data\config.json" (
    echo 📝 创建默认配置文件...
    (
        echo {
        echo   "aiTagging": {
        echo     "enabled": true,
        echo     "provider": "ollama",
        echo     "ollamaUrl": "http://localhost:11434",
        echo     "apiKey": "",
        echo     "model": "llava",
        echo     "prompt": "请分析这张AI生成的图片，提取3-5个关键标签。标签应该简洁准确，用中文逗号分隔。只返回标签，不要其他说明。"
        echo   },
        echo   "privateGallery": {
        echo     "enabled": true,
        echo     "passwordHash": "c6603565c5159fbe846a53e991829d452a1546d41150c0d3c73ddbd7f476ee0d"
        echo   }
        echo }
    ) > "data\config.json"
)

:: 检查数据库文件
if not exist "data\gallery.json" (
    echo 📝 创建默认数据库文件...
    (
        echo {
        echo   "images": [],
        echo   "categories": ["写实", "漫画", "2.5D", "艺术画", "科幻", "平面设计"],
        echo   "nextId": 1
        echo }
    ) > "data\gallery.json"
)

echo.
echo 🚀 正在启动服务...
echo.
echo 📌 访问地址:
echo    前端: http://localhost:3000
echo    后端: http://localhost:5555
echo.
echo 💡 提示:
echo    - 点击右上角切换到"管理模式"进行上传和编辑
echo    - 默认私密画廊密码: admin123
echo    - 按 Ctrl+C 可停止服务
echo.
echo ========================================
echo.

:: 等待2秒后自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:3000

:: 启动应用
call npm run dev

pause
