import { OothClient } from '../src';

describe('OothClient', () => {
  test('can construct', () => {
    const client = new OothClient({
      url: 'http://localhost:3000/auth',
      secondaryAuthMode: 'session',
    });
    expect(client).toMatchSnapshot();
  });
});
