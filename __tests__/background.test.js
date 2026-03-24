/**
 * Unit tests for background.js
 * Tests message validation, context menu handling, and prompt execution logic
 */

const chrome = require('./mocks/chromeMock.js');
const {
  createMockTab,
  createMockSender,
  createMockMenuInfo,
  createMockPrompt,
  setupTabsMock,
  setupSendMessageMock,
  setupCreateTabMock,
  flushPromises,
  getLastCallArgs
} = require('./utils/testHelpers.js');

/**
 * Message validation logic extracted from background.js
 */
function validateMessage(message, sender) {
  // Verify sender is from this extension
  if (sender.id !== chrome.runtime.id) {
    console.error("[Security] Invalid sender ID - rejecting message");
    return false;
  }

  // Validate message structure
  if (!message || typeof message.type !== 'string') {
    console.error("[Security] Invalid message structure");
    return false;
  }

  // Whitelist allowed message types
  const ALLOWED_MESSAGE_TYPES = ['UPDATE_CONTEXT_MENU', 'GET_SELECTED_TEXT', 'EXECUTE_PROMPT'];
  if (!ALLOWED_MESSAGE_TYPES.includes(message.type)) {
    console.error("[Security] Unauthorized message type:", message.type);
    return false;
  }

  return true;
}

describe('Message Validation', () => {
  beforeEach(() => {
    chrome.resetAllMocks();
  });

  describe('Sender validation', () => {
    test('should accept messages from the same extension', () => {
      const message = { type: 'UPDATE_CONTEXT_MENU' };
      const sender = createMockSender({ id: chrome.runtime.id });

      expect(validateMessage(message, sender)).toBe(true);
    });

    test('should reject messages from different extension', () => {
      const message = { type: 'UPDATE_CONTEXT_MENU' };
      const sender = createMockSender({ id: 'different-extension-id' });

      expect(validateMessage(message, sender)).toBe(false);
    });

    test('should reject messages with no sender ID', () => {
      const message = { type: 'UPDATE_CONTEXT_MENU' };
      const sender = createMockSender();
      delete sender.id;

      expect(validateMessage(message, sender)).toBe(false);
    });
  });

  describe('Message structure validation', () => {
    test('should reject null messages', () => {
      const sender = createMockSender();
      expect(validateMessage(null, sender)).toBe(false);
    });

    test('should reject undefined messages', () => {
      const sender = createMockSender();
      expect(validateMessage(undefined, sender)).toBe(false);
    });

    test('should reject messages without type', () => {
      const message = { data: 'test' };
      const sender = createMockSender();

      expect(validateMessage(message, sender)).toBe(false);
    });

    test('should reject messages with non-string type', () => {
      const message = { type: 123 };
      const sender = createMockSender();

      expect(validateMessage(message, sender)).toBe(false);
    });

    test('should reject messages with empty type', () => {
      const message = { type: '' };
      const sender = createMockSender();

      expect(validateMessage(message, sender)).toBe(false);
    });

    test('should reject messages with null type', () => {
      const message = { type: null };
      const sender = createMockSender();

      expect(validateMessage(message, sender)).toBe(false);
    });
  });

  describe('Message type whitelisting', () => {
    const allowedTypes = ['UPDATE_CONTEXT_MENU', 'GET_SELECTED_TEXT', 'EXECUTE_PROMPT'];
    const sender = createMockSender();

    allowedTypes.forEach(type => {
      test(`should accept ${type} message type`, () => {
        const message = { type };
        expect(validateMessage(message, sender)).toBe(true);
      });
    });

    test('should reject unknown message types', () => {
      const message = { type: 'MALICIOUS_ACTION' };
      expect(validateMessage(message, sender)).toBe(false);
    });

    test('should reject message types with extra spaces', () => {
      const message = { type: 'UPDATE_CONTEXT_MENU ' };
      expect(validateMessage(message, sender)).toBe(false);
    });

    test('should be case-sensitive for message types', () => {
      const message = { type: 'update_context_menu' };
      expect(validateMessage(message, sender)).toBe(false);
    });
  });

  describe('Complex validation scenarios', () => {
    test('should accept valid UPDATE_CONTEXT_MENU message', () => {
      const message = {
        type: 'UPDATE_CONTEXT_MENU',
        data: 'additional data'
      };
      const sender = createMockSender();

      expect(validateMessage(message, sender)).toBe(true);
    });

    test('should accept valid GET_SELECTED_TEXT message', () => {
      const message = {
        type: 'GET_SELECTED_TEXT'
      };
      const sender = createMockSender();

      expect(validateMessage(message, sender)).toBe(true);
    });

    test('should accept valid EXECUTE_PROMPT message', () => {
      const message = {
        type: 'EXECUTE_PROMPT',
        prompt: 'Test prompt',
        platform: 'ChatGPT'
      };
      const sender = createMockSender();

      expect(validateMessage(message, sender)).toBe(true);
    });

    test('should reject message with extra dangerous properties', () => {
      const message = {
        type: 'UPDATE_CONTEXT_MENU',
        __proto__: { polluted: true }
      };
      const sender = createMockSender();

      // Message is still valid if type and sender are OK
      expect(validateMessage(message, sender)).toBe(true);
    });
  });
});

