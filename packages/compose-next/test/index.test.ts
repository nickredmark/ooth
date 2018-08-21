import { Component } from 'react';
import { composeInitialProps } from '../src';

class A extends Component {
  static getInitialProps() {
    return Promise.resolve({
      a: 1,
    });
  }
}

class B extends Component {
  static getInitialProps() {
    return Promise.resolve({
      b: 2,
    });
  }
}

describe('composeInitialProps', () => {
  test('should merge initial props', async () => {
    const Composed = composeInitialProps(A)(B);

    expect(await Composed.getInitialProps()).toMatchSnapshot();
  });
});
