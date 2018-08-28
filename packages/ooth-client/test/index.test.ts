import { OothClient } from '../src';

describe('OothClient', () => {
  test('can construct', () => {
    const client = new OothClient({
      oothUrl: 'http://localhost:3000/auth',
      secondaryAuthMode: 'session',
    });
    expect(client).toMatchSnapshot();
  });
});
