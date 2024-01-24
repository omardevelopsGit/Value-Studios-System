const publicEventEmitter = require('./multiEventEmitter.js');

module.exports = (fn) => {
  return function (...args) {
    fn(...args).catch((e) => {
      publicEventEmitter.emit('error', e);
    });
  };
};
