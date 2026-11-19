import express from 'express';
import path from 'path';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { PrinterDatabase } from './database/sqlite.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Store database outside source tree in persistent user data folder
  const dataDir = process.env.VP_DATA_DIR || path.join(os.homedir(), '.vidyasagara-printers');
  const dbPath = path.join(dataDir, 'vidyasagara-printers.db');
  const db = new PrinterDatabase(dbPath);
  await db.init();

  app.use(express.json({ limit: '25mb' }));

  // --- API ROUTES ---
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'Vidyasagara Printers' });
  });

  app.get('/api/dashboard', (_req, res) => {
    try {
      res.json(db.getDashboardSummary());
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Customers
  app.get('/api/customers', (req, res) => {
    try {
      const search = String(req.query.search || '');
      res.json(db.listCustomers(search));
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/customers', (req, res) => {
    try {
      res.status(201).json(db.createCustomer(req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  app.put('/api/customers/:id', (req, res) => {
    try {
      res.json(db.updateCustomer(Number(req.params.id), req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/customers/:id', (req, res) => {
    try {
      res.json(db.deleteCustomer(Number(req.params.id)));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Orders
  app.get('/api/orders', (req, res) => {
    try {
      res.json(
        db.listOrders({
          customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
          search: req.query.search ? String(req.query.search) : undefined,
          productCode: req.query.productCode ? String(req.query.productCode) : undefined,
          fromDate: req.query.fromDate ? String(req.query.fromDate) : undefined,
          toDate: req.query.toDate ? String(req.query.toDate) : undefined,
          pendingOnly: req.query.pendingOnly === '1' || req.query.pendingOnly === 'true',
          batchNo: req.query.batchNo ? String(req.query.batchNo) : undefined,
        })
      );
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/orders', (req, res) => {
    try {
      res.status(201).json(db.createOrder(req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  app.put('/api/orders/:id', (req, res) => {
    try {
      res.json(db.updateOrder(Number(req.params.id), req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    try {
      res.json(db.deleteOrder(Number(req.params.id)));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Receipts
  app.get('/api/receipts', (req, res) => {
    try {
      res.json(
        db.listReceipts(
          req.query.orderId ? Number(req.query.orderId) : undefined,
          req.query.customerId ? Number(req.query.customerId) : undefined
        )
      );
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/receipts', (req, res) => {
    try {
      res.status(201).json(db.createReceipt(req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/receipts/:id', (req, res) => {
    try {
      res.json(db.deleteReceipt(Number(req.params.id)));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Products
  app.get('/api/products', (_req, res) => res.json(db.listProducts()));
  app.post('/api/products', (req, res) => {
    try {
      res.status(201).json(db.createProduct(req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
  app.put('/api/products/:id', (req, res) => {
    try {
      res.json(db.updateProduct(Number(req.params.id), req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
  app.delete('/api/products/:id', (req, res) => {
    try {
      res.json(db.deleteProduct(Number(req.params.id)));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Branches
  app.get('/api/branches', (_req, res) => res.json(db.listBranches()));
  app.post('/api/branches', (req, res) => {
    try {
      res.status(201).json(db.createBranch(req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
  app.put('/api/branches/:id', (req, res) => {
    try {
      res.json(db.updateBranch(Number(req.params.id), req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
  app.delete('/api/branches/:id', (req, res) => {
    try {
      res.json(db.deleteBranch(Number(req.params.id)));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Users
  app.get('/api/users', (_req, res) => res.json(db.listUsers()));
  app.post('/api/users', (req, res) => {
    try {
      res.status(201).json(db.createUser(req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
  app.put('/api/users/:id', (req, res) => {
    try {
      res.json(db.updateUser(Number(req.params.id), req.body));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
  app.delete('/api/users/:id', (req, res) => {
    try {
      res.json(db.deleteUser(Number(req.params.id)));
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  // Database Backup & Restore
  app.get('/api/db/info', (_req, res) => {
    try {
      res.json(db.getDbInfo());
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get('/api/db/backup', (_req, res) => {
    try {
      const buf = db.exportBackupBuffer();
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="vidyasagara-printers-backup.db"');
      res.send(buf);
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/db/restore', (req, res) => {
    try {
      const { base64 } = req.body as { base64: string };
      if (!base64) throw new Error('Backup file payload missing');
      const buf = Buffer.from(base64, 'base64');
      db.restoreBackupBuffer(buf);
      res.json({ ok: true, info: db.getDbInfo() });
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  app.post('/api/db/reset', (_req, res) => {
    try {
      db.resetToSampleData();
      res.json({ ok: true, info: db.getDbInfo() });
    } catch (e: unknown) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Vite dev middleware or static production build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vidyasagara Printers server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
