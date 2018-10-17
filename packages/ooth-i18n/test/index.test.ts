import { getI18n } from '../src';

describe('ooth-i18n', () => {
  const __ = getI18n(
    {
      en: {
        foo: 'bar',
        baz: 'hello {name}',
      },
      fr: {
        foo: 'asd',
        baz: 'hi {name}',
      },
    },
    'en',
  );

  it('translates', () => {
    expect(__('foo')).toBe('bar');
  });

  it('interpolates', () => {
    expect(__('baz', { name: 'Mark' })).toBe('hello Mark');
  });

  it('uses language', () => {
    expect(__('baz', { name: 'Mark' }, 'fr')).toBe('hi Mark');
  });
});
