const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callClaude(messages: ClaudeMessage[], maxTokens = 1024): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.content.find((block: any) => block.type === 'text');

  if (!textContent) {
    throw new Error('No text content in Claude response');
  }

  return textContent.text;
}

export async function describeBusiness(
  businessType: string,
  businessName: string,
  websiteText?: string
): Promise<string[]> {
  const context = websiteText ? `\n\nWebsite content:\n${websiteText.substring(0, 1000)}` : '';

  const prompt = `Generate exactly 3 business descriptions for: ${businessName} (${businessType})${context}

Each should be 1-2 sentences. Return ONLY:
1. [description]
2. [description]
3. [description]`;

  const response = await callClaude([{ role: 'user', content: prompt }], 512);

  const descriptions = response
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, 3);

  return descriptions;
}

export async function parseBusinessHours(text: string): Promise<any> {
  const prompt = `Parse business hours: "${text}"

Return ONLY this JSON format:
[
  {"day": "Monday", "open": "09:00", "close": "18:00", "closed": false},
  {"day": "Tuesday", "open": "09:00", "close": "18:00", "closed": false},
  {"day": "Wednesday", "open": "09:00", "close": "18:00", "closed": false},
  {"day": "Thursday", "open": "09:00", "close": "18:00", "closed": false},
  {"day": "Friday", "open": "09:00", "close": "18:00", "closed": false},
  {"day": "Saturday", "open": "10:00", "close": "16:00", "closed": false},
  {"day": "Sunday", "open": null, "close": null, "closed": true}
]`;

  const response = await callClaude([{ role: 'user', content: prompt }], 512);

  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Invalid hours format');
  }
}

export async function generateSampleProducts(
  businessType: string,
  businessName: string
): Promise<any[]> {
  const prompt = `Generate 4 realistic products for ${businessType} business "${businessName}".

Return ONLY valid JSON array:
[{"name": "Product", "description": "Description", "category": "Category", "price": 99.99}]`;

  const response = await callClaude([{ role: 'user', content: prompt }], 1024);

  try {
    return JSON.parse(response);
  } catch {
    return [];
  }
}
