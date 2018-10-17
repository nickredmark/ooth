import { IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import * as React from 'react';
import { createRenderer } from 'react-test-renderer/shallow';

import provideApollo, { clear } from '../src';

const C = () => <p />;

describe('provideApollo', () => {
  beforeEach(() => {
    delete (process as any).browser;
    clear();
  });

  test('only with url', async () => {
    (process as any).browser = true;
    const hoc = provideApollo({
      url: 'http://localhost:8080',
    });
    const NC = hoc(C);
    await NC.getInitialProps({});
    const renderer = createRenderer();
    renderer.render(<NC />);
    const result = renderer.getRenderOutput();

    const NC2 = hoc(C);
    await NC2.getInitialProps({});
    const renderer2 = createRenderer();
    renderer2.render(<NC2 />);
    const result2 = renderer2.getRenderOutput();
    result2.props.client.x = true;

    expect(result.props.client).toBe(result2.props.client);
  });

  test('only with url - ssr', async () => {
    const hoc = provideApollo({
      url: 'http://localhost:8080',
    });
    const NC = hoc(C);
    await NC.getInitialProps({});
    const renderer = createRenderer();
    renderer.render(<NC />);
    const result = renderer.getRenderOutput();

    const NC2 = hoc(C);
    await NC2.getInitialProps({});
    const renderer2 = createRenderer();
    renderer2.render(<NC2 />);
    const result2 = renderer2.getRenderOutput();
    result2.props.client.x = true;

    expect(result.props.client).not.toBe(result2.props.client);
  });

  test('with fragment matcher', async () => {
    (process as any).browser = true;
    const fragmentMatcher = new IntrospectionFragmentMatcher({
      introspectionQueryResultData: {
        __schema: {
          types: [
            {
              kind: 'INTERFACE',
              name: 'Character',
              possibleTypes: [{ name: 'Jedi' }, { name: 'Droid' }],
            },
          ],
        },
      },
    });
    const hoc = provideApollo({
      url: 'http://localhost:8080',
      opts: {
        fragmentMatcher,
      },
    });
    const NC = hoc(C);
    await NC.getInitialProps({});
    const renderer = createRenderer();
    renderer.render(<NC />);
    renderer.getRenderOutput();
  });

  test('with fragment matcher - ssr', async () => {
    const fragmentMatcher = new IntrospectionFragmentMatcher({
      introspectionQueryResultData: {
        __schema: {
          types: [
            {
              kind: 'INTERFACE',
              name: 'Character',
              possibleTypes: [{ name: 'Jedi' }, { name: 'Droid' }],
            },
          ],
        },
      },
    });
    const hoc = provideApollo({
      url: 'http://localhost:8080',
      opts: {
        fragmentMatcher,
      },
    });
    const NC = hoc(C);
    await NC.getInitialProps({});
    const renderer = createRenderer();
    renderer.render(<NC />);
    renderer.getRenderOutput();
  });
});
