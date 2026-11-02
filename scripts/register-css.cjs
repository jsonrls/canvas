// Node's markup verifiers do not render styles. Next handles CSS in the app;
// browser checks, not this loader, verify the actual cascade and geometry.
require.extensions[".css"] = (module) => {
  module.exports = {};
};
