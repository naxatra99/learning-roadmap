const express = require('express');
const cors = require('cors');
//const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/api/generate-roadmap', async (req, res) => {
  const { topic, goal, hoursPerWeek, resources } = req.body;

  // Debug — remove once working
  console.log("API Key loaded:", process.env.ANTHROPIC_API_KEY
    ? "YES — " + process.env.ANTHROPIC_API_KEY.slice(0, 12) + "..."
    : "MISSING — check your .env file");
  console.log("Request received:", { topic, goal, hoursPerWeek, resources });

  const SYSTEM_PROMPT = `You are an expert learning coach and curriculum designer. Create a detailed, actionable, phased learning roadmap based on the user's inputs.

Respond with ONLY valid JSON — no markdown fences, no explanation, nothing else. Schema:

{
  "topic": "string",
  "tagline": "string",
  "totalWeeks": number,
  "totalHours": number,
  "summary": "string",
  "stats": [{"label":"string","value":"string"}],
  "phases": [{
    "id": number,
    "code": "string",
    "title": "string",
    "subtitle": "string",
    "duration": "string",
    "hours": "string",
    "description": "string",
    "milestone": "string",
    "tracks": [{
      "name": "string",
      "icon": "string",
      "items": [{
        "task": "string",
        "time": "string",
        "resource": "string"
      }]
    }]
  }]
}

Output ONLY the JSON object. No markdown, no explanation.`;

  const userMsg = `Topic: ${topic}\nGoal: ${goal}\nWeekly time: ${hoursPerWeek}\nAvailable resources: ${resources}\n\nCreate a complete learning roadmap for me.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    // Log the full error body if something goes wrong
    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Anthropic API error:", JSON.stringify(errorBody, null, 2));
      return res.status(response.status).json({ error: errorBody });
    }

   const data = await response.json();
console.log("Anthropic response:", JSON.stringify(data, null, 2).slice(0, 500));

const raw = data.content?.find(b => b.type === 'text')?.text || '';
if (!raw) {
  console.error("No text content in API response");
  return res.status(500).json({ error: "API returned empty content" });
}

const cleanJson = raw.replace(/```json|```/g, '').trim();
if (!cleanJson) {
  console.error("Empty JSON after cleaning");
  return res.status(500).json({ error: "API returned empty JSON" });
}

const parsed = JSON.parse(cleanJson);
res.json(parsed);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
