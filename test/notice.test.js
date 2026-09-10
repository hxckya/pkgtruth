import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pointsToFrom, DEPRECATION_CUE } from '../src/notice.js';

// Every string here is a real notice seen on npm or PyPI.
test('parses the replacement out of real deprecation notices', () => {
  const cases = [
    ['Node Sass is no longer supported. Please use `sass` or `sass-embedded` instead.', 'sass'],
    ["please use 'semver'", 'semver'],
    ["please use 'tar'", 'tar'],
    ['Deprecated: Use @typescript-eslint/parser instead', '@typescript-eslint/parser'],
    ['Package unsupported. Please use the socket.io package instead.', 'socket.io'],
    ['This package is deprecated in favor of @auth0/auth0-react — the official SDK', '@auth0/auth0-react'],
    ['babel-macros has been renamed to babel-plugin-macros. Please use that package instead.', 'babel-plugin-macros'],
    ['This package has moved: use @turf/turf instead', '@turf/turf'],
    ['This is a typosquat on the popular Express package. This is not maintained', 'Express'],
    ['deprecated sklearn package, use scikit-learn instead', 'scikit-learn'],
    ['You tried to install "pytorch". The package named for PyTorch is "torch"', 'torch'],
  ];
  for (const [text, want] of cases) assert.equal(pointsToFrom(text), want, text);
});

test('returns null when no replacement is named', () => {
  for (const t of ['Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.', 'this package has been deprecated', 'Unmaintained (2022-12-08)'])
    assert.equal(pointsToFrom(t), null, t);
});

test('a class rename inside a library is not a package deprecation', () => {
  // redis3's README: the StrictRedis class was renamed; the project is a fork, not deprecated.
  const t = 'StrictRedis has been renamed to "Redis" and an alias named "StrictRedis" is provided so that users previously using StrictRedis can continue to run unchanged.';
  assert.equal(DEPRECATION_CUE.test(t), false);
});

test('package-level phrasings do count as deprecation cues', () => {
  for (const t of ['deprecated sklearn package, use scikit-learn instead', 'You tried to install "pytorch".', 'This is a typosquat on the popular Express package.', 'This package has been renamed to foo'])
    assert.equal(DEPRECATION_CUE.test(t), true, t);
});
