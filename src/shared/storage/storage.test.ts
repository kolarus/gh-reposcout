import { createMMKV } from 'react-native-mmkv';

import { toStateStorage } from './storage';

describe('toStateStorage', () => {
  it('round-trips values through MMKV (in-memory mock under Jest)', () => {
    const storage = toStateStorage(createMMKV({ id: 'storage-test' }));

    expect(storage.getItem('key')).toBeNull();
    void storage.setItem('key', 'value');
    expect(storage.getItem('key')).toBe('value');
    void storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });
});
