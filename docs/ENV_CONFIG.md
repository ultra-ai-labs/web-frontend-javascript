# 环境变量配置说明

本项目使用环境变量来管理所有外部服务地址和敏感配置。

## 快速开始

1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 根据你的实际环境修改 `.env` 文件中的配置

3. 重启开发服务器使环境变量生效

## 环境变量说明

### API服务配置

- **REACT_APP_API_URL**
  - 描述：主要的后端API服务地址
  - 默认值：`${window.location.origin}/api`（生产环境自动使用当前域名）
  - 开发示例：`http://localhost:3001` 或 `http://43.161.246.45:3001`
  - 生产示例：`https://ultra-ai.site/api`

- **REACT_APP_CHAT_URL**
  - 描述：聊天服务地址（用于私信营销功能）
  - 默认值：`http://127.0.0.1:3010`
  - 说明：这是本地Python服务，用于处理抖音私信

- **REACT_APP_MODEL_SERVICE_URL**
  - 描述：AI模型服务地址
  - 示例：`https://zg-cloud-model-service.replit.app`

- **REACT_APP_WXPAY_URL**
  - 描述：微信支付服务地址
  - 示例：`https://wx-pay-116838-7-1320884641.sh.run.tcloudbase.com`

- **REACT_APP_GOBACK_URL**
  - 描述：后端Go服务地址（用于KV缓存和小红书token管理）
  - 示例：`https://golang-qo9o-116838-7-1320884641.sh.run.tcloudbase.com`

### Coze AI 配置

- **REACT_APP_COZE_API_URL**
  - 描述：Coze AI API地址
  - 默认值：`https://api.coze.cn/open_api/v2/chat`

- **REACT_APP_COZE_TOKEN**
  - 描述：Coze AI访问令牌
  - 说明：请替换为你自己的token

- **REACT_APP_COZE_BOT_ID_KEYWORD**
  - 描述：关键词提取机器人ID
  - 默认值：`7398469657676070947`

- **REACT_APP_COZE_BOT_ID_TEMPLATE**
  - 描述：模板生成机器人ID
  - 默认值：`7588974730418520115`

### 其他配置

- **REACT_APP_EXTENSION_DOWNLOAD_URL**
  - 描述：浏览器扩展插件下载地址
  - 默认值：`https://douyin-extension-1396001626.cos.ap-guangzhou.myqcloud.com/%E6%99%BA%E6%93%8E%E8%8E%B7%E5%AE%A2%E6%8F%92%E4%BB%B6.zip`

- **REACT_APP_XHS_BASE_URL**
  - 描述：小红书帖子基础URL
  - 默认值：`https://www.xiaohongshu.com/explore/`

- **REACT_APP_DOCS_URL**
  - 描述：使用文档链接（飞书文档）
  - 默认值：`https://pirf51hbn87.feishu.cn/wiki/ALQcw292Ii5GIGk6ighcmO99nPf?from=from_copylink`

- **REACT_APP_EXTENSION_TUTORIAL_URL**
  - 描述：扩展插件安装教程视频链接
  - 默认值：`https://xcn9f50y4vw5.feishu.cn/wiki/Y26hwDUgAioiDzkx7CbcZFC5n1b#share-ZPBed4YFSolUfMxASrvc65zJn8g`

- **REACT_APP_MESSAGE_PROGRAM_DOWNLOAD_URL**
  - 描述：私信支持程序下载地址
  - 默认值：`https://douyin-extension-1396001626.cos.ap-guangzhou.myqcloud.com/%E6%99%BA%E8%83%BD%E7%A7%81%E4%BF%A1%E7%A8%8B%E5%BA%8F.rar`

- **REACT_APP_LOGIN_BG_IMAGE_URL**
  - 描述：登录页面背景图片URL
  - 默认值：`https://picx.zhimg.com/70/v2-52dbe8bdb0e4854c1e5bd39ff75a68d6_1440w.avis?source=172ae18b&biz_tag=Post`

- **REACT_APP_UPLOAD_FORMAT_IMAGE_URL**
  - 描述：上传格式示例图片URL（在评论收集页面显示）
  - 默认值：`https://pica.zhimg.com/70/v2-3f265690b25be5a741622eef49311929_1440w.avis?source=172ae18b&biz_tag=Post`

## 注意事项

1. **不要提交 `.env` 文件**：`.env` 文件包含敏感信息，已添加到 `.gitignore` 中
2. **更新 `.env.example`**：如果添加新的环境变量，请同步更新 `.env.example` 文件
3. **环境变量前缀**：所有环境变量必须以 `REACT_APP_` 开头才能在React应用中使用
4. **重启服务**：修改环境变量后需要重启开发服务器（`npm start`）才能生效
5. **生产构建**：生产环境构建时（`npm run build`），环境变量会被编译到代码中
6. **⚠️ 必须配置**：所有环境变量都必须在 `.env` 文件中配置，代码中不再提供默认值（避免敏感信息泄露到GitHub）

## 部署说明

### 开发环境
直接使用 `.env` 文件即可

### 生产环境
根据部署平台设置环境变量：

- **Vercel/Netlify**: 在平台的环境变量设置中配置
- **Docker**: 通过 `docker run -e` 或 `docker-compose.yml` 的 `environment` 配置
- **传统服务器**: 在 `.env.production` 文件中配置，或在服务器环境中设置

## 故障排查

1. **环境变量未生效**：
   - 确认已重启开发服务器
   - 检查变量名是否以 `REACT_APP_` 开头
   - 使用 `console.log(process.env.REACT_APP_XXX)` 检查变量值

2. **API请求失败**：
   - 检查 `REACT_APP_API_URL` 是否正确配置
   - 确认后端服务已启动且可访问
   - 检查浏览器控制台的网络请求错误信息

3. **应用无法启动或功能异常**：
   - 确认已复制 `.env.example` 为 `.env`
   - 检查所有必需的环境变量是否已配置
   - 查看控制台是否有 `undefined` 相关的错误
