import test from 'node:test';
import assert from 'node:assert/strict';

import { getOrderedLayerIds, moveLayerInOrder, reorderLayersByIds } from '../src/lib/layerOrder.js';

const helperObject = { helper: true };
const layer = (id) => ({ data: { id } });

test('moveLayerInOrder moves a layer forward without disturbing helper objects', () => {
  const objects = [helperObject, layer('element-1'), layer('element-2'), layer('element-3')];
  const reordered = moveLayerInOrder(objects, 'element-2', 'up');

  assert.equal(reordered[0], helperObject);
  assert.deepEqual(getOrderedLayerIds(reordered), ['element-1', 'element-3', 'element-2']);
});

test('moveLayerInOrder moves a layer backward without disturbing helper objects', () => {
  const objects = [layer('element-1'), helperObject, layer('element-2'), layer('element-3')];
  const reordered = moveLayerInOrder(objects, 'element-3', 'down');

  assert.equal(reordered[1], helperObject);
  assert.deepEqual(getOrderedLayerIds(reordered), ['element-1', 'element-3', 'element-2']);
});

test('reorderLayersByIds applies explicit layer ordering', () => {
  const objects = [helperObject, layer('element-1'), layer('element-2'), layer('element-3')];
  const reordered = reorderLayersByIds(objects, ['element-3', 'element-1', 'element-2']);

  assert.equal(reordered[0], helperObject);
  assert.deepEqual(getOrderedLayerIds(reordered), ['element-3', 'element-1', 'element-2']);
});
