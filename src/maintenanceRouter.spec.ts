import test from 'ava';

import { KitsasAddon } from './kitsasAddon';
import { MaintenanceRouter } from './maintenanceRouter';

test('Create a maintenance router', (t) => {
  const addon = new KitsasAddon();
  const mRouter = new MaintenanceRouter(addon);

  mRouter.addFunction('test', async () => {
    console.log('test');
  });
  t.is(mRouter.hasFunction('test'), true);
});
