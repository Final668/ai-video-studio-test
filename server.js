const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

function buildFallbackScript(topic) {
  const title = topic || '城市夜景短片';
  return {
    title,
    storyboard: [
      '3秒开场：快速特写 + 标题字幕，吸引注意。',
      '12秒主体：展示3个核心画面，配合节奏卡点转场。',
      '10秒亮点：突出前后对比或关键成果，加入一句金句旁白。',
      '5秒结尾：行动引导（点赞/关注/评论），LOGO收尾。'
    ],
    copywriting: `今天带你看${title}，30秒快速抓住重点，记得点赞关注获取更多灵感！`
  };
}

async function generateScriptWithOpenAI(topic, apiKey) {
  const promptTopic = (topic || '').trim() || '城市夜景短片';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '你是专业短视频编导。输出必须是 JSON 对象，字段为 title（字符串）、storyboard（字符串数组）、copywriting（字符串）。不要输出任何额外文本。'
        },
        {
          role: 'user',
          content: `请基于主题“${promptTopic}”生成短视频脚本，要求有吸引力、可执行，时长约30秒。`
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI API returned empty content.');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('OpenAI response is not valid JSON.');
  }

  if (
    typeof parsed.title !== 'string' ||
    !Array.isArray(parsed.storyboard) ||
    typeof parsed.copywriting !== 'string'
  ) {
    throw new Error('OpenAI response missing required fields: title/storyboard/copywriting.');
  }

  return {
    title: parsed.title,
    storyboard: parsed.storyboard.map((item) => String(item)),
    copywriting: parsed.copywriting
  };
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
    const script = await generateScriptWithOpenAI(topic, apiKey);

    return res.json({
      topic,
      script,
      source: 'openai'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate script from OpenAI API.',
      details: error.message,
      script: buildFallbackScript(topic),
      source: 'fallback'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
