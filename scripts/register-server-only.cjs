// Next replaces "server-only" at build time. Node has no such package, so the
// verifiers that import server modules load Next's empty stand-in instead.
const Module = process.getBuiltinModule("node:module");

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(
    this,
    request === "server-only"
      ? "next/dist/compiled/server-only/empty"
      : request,
    ...rest,
  );
};
