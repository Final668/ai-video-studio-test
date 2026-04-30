const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

function buildFallbackScript(topic) {
  const title = topic || '城市夜景短片';
  return `【主题】${title}\n【时长】30秒\n【镜头脚本】\n1. 3秒开场：快速特写 + 标题字幕，吸引注意。\n2. 12秒主体：展示3个核心画面，配合节奏卡点转场。\n3. 10秒亮点：突出前后对比或关键成果，加入一句金句旁白。\n4. 5秒结尾：行动引导（点赞/关注/评论），LOGO收尾。`;
}

app.post('/api/generate-script', async (req, res) => {
  const { topic = '' } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is not configured on the server.',
      script: buildFallbackScript(topic),
      source: 'fallback'
    });
  }

  try {
    // 示例结构：此处保留为可扩展的 OpenAI API 接口，避免在仓库中写入真实密钥。
    // 未来可替换为官方 SDK 调用，并继续通过环境变量读取 OPENAI_API_KEY。
    return res.json({
      script: buildFallbackScript(topic),
      source: 'server-demo',
      note: 'Server endpoint is ready. Replace this block with a real OpenAI API call when needed.'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate script from server.',
      details: error.message,
      script: buildFallbackScript(topic),
      source: 'fallback'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
