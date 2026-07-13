import { createEdgeRender } from '../shared/create-edge-render';
import { importReactDom } from './import-react-dom';

export const render = createEdgeRender(importReactDom);
