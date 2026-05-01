const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

function buildFallbackScript(topic) {
  const normalizedTopic = (topic || '').trim() || '城市夜景短片';

  const titleTemplates = [
    `30秒看懂${normalizedTopic}`,
    `${normalizedTopic}：从普通到惊艳的拍法`,
    `别再乱拍！${normalizedTopic}爆款脚本来了`,
    `${normalizedTopic}高能混剪：节奏感直接拉满`,
    `新手也能拍好的${normalizedTopic}短片范例`,
    `${normalizedTopic}的4段式情绪推进模板`
  ];

  const openings = [
    '3秒开场：问题式字幕切入 + 快速特写，先抛悬念再给画面。',
    '3秒开场：环境全景到人物近景的推镜，字幕点题“今天只讲干货”。',
    '3秒开场：先给结果画面，再反打过程，第一秒建立期待。',
    '3秒开场：高对比前后镜头闪切，配合强节奏鼓点抓住注意力。'
  ];

  const bodies = [
    '12秒主体：拆成3个步骤，每步一个核心镜头，转场统一用节奏卡点。',
    '12秒主体：用“场景-动作-细节”三连镜头，信息清晰且不拖沓。',
    '12秒主体：围绕一个主线冲突推进，镜头由静到动逐步增强张力。',
    '12秒主体：展示两个常见误区 + 对应正确做法，实用感更强。'
  ];

  const climaxes = [
    '10秒高潮：给出最有冲击力的成果镜头，叠加一句金句旁白形成记忆点。',
    '10秒高潮：通过前后对比制造反差，最后一帧停留在关键细节。',
    '10秒高潮：节奏突然加速，连续展示高能片段，把情绪推到顶点。',
    '10秒高潮：加入“如果只记住一件事”总结句，强化价值感。'
  ];

  const endings = [
    '5秒结尾：发起互动提问（你更喜欢哪一版？）+ 点赞关注引导。',
    '5秒结尾：给出下一期预告，结尾固定LOGO形成系列感。',
    '5秒结尾：一句行动口号收束情绪，评论区领取同款模板。',
    '5秒结尾：复现主题关键词 + 关注引导，提升记忆与转化。'
  ];

  const hooks = [
    '收藏这条，拍摄时直接照着走。',
    '看完就能上手，建议先转发给搭档。',
    '别只看一遍，照着镜头顺序实拍效果更好。',
    '按这个节奏剪，出片效率会明显提升。'
  ];

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const title = pick(titleTemplates);

  return {
    title,
    storyboard: [pick(openings), pick(bodies), pick(climaxes), pick(endings)],
    copywriting: `这期主题：${normalizedTopic}。${pick(hooks)} 用30秒讲清重点，点赞关注获取更多脚本灵感！`
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
