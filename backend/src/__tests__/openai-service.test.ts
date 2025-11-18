import { describe, it, expect } from 'vitest';

// Helper function to test template rendering
function renderTemplate(template: string, input: Record<string, any>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(input)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
}

describe('OpenAI Service - Template Rendering', () => {
  describe('renderTemplate', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!';
      const input = { name: 'World' };
      const result = renderTemplate(template, input);
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const template = '{{greeting}} {{name}}, welcome to {{place}}!';
      const input = { greeting: 'Hi', name: 'Alice', place: 'Wonderland' };
      const result = renderTemplate(template, input);
      expect(result).toBe('Hi Alice, welcome to Wonderland!');
    });

    it('should handle variables with whitespace in curly braces', () => {
      const template = 'Hello {{ name }}!';
      const input = { name: 'World' };
      const result = renderTemplate(template, input);
      expect(result).toBe('Hello World!');
    });

    it('should replace same variable multiple times', () => {
      const template = '{{name}} says: Hello, {{name}}!';
      const input = { name: 'Bob' };
      const result = renderTemplate(template, input);
      expect(result).toBe('Bob says: Hello, Bob!');
    });

    it('should handle numeric values', () => {
      const template = 'You have {{count}} messages';
      const input = { count: 5 };
      const result = renderTemplate(template, input);
      expect(result).toBe('You have 5 messages');
    });

    it('should leave unmatched variables unchanged', () => {
      const template = 'Hello {{name}}, you have {{count}} items';
      const input = { name: 'Alice' };
      const result = renderTemplate(template, input);
      expect(result).toBe('Hello Alice, you have {{count}} items');
    });

    it('should handle empty input', () => {
      const template = 'Hello {{name}}!';
      const input = {};
      const result = renderTemplate(template, input);
      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle multiline templates', () => {
      const template = `Question: {{question}}

Answer: Let me help you with that.`;
      const input = { question: 'How are you?' };
      const result = renderTemplate(template, input);
      expect(result).toContain('Question: How are you?');
    });
  });
});
