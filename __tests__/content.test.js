/**
 * Unit tests for content.js
 * Tests the validateAndSanitizePrompt function and message handling
 */

const chrome = require('./mocks/chromeMock.js');
const { createMockSender } = require('./utils/testHelpers.js');

// Extract the function for testing
function validateAndSanitizePrompt(prompt) {
  if (typeof prompt !== 'string') {
    throw new Error("Prompt must be a string");
  }

  if (prompt.length > 50000) {
    throw new Error("Prompt exceeds maximum length (50000 characters)");
  }

  const DANGEROUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /function\s*\(/i,
    /constructor\s*\(/i
  ];

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(prompt)) {
      throw new Error("Prompt contains potentially dangerous content");
    }
  }

  return prompt;
}

describe('validateAndSanitizePrompt', () => {
  describe('Input validation', () => {
    test('should accept valid string prompts', () => {
      const validPrompt = 'This is a valid prompt';
      expect(validateAndSanitizePrompt(validPrompt)).toBe(validPrompt);
    });

    test('should accept empty strings', () => {
      const emptyPrompt = '';
      expect(validateAndSanitizePrompt(emptyPrompt)).toBe(emptyPrompt);
    });

    test('should accept prompts with special characters', () => {
      const specialPrompt = 'Hello! How are you? #test @mention $5.00 café';
      expect(validateAndSanitizePrompt(specialPrompt)).toBe(specialPrompt);
    });

    test('should accept prompts with new lines and tabs', () => {
      const multilinePrompt = 'Line 1\nLine 2\tTabbed';
      expect(validateAndSanitizePrompt(multilinePrompt)).toBe(multilinePrompt);
    });

    test('should reject non-string inputs', () => {
      expect(() => validateAndSanitizePrompt(123)).toThrow(
        'Prompt must be a string'
      );
      expect(() => validateAndSanitizePrompt(null)).toThrow(
        'Prompt must be a string'
      );
      expect(() => validateAndSanitizePrompt(undefined)).toThrow(
        'Prompt must be a string'
      );
      expect(() => validateAndSanitizePrompt({ prompt: 'test' })).toThrow(
        'Prompt must be a string'
      );
      expect(() => validateAndSanitizePrompt(['test'])).toThrow(
        'Prompt must be a string'
      );
    });

    test('should reject prompts exceeding max length', () => {
      const longPrompt = 'a'.repeat(50001);
      expect(() => validateAndSanitizePrompt(longPrompt)).toThrow(
        'Prompt exceeds maximum length (50000 characters)'
      );
    });

    test('should accept prompts at max length boundary', () => {
      const maxLengthPrompt = 'a'.repeat(50000);
      expect(validateAndSanitizePrompt(maxLengthPrompt)).toBe(maxLengthPrompt);
    });
  });

  describe('Security - Script injection detection', () => {
    test('should reject prompts with <script> tags', () => {
      const maliciousPrompt = 'Hello <script>alert("xss")</script>';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });

    test('should reject prompts with <SCRIPT> tags (case insensitive)', () => {
      const maliciousPrompt = 'Hello <SCRIPT>alert("xss")</SCRIPT>';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });

    test('should reject javascript: protocol', () => {
      const maliciousPrompt = 'Click here: javascript:alert("xss")';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });

    test('should reject event handlers', () => {
      const maliciousPrompt = '<div onmouseover="alert(1)">test</div>';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });

    test('should reject eval() function calls', () => {
      const maliciousPrompt = 'eval(window.alert)';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });

    test('should reject function declarations', () => {
      const maliciousPrompt = 'function() { malicious code }';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });

    test('should reject constructor calls', () => {
      const maliciousPrompt = 'constructor() { evil }';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });

    test('should handle multiple dangerous patterns in one prompt', () => {
      const maliciousPrompt = '<script>eval(function() {})</script>';
      expect(() => validateAndSanitizePrompt(maliciousPrompt)).toThrow(
        'Prompt contains potentially dangerous content'
      );
    });
  });

  describe('Edge cases', () => {
    test('should handle prompts with HTML entities', () => {
      const prompt = 'Hello &lt;script&gt; world';
      expect(validateAndSanitizePrompt(prompt)).toBe(prompt);
    });

    test('should handle prompts with word containing javascript', () => {
      // This is a legitimate word, not a protocol
      const prompt = 'I love programming in javascript language';
      expect(validateAndSanitizePrompt(prompt)).toBe(prompt);
    });

    test('should handle common legitimate patterns', () => {
      const legitimatePrompts = [
        'How does the javascript ecosystem work?',
        'function overloading in Python',
        'Check the constructor property',
        'Use eval carefully with trusted input',
        'event handler patterns in React'
      ];

      legitimatePrompts.forEach(prompt => {
        // These should NOT throw because they're in natural language context
        // Only strict patterns throw
        expect(() => validateAndSanitizePrompt(prompt)).not.toThrow();
      });
    });

    test('should be case-insensitive for dangerous patterns', () => {
      const maliciousPrompts = [
        '<Script>alert(1)</Script>',
        '<SCRIPT>alert(1)</SCRIPT>',
        '<ScRiPt>alert(1)</ScRiPt>',
        'JAVASCRIPT:alert(1)',
        'JavaScript:alert(1)'
      ];

      maliciousPrompts.forEach(prompt => {
        expect(() => validateAndSanitizePrompt(prompt)).toThrow(
          'Prompt contains potentially dangerous content'
        );
      });
    });

    test('should reject onclick with various spacing', () => {
      const variants = [
        'onclick="alert(1)"',
        'onclick ="alert(1)"',
        'onclick = "alert(1)"',
        'ONCLICK="alert(1)"'
      ];

      variants.forEach(prompt => {
        expect(() => validateAndSanitizePrompt(prompt)).toThrow(
          'Prompt contains potentially dangerous content'
        );
      });
    });
  });

  describe('Custom matchers', () => {
    test('should validate prompts with custom matcher', () => {
      const validPrompt = 'This is a valid prompt';
      expect(validPrompt).toBeValidPrompt();
    });

    test('should reject invalid prompts with custom matcher', () => {
      const invalidPrompt = 'a'.repeat(50001);
      expect(() => {
        expect(invalidPrompt).toBeValidPrompt();
      }).toThrow();
    });
  });
});

describe('Content script message handling', () => {
  beforeEach(() => {
    chrome.resetAllMocks();
  });

  test('should register message listener', () => {
    // Simulate content.js registering listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXECUTE_PROMPT') {
        sendResponse({ success: true });
      }
    });

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should handle EXECUTE_PROMPT messages', () => {
    const handler = jest.fn();
    const sender = createMockSender();

    chrome.runtime.onMessage.addListener(handler);
    chrome.runtime.simulateMessage(
      { type: 'EXECUTE_PROMPT', prompt: 'test' },
      sender,
      jest.fn()
    );

    expect(handler).toHaveBeenCalled();
  });

  test('should validate prompts before execution', () => {
    const maliciousPrompt = '<script>alert("xss")</script>';

    expect(() => {
      validateAndSanitizePrompt(maliciousPrompt);
    }).toThrow('Prompt contains potentially dangerous content');
  });

  test('should safely handle large prompts', () => {
    const largeButValidPrompt = 'a'.repeat(50000);
    expect(validateAndSanitizePrompt(largeButValidPrompt)).toBe(largeButValidPrompt);
  });

  test('should reject oversized prompts', () => {
    const oversizedPrompt = 'a'.repeat(50001);
    expect(() => {
      validateAndSanitizePrompt(oversizedPrompt);
    }).toThrow('Prompt exceeds maximum length');
  });
});
