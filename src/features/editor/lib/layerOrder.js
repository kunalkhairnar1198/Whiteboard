const isLayerObject = (object) => Boolean(object?.data?.id);

const getLayerObjects = (objects) => objects.filter(isLayerObject);

export const moveLayerInOrder = (objects, id, direction) => {
  const layers = getLayerObjects(objects);
  const currentIndex = layers.findIndex((object) => object.data.id === id);

  if (currentIndex === -1) {
    return objects;
  }

  const nextIndex =
    direction === 'up'
      ? Math.min(layers.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

  if (currentIndex === nextIndex) {
    return objects;
  }

  const nextLayers = [...layers];
  const [movedLayer] = nextLayers.splice(currentIndex, 1);
  nextLayers.splice(nextIndex, 0, movedLayer);

  let layerCursor = 0;
  return objects.map((object) => {
    if (!isLayerObject(object)) return object;
    const nextObject = nextLayers[layerCursor];
    layerCursor += 1;
    return nextObject;
  });
};

export const reorderLayersByIds = (objects, orderedLayerIds) => {
  const layers = getLayerObjects(objects);
  if (layers.length !== orderedLayerIds.length) {
    return objects;
  }

  const layerMap = new Map(layers.map((object) => [object.data.id, object]));
  const nextLayers = orderedLayerIds.map((id) => layerMap.get(id)).filter(Boolean);

  if (nextLayers.length !== layers.length) {
    return objects;
  }

  let layerCursor = 0;
  return objects.map((object) => {
    if (!isLayerObject(object)) return object;
    const nextObject = nextLayers[layerCursor];
    layerCursor += 1;
    return nextObject;
  });
};

export const getOrderedLayerIds = (objects) => getLayerObjects(objects).map((object) => object.data.id);
