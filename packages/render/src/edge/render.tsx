import reactDOMServer from "react-dom/server.edge";
import { pretty } from "../node";
import type { Options } from "../shared/options";
import { toPlainText } from "../shared/utils/to-plain-text";

export const render = async (
  element: React.ReactElement,
  options?: Options,
) => {
  const html = reactDOMServer.renderToString(element);

  if (options?.plainText) {
    return toPlainText(html, options.htmlToTextOptions);
  }

  const doctype =
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

  const document = `${doctype}${html.replace(/<!DOCTYPE.*?>/, "")}`;

  if (options?.pretty) {
    return pretty(document);
  }

  return document;
};
