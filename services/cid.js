/**
 * Generates a unique id on the client. Uses timestamp, random number, and increments.
 *
 */
var counter, base;

base = 'cid-' + Math.floor(Math.random() * 100) + (new Date()).getTime(); // Pretty unique base
counter = 0;

export default function () {
  counter += 1; // Increment
  return base + counter;
};
