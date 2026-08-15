import { test, mock, beforeEach, before, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('MidiService Mapping Logic', () => {
  let store: Record<string, string> = {};
  let DynamicMidiService: any;

  before(async () => {
    // Setup minimal global localStorage before importing so module instantiation doesn't throw
    (global as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    };

    const module = await import('./MidiService.ts');
    DynamicMidiService = module.DynamicMidiService;
  });

  beforeEach(() => {
    store = {};
    (global as any).localStorage = {
      getItem: mock.fn((key: string) => store[key] || null),
      setItem: mock.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: mock.fn((key: string) => {
        delete store[key];
      }),
      clear: mock.fn(() => {
        store = {};
      }),
      length: 0,
      key: mock.fn((index: number) => null)
    };
  });

  test('loads mappings from localStorage successfully on instantiation', () => {
    store['extreamix_midi_mappings'] = JSON.stringify({ 'param1': 14, 'param2': 42 });

    const service = new DynamicMidiService();

    assert.equal(service.getMapping('param1'), 14);
    assert.equal(service.getMapping('param2'), 42);
    assert.deepEqual(service.getAllMappings(), { 'param1': 14, 'param2': 42 });

    assert.strictEqual(((global as any).localStorage.getItem as any).mock.calls.length, 1);
  });

  test('handles invalid JSON in localStorage safely on instantiation', (t) => {
    t.mock.method(console, 'warn', () => {});
    store['extreamix_midi_mappings'] = 'invalid_json';

    const service = new DynamicMidiService();

    // Should warn and not crash, mappings should be empty
    assert.deepEqual(service.getAllMappings(), {});
    assert.strictEqual((console.warn as any).mock.calls.length, 1);
  });

  test('saves mapping successfully and writes correctly to mock localStorage', () => {
    const service = new DynamicMidiService();

    service.saveMapping('param3', 99);

    assert.equal(service.getMapping('param3'), 99);
    assert.equal(store['extreamix_midi_mappings'], JSON.stringify({ 'param3': 99 }));
    assert.strictEqual(((global as any).localStorage.setItem as any).mock.calls.length, 1);
  });

  test('handles localStorage setItem throwing an error safely', (t) => {
    t.mock.method(console, 'warn', () => {});
    const service = new DynamicMidiService();

    (global as any).localStorage.setItem = mock.fn(() => { throw new Error('QuotaExceededError'); });

    // Should warn and not crash
    service.saveMapping('param4', 127);

    assert.equal(service.getMapping('param4'), 127); // memory is updated
    assert.strictEqual((console.warn as any).mock.calls.length, 1); // warning emitted
  });
});