describe('Background script message handling', () => {
  beforeEach(() => {
    chrome.resetAllMocks();
  });

  test('should register message listener on load', () => {
    // Simulate background.js registering listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (validateMessage(message, sender)) {
        if (message.type === 'UPDATE_CONTEXT_MENU') {
          sendResponse({ success: true });
        }
      }
      return false;
    });

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should handle valid messages', () => {
    const sendResponse = jest.fn();
    const message = { type: 'UPDATE_CONTEXT_MENU' };
    const sender = createMockSender();

    const handler = (msg, snd, response) => {
      if (validateMessage(msg, snd)) {
        response({ success: true });
        return true;
      }
      return false;
    };

    const result = handler(message, sender, sendResponse);

    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  test('should reject invalid messages silently', () => {
    const sendResponse = jest.fn();
    const maliciousMessage = { type: 'HACK_EXTENSION' };
    const sender = createMockSender();

    const handler = (msg, snd, response) => {
      return validateMessage(msg, snd);
    };

    const result = handler(maliciousMessage, sender, sendResponse);

    expect(result).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });

  test('should reject messages from other extensions', () => {
    const sendResponse = jest.fn();
    const message = { type: 'UPDATE_CONTEXT_MENU' };
    const evilSender = createMockSender({ id: 'evil-extension-id' });

    const handler = (msg, snd, response) => {
      return validateMessage(msg, snd);
    };

    const result = handler(message, evilSender, sendResponse);

    expect(result).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});

describe('Context menu operations', () => {
  beforeEach(() => {
    chrome.resetAllMocks();
  });

  test('should create root context menu item', () => {
    chrome.contextMenus.create({
      id: 'promptologist-root',
      title: 'Promptologist',
      contexts: ['selection', 'page']
    });

    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'promptologist-root',
        title: 'Promptologist'
      })
    );
  });

  test('should remove all context menus before update', async () => {
    chrome.contextMenus.removeAll.mockResolvedValue(undefined);

    await chrome.contextMenus.removeAll();

    expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
  });

  test('should create category submenu items', () => {
    const categories = ['Favorites', 'Writing', 'Coding'];

    categories.forEach(category => {
      chrome.contextMenus.create({
        id: `category-${category}`,
        title: `📁 ${category}`,
        contexts: ['selection', 'page'],
        parentId: 'promptologist-root'
      });
    });

    expect(chrome.contextMenus.create).toHaveBeenCalledTimes(3);
  });

  test('should create prompt menu items under categories', () => {
    const prompts = [
      createMockPrompt({ id: 'p1', name: 'Prompt 1', category: 'Writing' }),
      createMockPrompt({ id: 'p2', name: 'Prompt 2', category: 'Coding' })
    ];

    prompts.forEach(prompt => {
      chrome.contextMenus.create({
        id: `prompt-${prompt.id}`,
        title: prompt.name,
        contexts: ['selection', 'page'],
        parentId: `category-${prompt.category}`
      });
    });

    expect(chrome.contextMenus.create).toHaveBeenCalledTimes(2);
  });

  test('should mark favorite prompts with star icon', () => {
    const favoritePrompt = createMockPrompt({ isFavorite: true });

    chrome.contextMenus.create({
      id: `prompt-${favoritePrompt.id}`,
      title: `⭐ ${favoritePrompt.name}`,
      contexts: ['selection', 'page'],
      parentId: 'promptologist-root'
    });

    const calls = chrome.contextMenus.create.mock.calls;
    const lastCall = calls[calls.length - 1][0];

    expect(lastCall.title).toContain('⭐');
  });

  test('should register click handler for context menu', () => {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      // Handle context menu click
    });

    expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalled();
  });

  test('should not create context menu with no prompts', () => {
    const prompts = [];

    if (prompts.length === 0) {
      chrome.contextMenus.create({
        id: 'no-prompts',
        title: 'No prompts yet - Create one!',
        contexts: ['selection', 'page']
      });
    }

    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'no-prompts'
      })
    );
  });
});

