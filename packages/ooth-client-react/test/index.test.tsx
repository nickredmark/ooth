import * as React from 'react';
import { OothProvider, withOoth, withUser } from '../src';
import { create } from 'react-test-renderer';

class MockOothClient {
  start() {
    return Promise.resolve({ _id: 'hi' });
  }

  user() {
    return { _id: 'hi' };
  }
}

const C = ({ oothClient }) => {
  return <p>{oothClient.user()._id}</p>;
};

const D = ({ user }) => {
  return <p>{user._id}</p>;
};

describe('ooth-client-react', () => {
  let client;

  beforeEach(async () => {
    client = new MockOothClient();
    await client.start();
  });

  test('withOoth', () => {
    const CC = withOoth(C);
    const component = create(
      <OothProvider client={client} initialUser={{ _id: 'hi' }}>
        <CC />
      </OothProvider>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('withUser', () => {
    const DD = withUser(D);
    const component = create(
      <OothProvider client={client} initialUser={{ _id: 'hi' }}>
        <DD />
      </OothProvider>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
});
