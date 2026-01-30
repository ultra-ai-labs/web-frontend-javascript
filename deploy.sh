#!/bin/bash

# 遇到错误立即退出
set -e

echo "====== 开始部署 ======"

# 1. 拉取最新代码
echo "[1/5] 拉取最新代码..."
git pull

# 2. 安装依赖 (防止有新依赖加入)
echo "[2/5] 安装/更新依赖..."
npm install

# 3. 构建项目
echo "[3/5] 构建项目..."
npm run build

# 4. 部署静态文件
echo "[4/5] 部署静态文件到 Nginx..."
# 确保目标目录存在
if [ ! -d "/usr/share/nginx/html" ]; then
    echo "创建 /usr/share/nginx/html 目录..."
    mkdir -p /usr/share/nginx/html
fi

# 清空旧文件 (可选，视情况而定，这里选择覆盖)
# rm -rf /usr/share/nginx/html/*

# 复制新文件
cp -r build/* /usr/share/nginx/html/

# 5. 更新并重载 Nginx 配置
echo "[5/5] 更新 Nginx 配置..."
# 假设 nginx 配置目录在 /etc/nginx/conf.d/
cp nginx.conf /etc/nginx/conf.d/web-frontend.conf

echo "检查 Nginx 配置..."
nginx -t

echo "重载 Nginx..."
nginx -s reload

echo "====== 部署成功！ ======"
