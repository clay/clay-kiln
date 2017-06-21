export function getEventPath(event) {
  let path = [],
    target = event.target;

  if (event.path) {
    // chrome supports this
    return event.path;
  }

  // firefox doesn't support this, so create it manually
  while (target.parentNode) {
    path.push(target);
    target = target.parentNode;
  }

  path.push(document, window);
  return path;
}
