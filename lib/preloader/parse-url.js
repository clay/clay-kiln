/**
 * Turn the hash string on the location
 * into an object
 *
 * @return {Object}
 */
export default function parseUrl() {
  if (window.location.hash) {
    const hashProps = window.location.hash.replace('#', '').split('~');

    let propMapping;

    if (hashProps[0] === 'kiln') {
      // opening the clay menu
      propMapping = {
        tab: hashProps[1],
        sites: hashProps[2],
        status: hashProps[3],
        query: hashProps[4] || ''
      };
    } else {
      // opening a form
      propMapping = {
        component: hashProps[0],
        instance: hashProps[1],
        path: hashProps[2]
      };
    }

    return propMapping;
  } else {
    return null;
  }
}
