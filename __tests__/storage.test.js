/**
 * Unit tests for Chrome storage operations
 * Tests storage get/set/remove operations and listeners
 */

const ChromeStorageMock = require('./mocks/chromeStorageMock.js');

describe('Chrome Storage Mock', () => {
  let storage;

  beforeEach(() => {
    storage = new ChromeStorageMock();
  });

  describe('get operations', () => {
    test('should get stored data', async () => {
      storage.localData = { key1: 'value1', key2: 'value2' };

      const result = await storage.get('key1');

      expect(result).toEqual({ key1: 'value1' });
    });

    test('should get multiple keys', async () => {
      storage.localData = { key1: 'value1', key2: 'value2', key3: 'value3' };

      const result = await storage.get(['key1', 'key3']);

      expect(result).toEqual({ key1: 'value1', key3: 'value3' });
    });

    test('should return empty object for missing keys', async () => {
      storage.localData = { key1: 'value1' };

      const result = await storage.get(['missing']);

      expect(result).toEqual({});
    });

    test('should get all data when no keys specified', async () => {
      storage.localData = { key1: 'value1', key2: 'value2' };

      const result = await storage.get();

      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });

    test('should support callback interface', (done) => {
      storage.localData = { key1: 'value1' };

      storage.get('key1', (result) => {
        expect(result).toEqual({ key1: 'value1' });
        done();
      });
    });
  });

  describe('set operations', () => {
    test('should set single key-value pair', async () => {
      await storage.set({ key1: 'value1' });

      expect(storage.localData.key1).toBe('value1');
    });

    test('should set multiple key-value pairs', async () => {
      await storage.set({ key1: 'value1', key2: 'value2' });

      expect(storage.localData).toEqual({ key1: 'value1', key2: 'value2' });
    });

    test('should overwrite existing values', async () => {
      storage.localData = { key1: 'old' };

      await storage.set({ key1: 'new' });

      expect(storage.localData.key1).toBe('new');
    });

    test('should support callback interface', (done) => {
      storage.set({ key1: 'value1' }, () => {
        expect(storage.localData.key1).toBe('value1');
        done();
      });
    });
  });

  describe('remove operations', () => {
    test('should remove single key', async () => {
      storage.localData = { key1: 'value1', key2: 'value2' };

      await storage.remove('key1');

      expect(storage.localData).toEqual({ key2: 'value2' });
    });

    test('should remove multiple keys', async () => {
      storage.localData = { key1: 'value1', key2: 'value2', key3: 'value3' };

      await storage.remove(['key1', 'key3']);

      expect(storage.localData).toEqual({ key2: 'value2' });
    });

    test('should not error on removing non-existent key', async () => {
      storage.localData = { key1: 'value1' };

      await expect(storage.remove('missing')).resolves.not.toThrow();
      expect(storage.localData).toEqual({ key1: 'value1' });
    });

    test('should support callback interface', (done) => {
      storage.localData = { key1: 'value1' };

      storage.remove('key1', () => {
        expect(storage.localData).toEqual({});
        done();
      });
    });
  });

  describe('clear operations', () => {
    test('should clear all storage data', async () => {
      storage.localData = { key1: 'value1', key2: 'value2' };

      await storage.clear();

      expect(storage.localData).toEqual({});
    });

    test('should work on empty storage', async () => {
      await expect(storage.clear()).resolves.not.toThrow();
    });

    test('should support callback interface', (done) => {
      storage.localData = { key1: 'value1' };

      storage.clear(() => {
        expect(storage.localData).toEqual({});
        done();
      });
    });
  });

  describe('change listeners', () => {
    test('should notify listeners on set', () => {
      const listener = jest.fn();
      storage.addListener(listener);

      storage.set({ key1: 'value1' });

      expect(listener).toHaveBeenCalled();
    });

    test('should pass changes and area name to listener', () => {
      const listener = jest.fn();
      storage.addListener(listener);

      storage.set({ key1: 'value1' });

      const calls = listener.mock.calls[0];
      expect(calls[1]).toBe('local');
    });

    test('should notify multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      storage.addListener(listener1);
      storage.addListener(listener2);

      storage.set({ key1: 'value1' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    test('should remove listener', () => {
      const listener = jest.fn();
      storage.addListener(listener);
      storage.removeListener(listener);

      storage.set({ key1: 'value1' });

      expect(listener).not.toHaveBeenCalled();
    });

    test('should notify on remove', () => {
      const listener = jest.fn();
      storage.localData = { key1: 'value1' };
      storage.addListener(listener);

      storage.remove('key1');

      expect(listener).toHaveBeenCalled();
    });

    test('should notify on clear', () => {
      const listener = jest.fn();
      storage.localData = { key1: 'value1' };
      storage.addListener(listener);

      storage.clear();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Prompt storage use case', () => {
    test('should store and retrieve prompts', async () => {
      const prompts = {
        'p1': { id: 'p1', name: 'Prompt 1', content: 'Content 1' },
        'p2': { id: 'p2', name: 'Prompt 2', content: 'Content 2' }
      };

      await storage.set({ prompts });
      const result = await storage.get('prompts');

      expect(result.prompts).toEqual(prompts);
    });

    test('should update prompt usage count', async () => {
      const prompt = { id: 'p1', name: 'Test', usageCount: 0 };
      storage.localData = { prompts: { p1: prompt } };

      const updated = { ...prompt, usageCount: 1 };
      await storage.set({ prompts: { p1: updated } });

      const result = await storage.get('prompts');
      expect(result.prompts.p1.usageCount).toBe(1);
    });

    test('should track storage changes when prompts update', () => {
      const listener = jest.fn();
      storage.addListener(listener);

      const prompt = { id: 'p1', name: 'Test' };
      storage.set({ prompts: { p1: prompt } });

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][1]).toBe('local');
    });
  });
});
