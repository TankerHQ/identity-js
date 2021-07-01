// require all modules ending in ".spec.js" or ".spec.web.js" from the
// current directory and all subdirectories
// @ts-expect-error
const testsContext = require.context('.', true, /\.spec(\.web)?\.ts$/);

testsContext.keys().forEach(testsContext);