const { generateTempPassword } = require('../utils/helpers');

describe('generateTempPassword', () => {
  it('returns a string of the requested length', () => {
    const pwd = generateTempPassword(12);
    expect(typeof pwd).toBe('string');
    expect(pwd.length).toBe(12);
  });

  it('generates unique passwords on successive calls', () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).not.toBe(b);
  });

  it('only contains characters from the allowed set', () => {
    const allowed = new Set('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'.split(''));
    for (let i = 0; i < 20; i++) {
      const pwd = generateTempPassword();
      expect(pwd.split('').every(c => allowed.has(c))).toBe(true);
    }
  });
});
