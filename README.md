# ai-video-studio-test

AI短视频自动生成项目（脚本 + 图片 + 视频）

## 安全升级说明

本项目已升级为“安全的 AI 接口结构”：

- 前端不会保存或暴露任何 API Key。
- 后端仅读取环境变量 `OPENAI_API_KEY`。
- 若后端不可用，前端会自动回退到本地模拟脚本生成。

## 项目结构

- `index.html`：静态页面与前端逻辑。
- `server.js`：后端示例接口，提供 `/api/generate-script`。
- `.env.example`：环境变量模板（不含真实密钥）。

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 创建本地环境变量文件：

```bash
cp .env.example .env
```

3. 在 `.env` 中填写你自己的密钥（不要提交到仓库）：

```env
OPENAI_API_KEY=your_api_key_here
```

4. 启动服务：

```bash
npm start
```

5. 打开浏览器访问：

- <http://localhost:3000>

## 前端行为说明

点击“生成脚本”时：

1. 优先请求 `POST /api/generate-script`。
2. 如果后端不可用/请求失败，自动使用本地模拟结果（fallback）。

## 安全提示

- 不要在前端代码中写入 `sk-` 开头密钥。
- 不要将 `.env` 提交到 GitHub。
- GitHub Pages 纯静态部署不适合直接安全调用 OpenAI API；应配合后端服务使用。
