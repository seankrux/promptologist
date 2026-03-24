/**
 * Chrome Storage API Mock
 * Provides in-memory storage implementation for testing
 */

class ChromeStorageMock {
  constructor() {
    this.localData = {};
    this.syncData = {};
    this.listeners = [];
  }

  /**
   * Get data from storage
   */
  get(keys, callback) {
    const result = {};
    if (!keys) {
      Object.assign(result, this.localData);
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (key in this.localData) {
          result[key] = this.localData[key];
        }
      });
    } else if (typeof keys === 'object') {
      Object.assign(result, keys, this.localData);
    } else if (typeof keys === 'string') {
      if (keys in this.localData) {
        result[keys] = this.localData[keys];
      }
    }

    if (callback) {
      callback(result);
    }
    return Promise.resolve(result);
  }

  /**
   * Set data in storage
   */
  set(items, callback) {
    Object.assign(this.localData, items);
    this._notifyListeners(items, 'local');

    if (callback) {
      callback();
    }
    return Promise.resolve();
  }

  /**
   * Remove data from storage
   */
  remove(keys, callback) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const changes = {};

    keysArray.forEach(key => {
      if (key in this.localData) {
        changes[key] = { newValue: undefined, oldValue: this.localData[key] };
        delete this.localData[key];
      }
    });

    this._notifyListeners(changes, 'local');

    if (callback) {
      callback();
    }
    return Promise.resolve();
  }

  /**
   * Clear all data in storage
   */
  clear(callback) {
    const changes = {};
    Object.keys(this.localData).forEach(key => {
      changes[key] = { oldValue: this.localData[key] };
      delete this.localData[key];
    });

    this._notifyListeners(changes, 'local');

    if (callback) {
      callback();
    }
    return Promise.resolve();
  }

  /**
   * Notify listeners of changes
   */
  _notifyListeners(changes, areaName) {
    this.listeners.forEach(listener => {
      listener(changes, areaName);
    });
  }

  /**
   * Add change listener
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove change listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
}

module.exports = ChromeStorageMock;
