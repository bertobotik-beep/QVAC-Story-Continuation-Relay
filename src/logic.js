// QVAC Story Continuation Relay — core logic.
// The user and the AI take turns adding one paragraph each to a shared story.

import { completion } from "@qvac/sdk";

function cleanParagraph(text) {
  if (!text) return "";
  return text
    .trim()
    .replace(/^(here'?s|here is)[^:\n]*:\s*/i, "")
    .replace(/^\*\*[^*]+\*\*\s*/g, "")
    .replace(/^(paragraph|continuation|ai|response|writer\s*\d)\s*\d*\s*:\s*/i, "")
    .replace(/^\(you reply with only this\)\s*:?\s*/i, "")
    .split(/\n\s*\n/)[0]
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function looksUnusable(text) {
  if (!text || text.trim().length < 10) return true;
  const bad = [
    "i cannot", "i can't", "as an ai", "i'm not able", "i do not have",
    "i don't have enough", "please provide more", "could you provide",
  ];
  const lower = text.toLowerCase();
  return bad.some((p) => lower.includes(p));
}

export async function generate(modelId, body) {
  const history = Array.isArray(body.history) ? body.history : [];
  const userText = (body.userText || "").trim();

  if (!userText) {
    return { error: "Please write a paragraph to continue the story." };
  }

  const storySoFar = [...history, { author: "user", text: userText }]
    .map((turn, i) => `${turn.author === "user" ? "Writer 1" : "Writer 2"}: ${turn.text}`)
    .join("\n\n");

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You are Writer 2 in a collaborative relay story. You and Writer 1 take turns adding exactly ONE short paragraph (3-5 sentences) that continues the story naturally, staying consistent with characters, setting, and tone already established. Do not summarize, do not restart the story, do not add headers or labels. Reply with ONLY the next paragraph of prose.\n\nExample:\nWriter 1: The old lighthouse hadn't worked in years, but Maren still climbed the spiral stairs every evening.\nWriter 2 (you reply with only this): Tonight the glass at the top was fogged with salt, and through it she could just make out a shape bobbing in the water below — too large to be a buoy, too still to be a boat.",
      },
      { role: "user", content: storySoFar + "\n\nWriter 2:" },
    ],
    stream: true,
    completionOpts: { temperature: 0.85, maxTokens: 220 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = cleanParagraph(text);

  if (looksUnusable(text)) {
    text = "The story paused for a moment, as if catching its breath, before something unexpected stirred just out of sight.";
  }

  return { aiText: text };
}
