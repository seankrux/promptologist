/**
 * Test helper utilities for Chrome extension testing
 */

const chrome = require('../mocks/chromeMock.js');

/**
 * Create a mock tab object
 */
function createMockTab(overrides = {}) {
  return {
    id: 12345,
    windowId: 1,
    index: 0,
    url: 'https://chat.openai.com',
    title: 'ChatGPT',
    active: true,
    pinned: false,
    highlighted: false,
    status: 'complete',
    incognito: false,
    ...overrides
  };
}

/**
 * Create a mock message sender
 */
function createMockSender(overrides = {}) {
  return {
    id: chrome.runtime.id,
    url: 'https://chat.openai.com',
    tab: createMockTab(),
    frameId: 0,
    ...overrides
  };
}

/**
 * Create a mock context menu info object
 */
function createMockMenuInfo(overrides = {}) {
  return {
    menuItemId: 'prompt-123',
    parentMenuItemId: 'promptologist-root',
    mediaType: undefined,
    linkUrl: undefined,
    srcUrl: undefined,
    pageUrl: 'https://chat.openai.com',
    frameUrl: 'https://chat.openai.com',
    selectionText: 'Hello world',
    editable: false,
    wasChecked: undefined,
    checked: undefined,
    ...overrides
  };
}

/**
 * Create a mock prompt object
 */
function createMockPrompt(overrides = {}) {
  return {
    id: 'prompt-1',
    name: 'Test Prompt',
    content: 'Test prompt content: {{text}}',
    category: 'Test Category',
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Setup chrome.tabs.query mock with a tab
 */
function setupTabsMock(tab = createMockTab()) {
  chrome.tabs.query.mockResolvedValue([tab]);
  return tab;
}

/**
 * Setup chrome.tabs.sendMessage mock with a response
 */
function setupSendMessageMock(response = { success: true }) {
  chrome.tabs.sendMessage.mockResolvedValue(response);
  return response;
}

/**
 * Setup chrome.tabs.create mock
 */
function setupCreateTabMock(tab = createMockTab()) {
  chrome.tabs.create.mockResolvedValue(tab);
  return tab;
}

/**
 * Setup chrome.storage.local.get mock
 */
function setupStorageGetMock(data = {}) {
  chrome.storage.local.get.mockImplementation((keys, callback) => {
    if (typeof keys === 'function') {
      callback = keys;
      data = {};
    }
    if (callback) {
      callback(data);
    }
    return Promise.resolve(data);
  });
  return data;
}

/**
 * Wait for a specific amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for async operations to complete
 */
async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Get the last call arguments for a mock function
 */
function getLastCallArgs(mockFn) {
  const calls = mockFn.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1] : [];
}

/**
 * Create a mock scripting.executeScript response
 */
function createScriptingResponse(result) {
  return [{
    frameId: 0,
    result: result
  }];
}

module.exports = {
  createMockTab,
  createMockSender,
  createMockMenuInfo,
  createMockPrompt,
  setupTabsMock,
  setupSendMessageMock,
  setupCreateTabMock,
  setupStorageGetMock,
  wait,
  flushPromises,
  getLastCallArgs,
  createScriptingResponse
};
