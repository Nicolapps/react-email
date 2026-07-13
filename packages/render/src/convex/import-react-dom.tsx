import * as reactDOMServer from 'react-dom/server';

// The Convex runtime does not support dynamic imports in queries and
// mutations, so we import react-dom/server statically here.
//
// (Unfortunately, this fix also applies to Convex-runtime actions,
// where dynamic imports are supported.)
//
// The performance impact of a static import is expected to be acceptable:
// when running a Convex function, Convex only loads the code
// used by the relevant module (i.e. JavaScript file where the function
// is defined). For functions that render emails, it is very likely that the
// dynamic import of react-dom/server would have happened at some point.
export const importReactDom = () => Promise.resolve(reactDOMServer);
