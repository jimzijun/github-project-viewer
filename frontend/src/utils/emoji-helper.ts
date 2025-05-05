import { init } from 'emoji-mart';

// Initialize emoji-mart data
init({ data: async () => {
  const response = await fetch(
    'https://cdn.jsdelivr.net/npm/@emoji-mart/data'
  );
  return await response.json();
}});

/**
 * Checks if a string contains emoji characters
 */
export const hasEmoji = (text: string): boolean => {
  // Regex to detect most emoji characters
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  return emojiRegex.test(text);
};

/**
 * Simple helper to remove specific garbled emoji characters
 * Without affecting valid emojis
 */
export const cleanupText = (text: string): string => {
  if (!text) return '';
  
  // Only remove specific problematic character sequences
  return text.replace(/ð(?:\s*ï¸)?/g, '');
};
