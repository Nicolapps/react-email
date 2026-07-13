/**
 * @vitest-environment jsdom
 */

import { Suspense, use } from 'react';
import { Preview } from '../shared/utils/testing/preview';
import { Template } from '../shared/utils/testing/template';
import { render } from './render';

type Import = typeof import('react-dom/server') & {
  default: typeof import('react-dom/server');
};

describe('render on convex', () => {
  beforeAll(() => {
    global.MessageChannel = class {
      constructor() {
        throw new Error('MessageChannel is not supported');
      }
    } as any;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('converts a React component into HTML with Next 14 error stubs', async () => {
    vi.mock('react-dom/server', async (_importOriginal) => {
      const ReactDOMServerBrowser = await vi.importActual<Import>(
        'react-dom/server.browser',
      );
      const ERROR_MESSAGE =
        'Internal Error: do not use legacy react-dom/server APIs. If you encountered this error, please open an issue on the Next.js repo.';

      return {
        ...ReactDOMServerBrowser,
        default: {
          ...ReactDOMServerBrowser,
          renderToString() {
            throw new Error(ERROR_MESSAGE);
          },
          renderToStaticMarkup() {
            throw new Error(ERROR_MESSAGE);
          },
        },
        renderToString() {
          throw new Error(ERROR_MESSAGE);
        },
        renderToStaticMarkup() {
          throw new Error(ERROR_MESSAGE);
        },
      };
    });

    const actualOutput = await render(<Template firstName="Jim" />);

    expect(actualOutput).toMatchInlineSnapshot(
      `"<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><!--$--><h1>Welcome, <!-- -->Jim<!-- -->!</h1><img alt="test" src="img/test.png"/><p>Thanks for trying our product. We&#x27;re thrilled to have you on board!</p><!--/$-->"`,
    );
  });

  it('properly handles component throw error', async () => {
    function ThrowingComponent(): React.ReactNode {
      throw new Error('This should be trown by render');
    }

    await expect(render(<ThrowingComponent />)).rejects.toThrow();
  });

  it('converts a React component into HTML', async () => {
    const actualOutput = await render(<Template firstName="Jim" />);

    expect(actualOutput).toMatchInlineSnapshot(
      `"<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><!--$--><h1>Welcome, <!-- -->Jim<!-- -->!</h1><img alt="test" src="img/test.png"/><p>Thanks for trying our product. We&#x27;re thrilled to have you on board!</p><!--/$-->"`,
    );
  });

  it('converts a React component into PlainText', async () => {
    const actualOutput = await render(<Template firstName="Jim" />, {
      plainText: true,
    });

    expect(actualOutput).toMatchInlineSnapshot(`
      "WELCOME, JIM!

      Thanks for trying our product. We're thrilled to have you on board!"
    `);
  });

  it('converts to plain text and removes reserved ID', async () => {
    const actualOutput = await render(<Preview />, {
      plainText: true,
    });

    expect(actualOutput).toMatchInlineSnapshot(
      `"THIS SHOULD BE RENDERED IN PLAIN TEXT"`,
    );
  });

  it('waits for Suspense boundaries to resolve before resolving', async () => {
    const htmlPromise = new Promise<string>((resolve) =>
      setTimeout(() => resolve('<p>content rendered after suspension</p>'), 50),
    );
    const EmailTemplate = () => {
      const html = use(htmlPromise);
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    const renderedTemplate = await render(
      <Suspense>
        <EmailTemplate />
      </Suspense>,
    );

    expect(renderedTemplate).not.toContain('$RC');
    expect(renderedTemplate).not.toContain('<!--$?-->');
    expect(renderedTemplate).toContain('content rendered after suspension');
  });
});
