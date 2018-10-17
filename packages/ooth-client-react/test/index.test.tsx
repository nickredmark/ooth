import * as React from 'react';
import { create } from 'react-test-renderer';

import { OothProvider, withOoth, withUser } from '../src';
import { OothClient, User } from 'ooth-client';

class MockOothClient {
  start() {
    return Promise.resolve({ _id: 'hi' });
  }

  on() {}

  user() {
    return { _id: 'hi' };
  }
}

const C = ({ oothClient }: { oothClient: OothClient }) => {
  return <p>{typeof oothClient}</p>;
};

const D = ({ user }: { user: User }) => {
  return <p>{user._id}</p>;
};

describe('ooth-client-react', () => {
  let client: OothClient;

  beforeEach(async () => {
    client = new MockOothClient() as any;
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
