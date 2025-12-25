@echo off
chcp 65001 >nul
title AI Art Gallery - 环境检测与安装
color 0A

echo.
echo ========================================
echo    AI Art Gallery - 环境检测与安装
echo    作者: 清鹤堂主 (RichmanDP)
echo ========================================
echo.

:: 检查Node.js
echo [1/3] 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装
    echo.
    echo 正在尝试安装 Node.js...
    echo 请稍后，这可能需要几分钟...
    
    :: 下载并安装Node.js
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'}"
    
    if exist "%TEMP%\nodejs.msi" (
        echo 开始安装 Node.js...
        msiexec /i "%TEMP%\nodejs.msi" /qn
        del "%TEMP%\nodejs.msi"
        
        :: 刷新环境变量
        echo 正在刷新环境变量...
        timeout /t 5 /nobreak >nul
        
        :: 再次检查
        node --version >nul 2>&1
        if %errorlevel% neq 0 (
            echo ❌ Node.js 安装失败
            echo.
            echo 请手动安装 Node.js:
            echo 1. 访问: https://nodejs.org/
            echo 2. 下载并安装 LTS 版本
            echo 3. 重新运行此脚本
            pause
            exit /b 1
        ) else (
            echo ✅ Node.js 安装成功!
        )
    ) else (
        echo ❌ 下载 Node.js 失败
        echo.
        echo 请手动安装 Node.js:
        echo 1. 访问: https://nodejs.org/
        echo 2. 下载并安装 LTS 版本
        echo 3. 重新运行此脚本
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js 已安装: %NODE_VERSION%
)

echo.

:: 检查npm
echo [2/3] 检查 npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未找到
    echo npm 应该随 Node.js 一起安装，请重新安装 Node.js
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm 已安装: v%NPM_VERSION%
)

echo.

:: 检查并安装项目依赖
echo [3/3] 安装项目依赖...
if not exist "node_modules" (
    echo 📦 正在安装依赖包...
    echo 这可能需要几分钟，请耐心等待...
    echo.
    call npm install
    
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo.
        echo 请检查网络连接后重试
        pause
        exit /b 1
    ) else (
        echo ✅ 依赖安装成功!
    )
) else (
    echo ✅ 依赖已安装
    
    :: 检查是否需要更新
    echo.
    echo 检查依赖更新...
    call npm outdated
)

echo.
echo ========================================
echo    环境检测完成！
echo ========================================
echo.
echo ✅ 所有依赖已就绪
echo.
echo 📝 下一步:
echo    1. 双击 start.bat 启动应用
echo    2. 或运行: npm run dev
echo.
echo 💡 提示:
echo    - 前端地址: http://localhost:3000
echo    - 后端地址: http://localhost:5555
echo    - 可选安装 Ollama 以使用本地AI功能
echo.
echo ========================================
echo.

pause
