/**
 * Jest transform for .vue files: @vue/vue2-jest, loaded without a global
 * MessageChannel.
 *
 * vue2-jest requires vue and vue-template-compiler in the Jest process itself.
 * Vue 2.5 picks its nextTick scheduler when it is first required: if a global
 * MessageChannel exists it opens a port with an onmessage handler, and that
 * port keeps Node's event loop alive, so Jest never exits after the run.
 * Node 15+ has a global MessageChannel; Node 14 (where these tests used to run)
 * didn't, so Vue fell back to setImmediate. Hiding it while vue2-jest loads
 * restores the Node 14 behavior without changing the Vue version kiln ships.
 */
const { MessageChannel } = globalThis;

delete globalThis.MessageChannel;

try {
  module.exports = require('@vue/vue2-jest');
} finally {
  globalThis.MessageChannel = MessageChannel;
}
