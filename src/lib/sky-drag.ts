let suppressClick = false;

export function markSkyDrag() {
  suppressClick = true;
}

export function skyDragBlocksClick(): boolean {
  return suppressClick;
}

export function clearSkyDrag() {
  suppressClick = false;
}
