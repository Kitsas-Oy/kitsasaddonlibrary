import test from 'ava';

import { KitsasAddon } from './kitsasAddon';

test('Create a Kitsas Addon', (t) => {
  const addon = new KitsasAddon({ appName: 'TestApp' });
  t.is(addon.getApp().locals.appName, 'TestApp');
});