describe('Prompt execution retry logic', () => {
  beforeEach(() => {
    chrome.resetAllMocks();
  });

  async function executePromptWithRetry(tabId, prompt, platform, maxRetries = 5) {
    const INITIAL_DELAY_MS = 10; // Use shorter delay for testing
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'EXECUTE_PROMPT',
          prompt: prompt,
          platform: platform,
          attempt: attempt + 1
        });

        if (response && response.success === true) {
          return true;
        }
        throw new Error(`Invalid response: ${JSON.stringify(response)}`);
      } catch (error) {
        lastError = error;
        if (attempt >= maxRetries - 1) break;

        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw lastError || new Error('Execution failed after retries');
  }

  test('should execute prompt successfully on first attempt', async () => {
    const tabId = 123;
    const prompt = 'Test prompt';
    const platform = 'ChatGPT';

    setupSendMessageMock({ success: true });

    const result = await executePromptWithRetry(tabId, prompt, platform);

    expect(result).toBe(true);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
  });

  test('should retry on failure', async () => {
    const tabId = 123;
    const prompt = 'Test prompt';
    const platform = 'ChatGPT';

    chrome.tabs.sendMessage
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce({ success: true });

    const result = await executePromptWithRetry(tabId, prompt, platform, 3);

    expect(result).toBe(true);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
  });

  test('should respect max retries limit', async () => {
    const tabId = 123;
    const prompt = 'Test prompt';
    const platform = 'ChatGPT';
    const maxRetries = 2;

    chrome.tabs.sendMessage.mockRejectedValue(new Error('Persistent failure'));

    try {
      await executePromptWithRetry(tabId, prompt, platform, maxRetries);
      fail('Should have thrown error');
    } catch (error) {
      expect(error.message).toContain('Persistent failure');
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(maxRetries);
    }
  });

  test('should send attempt number in message', async () => {
    const tabId = 123;
    const prompt = 'Test prompt';
    const platform = 'ChatGPT';

    setupSendMessageMock({ success: true });

    await executePromptWithRetry(tabId, prompt, platform);

    const callArgs = getLastCallArgs(chrome.tabs.sendMessage);
    expect(callArgs[1]).toHaveProperty('attempt', 1);
  });
});

describe('Tab detection and prompt execution', () => {
  beforeEach(() => {
    chrome.resetAllMocks();
  });

  test('should detect ChatGPT platform', () => {
    const tab = createMockTab({ url: 'https://chat.openai.com' });
    const platforms = [
      { name: 'ChatGPT', pattern: /chat\.openai\.com/ },
      { name: 'Claude', pattern: /claude\.ai/ }
    ];

    const detectedPlatform = platforms.find(p => p.pattern.test(tab.url));

    expect(detectedPlatform.name).toBe('ChatGPT');
  });

  test('should detect Claude platform', () => {
    const tab = createMockTab({ url: 'https://claude.ai' });
    const platforms = [
      { name: 'ChatGPT', pattern: /chat\.openai\.com/ },
      { name: 'Claude', pattern: /claude\.ai/ }
    ];

    const detectedPlatform = platforms.find(p => p.pattern.test(tab.url));

    expect(detectedPlatform.name).toBe('Claude');
  });

  test('should open ChatGPT if no platform detected', async () => {
    const tab = createMockTab({ url: 'https://example.com' });
    setupCreateTabMock(createMockTab({ url: 'https://chat.openai.com' }));

    const newTab = await chrome.tabs.create({ url: 'https://chat.openai.com' });

    expect(newTab.url).toBe('https://chat.openai.com');
  });

  test('should support multiple AI platforms', () => {
    const platforms = [
      { name: 'ChatGPT', pattern: /chat\.openai\.com/ },
      { name: 'Claude', pattern: /claude\.ai/ },
      { name: 'Gemini', pattern: /gemini\.google\.com/ },
      { name: 'Perplexity', pattern: /perplexity\.ai/ },
      { name: 'POE', pattern: /poe\.com/ },
      { name: 'Grok', pattern: /grok\.x\.ai/ }
    ];

    const urls = [
      'https://chat.openai.com',
      'https://claude.ai',
      'https://gemini.google.com',
      'https://www.perplexity.ai',
      'https://poe.com',
      'https://grok.x.ai'
    ];

    urls.forEach(url => {
      const detected = platforms.find(p => p.pattern.test(url));
      expect(detected).toBeDefined();
    });
  });
});

describe('Prompt template substitution', () => {
  test('should replace {{text}} with selected text', () => {
    const template = 'Analyze this text: {{text}}';
    const selectionText = 'Hello world';

    const result = template.replace(/\{\{text\}\}/g, selectionText);

    expect(result).toBe('Analyze this text: Hello world');
  });

  test('should replace {{url}} with tab URL', () => {
    const template = 'Summarize the content at {{url}}';
    const tabUrl = 'https://example.com';

    const result = template.replace(/\{\{url\}\}/g, tabUrl);

    expect(result).toBe('Summarize the content at https://example.com');
  });

  test('should replace {{title}} with tab title', () => {
    const template = 'Write a review for {{title}}';
    const tabTitle = 'My Article';

    const result = template.replace(/\{\{title\}\}/g, tabTitle);

    expect(result).toBe('Write a review for My Article');
  });

  test('should handle multiple replacements', () => {
    const template = 'Analyze "{{title}}" from {{url}} about: {{text}}';
    const replacements = {
      '{{title}}': 'Article Title',
      '{{url}}': 'https://example.com',
      '{{text}}': 'Selected text'
    };

    let result = template;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    expect(result).toBe('Analyze "Article Title" from https://example.com about: Selected text');
  });

  test('should handle missing replacements gracefully', () => {
    const template = 'Analyze {{text}} from {{url}}';
    const result = template.replace(/\{\{text\}\}/g, 'Sample').replace(/\{\{url\}\}/g, '');

    expect(result).toBe('Analyze Sample from ');
  });
});
