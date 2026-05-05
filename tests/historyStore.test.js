import test from 'node:test';
import assert from 'node:assert/strict';

import { createHistoryStore } from '../src/lib/historyStore.js';

test('history store saves, undoes, and redoes states', () => {
  const store = createHistoryStore();

  store.saveState({ step: 1 });
  store.saveState({ step: 2 });

  assert.deepEqual(store.getFlags(), { canUndo: true, canRedo: false });
  assert.deepEqual(store.undo(), { step: 1 });
  assert.deepEqual(store.getFlags(), { canUndo: false, canRedo: true });
  assert.deepEqual(store.redo(), { step: 2 });
});

test('history store truncates future states when saving after undo', () => {
  const store = createHistoryStore();

  store.saveState({ step: 1 });
  store.saveState({ step: 2 });
  store.saveState({ step: 3 });

  assert.deepEqual(store.undo(), { step: 2 });
  store.saveState({ step: 4 });

  assert.equal(store.redo(), null);
  assert.deepEqual(store.undo(), { step: 2 });
});

test('history store honors max history length', () => {
  const store = createHistoryStore(2);

  store.saveState({ step: 1 });
  store.saveState({ step: 2 });
  store.saveState({ step: 3 });

  assert.deepEqual(store.undo(), { step: 2 });
  assert.equal(store.undo(), null);
});
