module.exports = function () {
  function constructor(el) {
    this.el = el;
  }

  constructor.prototype = {};
  return constructor;
};
