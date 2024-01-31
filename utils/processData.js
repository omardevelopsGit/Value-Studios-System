const processData = {};

exports.get = (key) => processData[key];

exports.set = (key, value) => (processData[key] = value);

process.on('exit', () => {
  process.exit(0);
});
