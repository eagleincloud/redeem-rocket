// Natural Language Parsers

import { parseBusinessHours } from './llm.ts';

export async function parseNaturalLanguage(text: string): Promise<any> {
  try {
    console.log(`[parseNaturalLanguage] Parsing: "${text.substring(0, 100)}..."`);

    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('open') ||
      lowerText.includes('close') ||
      lowerText.includes('am') ||
      lowerText.includes('pm')
    ) {
      console.log('[parseNaturalLanguage] Detected business hours');

      const hours = await parseBusinessHours(text);

      return {
        hours,
        fields_parsed: true,
      };
    }

    return {
      fields_parsed: false,
      error: 'Could not detect what to parse',
    };
  } catch (error) {
    console.error('[parseNaturalLanguage] Error:', error);

    return {
      fields_parsed: false,
      error: error instanceof Error ? error.message : 'Parsing failed',
    };
  }
}
