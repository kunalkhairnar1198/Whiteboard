export const getNextElementCounterFromState = (state) => {
  if (!state || !Array.isArray(state.objects)) return 0;

  let maxId = -1;
  state.objects.forEach((object) => {
    const id = object?.data?.id;
    if (typeof id !== 'string') return;

    const match = id.match(/element-(\d+)/);
    if (match) {
      maxId = Math.max(maxId, parseInt(match[1], 10));
    }
  });

  return maxId + 1;
};
