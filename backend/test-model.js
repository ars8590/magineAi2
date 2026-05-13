import dotenv from "dotenv";

// ✅ dotenv MUST be loaded first
dotenv.config();

import OpenAI from "openai";

console.log("USING DOTENV METHOD");
console.log("OPENROUTER KEY =", process.env.OPENROUTER_API_KEY);

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function test() {
  const res = await client.chat.completions.create({
    model: "deepseek/deepseek-r1",
    messages: [
      { role: "user", content: "Write one Malayalam sentence about Kerala." }
    ],
  });

  console.log(res.choices[0].message.content);
}

test();
