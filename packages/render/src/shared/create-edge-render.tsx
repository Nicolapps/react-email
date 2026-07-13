import { Suspense } from 'react';
import { createErrorBoundary } from './error-boundary';
import type { Options } from './options';
import { readStream } from './read-stream.browser';
import { pretty } from './utils/pretty';
import { stripImagePreloadLinks } from './utils/strip-image-preload-links';
import { toPlainText } from './utils/to-plain-text';
import { unstableToPlainText } from './utils/unstable-to-plain-text';

type ReactDOMServer = typeof import('react-dom/server');

export const createEdgeRender =
  (
    importReactDom: () => Promise<ReactDOMServer | { default: ReactDOMServer }>,
  ) =>
  async (element: React.ReactElement, options?: Options) => {
    const reactDOMServer = await importReactDom().then((m) => {
      if ('default' in m) {
        return m.default;
      }

      return m;
    });

    const html = await new Promise<string>((resolve, reject) => {
      const ErrorBoundary = createErrorBoundary(reject);
      reactDOMServer
        .renderToReadableStream(
          <ErrorBoundary>
            <Suspense>{element}</Suspense>
          </ErrorBoundary>,
          {
            onError(error: unknown) {
              reject(error);
            },
            progressiveChunkSize: Number.POSITIVE_INFINITY,
          },
        )
        .then(async (stream) => {
          await stream.allReady;
          return readStream(stream);
        })
        .then((result) => resolve(stripImagePreloadLinks(result)))
        .catch(reject);
    });

    if (options?.plainText) {
      return options.unstableTextConversion
        ? unstableToPlainText(html)
        : toPlainText(html, options.htmlToTextOptions);
    }

    const doctype =
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

    const document = `${doctype}${html.replace(/<!DOCTYPE.*?>/, '')}`;

    if (options?.pretty) {
      return pretty(document);
    }

    return document;
  };
