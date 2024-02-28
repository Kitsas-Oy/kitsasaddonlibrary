# Kitsas Addon Library

Library for Kitsas Addons. See also [Template for Kitsas Addons](https://github.com/Kitsas-Oy/kitsas-addon-template) and [Kitsas Library](https://github.com/Kitsas-Oy/kitsaslibrary)

[Documentation on GitHub Pages](https://kitsas-oy.github.io/kitsasaddonlibrary/)

## Installation

```bash
npm install --save kitsas-addon-library
```

## Creating an addon

#### Create an addon instance

```typescript
import { KitsasAddon } from 'kitsas-addon-library';
const addon = new KitsasAddon({
  appName: 'My Addon',
});

export default addon;
```

Options can be configured with [AddonOptions](https://kitsas-oy.github.io/kitsasaddonlibrary/interfaces/AddonOptions.html) or environment variables.

#### Create routers

```typescript
import addon from './addon';
import { AddonCall } from 'kitsas-addon-library';
import { Request, Response } from 'express';
const router = addon.createRouter('/addon');

router.get('/', async (req: Request, res: Response) => {
  const call = new AddonCall(req);
  const logs = await call.getLogs();

  if (call.isActive()) {
    res.render('main', { logs: logs });
  } else {
    res.render('introduction');
  }
});

export default router;
```

Usually router handles get an [AddonCall](https://kitsas-oy.github.io/kitsasaddonlibrary/classes/AddonCall.html) object containing information about the call and methods to interact with the Kitsas Server.

#### Create index.ts

```typescript
import addon from './addon';

import addonRouter from './addonRouter';

void addon.start([addonRouter]);
```

Remember to include all the routers in the `start` call!
