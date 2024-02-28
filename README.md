# Kitsas Addon Library

Library for Kitsas Addons. See also [Template for Kitsas Addons](https://github.com/Kitsas-Oy/kitsas-addon-template) and [Kitsas Library](https://github.com/Kitsas-Oy/kitsaslibrary)

## Installation

Clone the repository:

```bash
npm install --save kitsas-addon-library
```

## Creating an addon

Create an addon instance

```typescript
import { KitsasAddon } from 'kitsas-addon-library';
const addon = new KitsasAddon({
  appName: 'My Addon',
});

export default addon;
```

Create routers

```typescript
import addon from './addon';
import { AddonCall } from 'kitsas-addon-library';
import { Request, Response } from 'express';
const router = addon.createRouter('/');

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

Create index.ts

```typescript
import addon from './addon';

import addonRoute from './addonRouter';

void addon.start([addonRoute]);
```
