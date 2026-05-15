import assert from 'node:assert/strict';
import test from 'node:test';

import { getNextElementCounterFromState } from '../src/lib/editorState.js';

test('returns next element counter from serialized canvas state', () => {
  const state = {
    objects: [
      { data: { id: 'element-2' } },
      { data: { id: 'element-9' } },
      { data: { id: 'other-4' } },
    ],
  };

  assert.equal(getNextElementCounterFromState(state), 10);
});

test('returns zero when state has no tracked objects', () => {
  assert.equal(getNextElementCounterFromState(null), 0);
  assert.equal(getNextElementCounterFromState({ objects: [] }), 0);
});
