"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesktopPrinterDatabase = exports.SCHEMA_SQL = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sql_js_1 = __importDefault(require("sql.js"));
exports.SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator',
  branch_code TEXT NOT NULL DEFAULT 'JPB',
  phone TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Commercial Print',
  default_rate REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Lot',
  gst_percent REAL NOT NULL DEFAULT 18
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  branch_code TEXT NOT NULL DEFAULT 'JUSTPRINT',
  order_prefix TEXT NOT NULL DEFAULT 'JPB',
  city TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  credit_limit REAL NOT NULL DEFAULT 50000,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ord_no TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_date TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  rate REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  product_code TEXT NOT NULL,
  batch_no TEXT NOT NULL,
  br_transfer INTEGER NOT NULL DEFAULT 0,
  br_rcvd INTEGER NOT NULL DEFAULT 0,
  br_despatch INTEGER NOT NULL DEFAULT 0,
  rcvd_amt REAL NOT NULL DEFAULT 0,
  bal_amt REAL NOT NULL DEFAULT 0,
  job_notes TEXT DEFAULT '',
  branch_code TEXT NOT NULL DEFAULT 'JPB',
  created_by TEXT DEFAULT 'Admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_id TEXT UNIQUE NOT NULL,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  receipt_date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  total_rcpt REAL NOT NULL DEFAULT 0,
  adjusted_amt REAL NOT NULL DEFAULT 0,
  pay_mode TEXT NOT NULL DEFAULT 'Cash',
  user_name TEXT NOT NULL DEFAULT 'Vishwanath',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_batch ON orders(batch_no);
CREATE INDEX IF NOT EXISTS idx_receipts_order ON receipts(order_id);
`;
class DesktopPrinterDatabase {
    SQL;
    db;
    dbPath;
    appRoot;
    constructor(dbFilePath, appRoot) {
        this.dbPath = dbFilePath;
        this.appRoot = appRoot;
    }
    resolveWasmPath(file) {
        const candidates = [
            path_1.default.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', file),
            path_1.default.join(this.appRoot, 'node_modules', 'sql.js', 'dist', file),
            path_1.default.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
        ];
        for (const candidate of candidates) {
            if (candidate && fs_1.default.existsSync(candidate)) {
                return candidate;
            }
        }
        return file;
    }
    async init() {
        const dir = path_1.default.dirname(this.dbPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        this.SQL = await (0, sql_js_1.default)({
            locateFile: (file) => this.resolveWasmPath(file),
        });
        if (fs_1.default.existsSync(this.dbPath)) {
            const fileBuffer = fs_1.default.readFileSync(this.dbPath);
            this.db = new this.SQL.Database(fileBuffer);
        }
        else {
            this.db = new this.SQL.Database();
        }
        this.db.run(exports.SCHEMA_SQL);
        this.seedIfEmpty();
        this.save();
    }
    save() {
        if (!this.db)
            return;
        const data = this.db.export();
        const buffer = Buffer.from(data);
        const tmpPath = `${this.dbPath}.tmp`;
        fs_1.default.writeFileSync(tmpPath, buffer);
        fs_1.default.renameSync(tmpPath, this.dbPath);
    }
    close() {
        if (this.db) {
            this.save();
            this.db.close();
        }
    }
    queryAll(sql, params = []) {
        const stmt = this.db.prepare(sql);
        if (params.length > 0) {
            stmt.bind(params);
        }
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    }
    queryOne(sql, params = []) {
        const rows = this.queryAll(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }
    run(sql, params = []) {
        this.db.run(sql, params);
    }
    seedIfEmpty() {
        const countRow = this.queryOne('SELECT COUNT(*) as cnt FROM customers');
        if (countRow && countRow.cnt > 0)
            return;
        this.db.run('BEGIN TRANSACTION');
        try {
            const branches = [
                ['JUSTPRINT', 'JustPrint Hub', 'Hubballi', '91486 08960', 1],
                ['JPB', 'Vidyasagara Main Press', 'Belagavi', '96322 99767', 1],
                ['GNG', 'Ganganagar Counter', 'Bengaluru', '98450 11223', 1],
                ['DWD', 'Dharwad Express Unit', 'Dharwad', '94481 77654', 1],
            ];
            for (const b of branches) {
                this.run('INSERT INTO branches (code, name, city, phone, is_active) VALUES (?, ?, ?, ?, ?)', b);
            }
            const users = [
                ['vishwanath', 'Vishwanath N.', 'Admin', 'JPB', '91486 08960', 1],
                ['ananya', 'Ananya Kulkarni', 'Accounts', 'JUSTPRINT', '98452 33410', 1],
                ['rajesh', 'Rajesh Deshpande', 'Operator', 'JPB', '97410 55821', 1],
                ['kiran', 'Kiran Patil', 'Despatch', 'JUSTPRINT', '99012 44189', 1],
            ];
            for (const u of users) {
                this.run('INSERT INTO users (username, full_name, role, branch_code, phone, is_active) VALUES (?, ?, ?, ?, ?, ?)', u);
            }
            const products = [
                ['ADS', 'Art Card Single Side (300 GSM)', 'Offset Print', 450, '1000 Pcs', 18],
                ['ASS', 'Art Card Double Side + Lamination', 'Offset Print', 370, '500 Pcs', 18],
                ['DIGITAL', 'Digital Multi-Color Sheet 13x19', 'Digital Print', 3190, 'Lot', 18],
                ['9*6', '9x6 Bill Book / Multi-Copy Pad', 'Commercial Binding', 4200, '20 Books', 12],
                ['VISITING', 'Matt Velvet Visiting Cards', 'Card Print', 650, '1000 Pcs', 18],
                ['BROCHURE', 'Tri-Fold Glossy Brochure 170 GSM', 'Offset Print', 2850, '1000 Pcs', 18],
                ['FLEX', 'Star Flex Banner Heavy Duty', 'Wide Format', 1200, 'Banner', 18],
            ];
            for (const p of products) {
                this.run('INSERT INTO products (code, name, category, default_rate, unit, gst_percent) VALUES (?, ?, ?, ?, ?, ?)', p);
            }
            const customers = [
                [2122, 'VIDHYA PRINTS GANGANAGAR', '96322 99767', 'JUSTPRINT', 'JPB', 'Bengaluru', '29AABCV1234D1Z5', 100000],
                [1729, 'VIDHYASAGAR KUNKANUR', '91486 08960', 'JUSTPRINT', 'JPB', 'Kunkanur', '29AAACV8821K1Z2', 150000],
                [1845, 'SHREE LAXMI GRAPHICS', '94481 22910', 'JPB', 'JPB', 'Belagavi', '29AADCS4412M1Z9', 75000],
                [1904, 'BASAVA OFFSET & BINDERS', '98455 77102', 'DWD', 'DWD', 'Dharwad', '29AAFCB9031P1Z1', 80000],
            ];
            for (const c of customers) {
                this.run('INSERT INTO customers (id, name, phone, branch_code, order_prefix, city, gstin, credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', c);
            }
            const allOrders = [
                [173243, 'JPB-18619', 1729, '2026-11-13', 1, 450, 450, 'ADS', '41539', 1, 1, 1, 450, 0, 'VIDHYASAGAR 1000 PCS Art Card 300 GSM Glossy Lamination', 'JPB'],
                [171709, 'JPB-18437', 1729, '2026-11-11', 1, 450, 450, 'ADS', '41201', 1, 1, 1, 450, 0, 'VIDHYASAGAR 1000 PCS ADS Card Standard Trim', 'JPB'],
                [171472, 'JPB-18416', 1729, '2026-11-11', 2, 450, 900, 'ADS', '41143', 1, 1, 0, 0, 900, 'VIDHYASAGAR 2000 PCS ADS Flyer Double Cut - Pending Despatch', 'JPB'],
                [171470, 'JPB-18415', 1729, '2026-11-11', 1, 450, 450, 'ADS', '41143', 1, 1, 1, 450, 0, 'VIDHYASAGAR 1000 PCS ADS Pamphlet Urgent Print', 'JPB'],
                [170349, 'JPB-18249', 1729, '2026-11-07', 1, 450, 450, 'ADS', '40841', 1, 1, 1, 450, 0, 'VIDHYASAGAR 1000 PCS ADS Gloss Finish', 'JPB'],
                [168968, 'JPB-18130', 1729, '2026-11-05', 1, 450, 450, 'ADS', '40588', 1, 1, 1, 450, 0, 'VIDHYASAGAR 1000 PCS ADS Single Side UV', 'JPB'],
                [167890, 'JPB-18011', 1729, '2026-11-04', 1, 370, 370, 'ASS', '40373', 1, 1, 1, 370, 0, 'VIDHYASAGAR 500 PCS ASS Matt Lamination', 'JPB'],
                [166278, 'JPB-17857', 1729, '2026-11-02', 1, 3190, 3190, 'DIGITAL', '39976', 1, 1, 1, 3190, 0, 'VIDHYASAGAR 100 PCS glossy Lamination & creasing center fold', 'JPB'],
                [165884, 'JPB-17808', 1729, '2026-11-02', 1, 4200, 4200, '9*6', '39946', 1, 1, 1, 4200, 0, 'VIDHYASAGAR 20 Books 9x6 Triplicate Bill Book Serialized', 'JPB'],
                [165020, 'JPB-17708', 1729, '2026-10-31', 1, 4200, 4200, '9*6', '39718', 1, 1, 1, 4200, 0, 'VIDHYASAGAR 20 Books 9x6 Duplicate Receipt Book Perforated', 'JPB'],
                [164210, 'JPB-17605', 1729, '2026-10-28', 2, 650, 1300, 'VISITING', '39512', 1, 1, 1, 1300, 0, 'VIDHYASAGAR Velvet Visiting Card Gold Foil Finish', 'JPB'],
                [163895, 'JPB-17544', 1729, '2026-10-25', 1, 2850, 2850, 'BROCHURE', '39380', 1, 1, 1, 2850, 0, 'VIDHYASAGAR Tri-Fold Brochure 170 GSM Art Paper', 'JPB'],
                [162990, 'JPB-17412', 1729, '2026-10-21', 1, 1200, 1200, 'FLEX', '39115', 1, 1, 1, 1200, 0, 'VIDHYASAGAR 8x4 Star Flex Shop Board with Eyelets', 'JPB'],
                [173410, 'JPB-18655', 2122, '2026-11-15', 2, 450, 900, 'ADS', '41602', 1, 1, 1, 900, 0, 'GANGANAGAR 2000 PCS Promotional Handbill A5', 'GNG'],
                [172905, 'JPB-18590', 2122, '2026-11-12', 1, 2200, 2200, 'DIGITAL', '41410', 1, 1, 1, 2200, 0, 'GANGANAGAR Catalog 16-Page Saddle Stitch', 'GNG'],
                [173501, 'JPB-18678', 1845, '2026-11-18', 2, 1200, 2400, 'FLEX', '41690', 1, 0, 0, 1000, 1400, 'SHREE LAXMI 10x5 Hoarding Flex + Frame Mounting', 'JPB'],
                [172840, 'JPB-18566', 1845, '2026-11-10', 1, 2850, 2850, 'BROCHURE', '41388', 1, 1, 1, 2850, 0, 'SHREE LAXMI Corporate Profile 4-Fold Matte', 'JPB'],
                [173550, 'DWD-18691', 1904, '2026-11-19', 1, 4200, 4200, '9*6', '41720', 1, 1, 0, 2000, 2200, 'BASAVA 20 Books GST Invoice Pad Numbered 1001-2000', 'DWD'],
                [172611, 'DWD-18502', 1904, '2026-11-08', 3, 650, 1950, 'VISITING', '41299', 1, 1, 1, 1950, 0, 'BASAVA Matt Laminated Spot UV Cards', 'DWD'],
            ];
            for (const o of allOrders) {
                this.run(`INSERT INTO orders (
            id, ord_no, customer_id, order_date, qty, rate, amount, product_code,
            batch_no, br_transfer, br_rcvd, br_despatch, rcvd_amt, bal_amt, job_notes, branch_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, o);
            }
            const receipts = [
                ['RCP-8812', 173243, 1729, '2026-11-13', 'Counter cash settlement', 450, 450, 'Cash', 'Vishwanath N.'],
                ['RCP-8790', 171709, 1729, '2026-11-11', 'UPI PhonePe settled', 450, 450, 'UPI', 'Ananya Kulkarni'],
                ['RCP-8775', 171470, 1729, '2026-11-11', 'Received at branch desk', 450, 450, 'Cash', 'Vishwanath N.'],
                ['RCP-8740', 170349, 1729, '2026-11-07', 'Cleared against batch 40841', 450, 450, 'UPI', 'Ananya Kulkarni'],
                ['RCP-8710', 168968, 1729, '2026-11-05', 'Paid on delivery', 450, 450, 'Cash', 'Kiran Patil'],
                ['RCP-8689', 167890, 1729, '2026-11-04', 'GPay Instant Transfer', 370, 370, 'UPI', 'Ananya Kulkarni'],
                ['RCP-8640', 166278, 1729, '2026-11-02', 'NEFT Batch 39976 Full Settlement', 3190, 3190, 'NEFT', 'Vishwanath N.'],
                ['RCP-8622', 165884, 1729, '2026-11-02', 'Cleared by cheque #40219', 4200, 4200, 'Cheque', 'Ananya Kulkarni'],
                ['RCP-8595', 165020, 1729, '2026-10-31', 'NEFT Settlement', 4200, 4200, 'NEFT', 'Vishwanath N.'],
                ['RCP-8540', 164210, 1729, '2026-10-28', 'Counter UPI', 1300, 1300, 'UPI', 'Vishwanath N.'],
                ['RCP-8511', 163895, 1729, '2026-10-25', 'Bank Transfer', 2850, 2850, 'NEFT', 'Ananya Kulkarni'],
                ['RCP-8477', 162990, 1729, '2026-10-21', 'Cash at despatch', 1200, 1200, 'Cash', 'Kiran Patil'],
                ['RCP-8820', 173410, 2122, '2026-11-15', 'UPI Ganganagar desk', 900, 900, 'UPI', 'Ananya Kulkarni'],
                ['RCP-8799', 172905, 2122, '2026-11-12', 'NEFT transfer', 2200, 2200, 'NEFT', 'Vishwanath N.'],
                ['RCP-8835', 173501, 1845, '2026-11-18', 'Advance 1000 received', 1000, 1000, 'Cash', 'Rajesh Deshpande'],
                ['RCP-8760', 172840, 1845, '2026-11-10', 'Full NEFT', 2850, 2850, 'NEFT', 'Ananya Kulkarni'],
                ['RCP-8850', 173550, 1904, '2026-11-19', 'Advance 2000 via UPI', 2000, 2000, 'UPI', 'Vishwanath N.'],
                ['RCP-8744', 172611, 1904, '2026-11-08', 'Full Cash', 1950, 1950, 'Cash', 'Kiran Patil'],
            ];
            for (const r of receipts) {
                this.run(`INSERT INTO receipts (ref_id, order_id, customer_id, receipt_date, notes, total_rcpt, adjusted_amt, pay_mode, user_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, r);
            }
            this.db.run('COMMIT');
        }
        catch (err) {
            this.db.run('ROLLBACK');
            throw err;
        }
    }
    listCustomers(search = '') {
        const trimmed = search.trim().toLowerCase();
        const sql = `
      SELECT c.*,
        COALESCE((SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id), 0) AS total_orders,
        COALESCE((SELECT SUM(o.amount) FROM orders o WHERE o.customer_id = c.id), 0) AS total_amount,
        COALESCE((SELECT SUM(o.rcvd_amt) FROM orders o WHERE o.customer_id = c.id), 0) AS total_rcvd,
        COALESCE((SELECT SUM(o.bal_amt) FROM orders o WHERE o.customer_id = c.id), 0) AS total_bal
      FROM customers c
      ${trimmed ? 'WHERE LOWER(c.name) LIKE ? OR LOWER(c.phone) LIKE ? OR CAST(c.id AS TEXT) LIKE ? OR LOWER(c.branch_code) LIKE ?' : ''}
      ORDER BY CASE WHEN c.id = 1729 THEN 0 WHEN c.id = 2122 THEN 1 ELSE 2 END, c.id DESC
    `;
        const params = trimmed ? [`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`] : [];
        return this.queryAll(sql, params);
    }
    createCustomer(data) {
        if (!data.name?.trim())
            throw new Error('Customer name is required');
        if (!data.phone?.trim())
            throw new Error('Phone number is required');
        this.run(`INSERT INTO customers (name, phone, branch_code, order_prefix, city, gstin, credit_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            data.name.trim().toUpperCase(),
            data.phone.trim(),
            (data.branch_code || 'JUSTPRINT').trim().toUpperCase(),
            (data.order_prefix || 'JPB').trim().toUpperCase(),
            (data.city || '').trim(),
            (data.gstin || '').trim().toUpperCase(),
            Number(data.credit_limit) || 50000,
        ]);
        const created = this.queryOne('SELECT * FROM customers ORDER BY id DESC LIMIT 1');
        this.save();
        return created;
    }
    updateCustomer(id, data) {
        if (!String(data.name || '').trim())
            throw new Error('Customer name is required');
        this.run(`UPDATE customers SET name = ?, phone = ?, branch_code = ?, order_prefix = ?, city = ?, gstin = ?, credit_limit = ? WHERE id = ?`, [
            String(data.name).trim().toUpperCase(),
            String(data.phone || '').trim(),
            String(data.branch_code || 'JUSTPRINT').trim().toUpperCase(),
            String(data.order_prefix || 'JPB').trim().toUpperCase(),
            String(data.city || '').trim(),
            String(data.gstin || '').trim().toUpperCase(),
            Number(data.credit_limit) || 50000,
            id,
        ]);
        this.save();
        return this.queryOne('SELECT * FROM customers WHERE id = ?', [id]);
    }
    deleteCustomer(id) {
        const orderCnt = this.queryOne('SELECT COUNT(*) as cnt FROM orders WHERE customer_id = ?', [id]);
        if (orderCnt && orderCnt.cnt > 0) {
            throw new Error(`Cannot delete customer with ${orderCnt.cnt} existing orders. Delete orders first.`);
        }
        this.run('DELETE FROM customers WHERE id = ?', [id]);
        this.save();
        return { ok: true };
    }
    listOrders(filters = {}) {
        const clauses = [];
        const params = [];
        if (filters.customerId) {
            clauses.push('o.customer_id = ?');
            params.push(filters.customerId);
        }
        if (filters.productCode) {
            clauses.push('o.product_code = ?');
            params.push(filters.productCode);
        }
        if (filters.fromDate) {
            clauses.push('o.order_date >= ?');
            params.push(filters.fromDate);
        }
        if (filters.toDate) {
            clauses.push('o.order_date <= ?');
            params.push(filters.toDate);
        }
        if (filters.batchNo) {
            clauses.push('o.batch_no = ?');
            params.push(filters.batchNo);
        }
        if (filters.pendingOnly) {
            clauses.push('(o.br_despatch = 0 OR o.bal_amt > 0)');
        }
        if (filters.search && filters.search.trim()) {
            const s = `%${filters.search.trim().toLowerCase()}%`;
            clauses.push('(LOWER(o.ord_no) LIKE ? OR CAST(o.id AS TEXT) LIKE ? OR LOWER(o.product_code) LIKE ? OR LOWER(o.batch_no) LIKE ? OR LOWER(o.job_notes) LIKE ? OR LOWER(c.name) LIKE ?)');
            params.push(s, s, s, s, s, s);
        }
        const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        return this.queryAll(`SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       ${whereSql}
       ORDER BY o.order_date DESC, o.id DESC`, params);
    }
    createOrder(data) {
        const customerId = Number(data.customer_id);
        if (!customerId)
            throw new Error('Customer is required');
        const productCode = String(data.product_code || '').trim().toUpperCase();
        if (!productCode)
            throw new Error('Product is required');
        const orderDate = String(data.order_date || '').trim();
        if (!orderDate)
            throw new Error('Order date is required');
        const qty = Math.max(1, Number(data.qty) || 1);
        const rate = Math.max(0, Number(data.rate) || 0);
        const amount = Number((qty * rate).toFixed(2));
        const initialRcvd = Math.min(amount, Math.max(0, Number(data.rcvd_amt) || 0));
        const balAmt = Number(Math.max(0, amount - initialRcvd).toFixed(2));
        const cust = this.queryOne('SELECT order_prefix, branch_code FROM customers WHERE id = ?', [customerId]);
        const prefix = cust?.order_prefix || 'JPB';
        let ordNo = String(data.ord_no || '').trim().toUpperCase();
        if (!ordNo) {
            const maxIdRow = this.queryOne('SELECT COALESCE(MAX(id), 173550) as max_id FROM orders');
            const nextNum = 18700 + ((maxIdRow?.max_id || 173550) % 10000);
            ordNo = `${prefix}-${nextNum}`;
        }
        const batchNo = String(data.batch_no || '').trim() || String(Math.floor(41700 + Math.random() * 200));
        this.db.run('BEGIN TRANSACTION');
        try {
            this.run(`INSERT INTO orders (
          ord_no, customer_id, order_date, qty, rate, amount, product_code, batch_no,
          br_transfer, br_rcvd, br_despatch, rcvd_amt, bal_amt, job_notes, branch_code, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                ordNo,
                customerId,
                orderDate,
                qty,
                rate,
                amount,
                productCode,
                batchNo,
                data.br_transfer ? 1 : 0,
                data.br_rcvd ? 1 : 0,
                data.br_despatch ? 1 : 0,
                initialRcvd,
                balAmt,
                String(data.job_notes || '').trim(),
                String(data.branch_code || cust?.branch_code || 'JPB').trim().toUpperCase(),
                String(data.created_by || 'Vishwanath N.'),
            ]);
            const created = this.queryOne('SELECT * FROM orders ORDER BY id DESC LIMIT 1');
            if (created && initialRcvd > 0) {
                const refId = `RCP-${Math.floor(9000 + (created.id % 90000))}`;
                this.run(`INSERT INTO receipts (ref_id, order_id, customer_id, receipt_date, notes, total_rcpt, adjusted_amt, pay_mode, user_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    refId,
                    created.id,
                    customerId,
                    orderDate,
                    'Initial payment on order booking',
                    initialRcvd,
                    initialRcvd,
                    String(data.pay_mode || 'Cash'),
                    String(data.created_by || 'Vishwanath N.'),
                ]);
            }
            this.db.run('COMMIT');
            this.save();
            return this.queryOne('SELECT o.*, c.name AS customer_name, c.phone AS customer_phone FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = ?', [created.id]);
        }
        catch (err) {
            this.db.run('ROLLBACK');
            throw err;
        }
    }
    updateOrder(id, data) {
        const existing = this.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
        if (!existing)
            throw new Error('Order not found');
        const qty = data.qty !== undefined ? Math.max(1, Number(data.qty)) : Number(existing.qty);
        const rate = data.rate !== undefined ? Math.max(0, Number(data.rate)) : Number(existing.rate);
        const amount = Number((qty * rate).toFixed(2));
        const balAmt = Number(Math.max(0, amount - Number(existing.rcvd_amt)).toFixed(2));
        this.run(`UPDATE orders SET
        ord_no = ?, order_date = ?, qty = ?, rate = ?, amount = ?,
        product_code = ?, batch_no = ?, br_transfer = ?, br_rcvd = ?,
        br_despatch = ?, bal_amt = ?, job_notes = ?, branch_code = ?
       WHERE id = ?`, [
            data.ord_no !== undefined ? String(data.ord_no).trim().toUpperCase() : String(existing.ord_no),
            data.order_date !== undefined ? String(data.order_date) : String(existing.order_date),
            qty,
            rate,
            amount,
            data.product_code !== undefined ? String(data.product_code).trim().toUpperCase() : String(existing.product_code),
            data.batch_no !== undefined ? String(data.batch_no).trim() : String(existing.batch_no),
            data.br_transfer !== undefined ? (data.br_transfer ? 1 : 0) : Number(existing.br_transfer),
            data.br_rcvd !== undefined ? (data.br_rcvd ? 1 : 0) : Number(existing.br_rcvd),
            data.br_despatch !== undefined ? (data.br_despatch ? 1 : 0) : Number(existing.br_despatch),
            balAmt,
            data.job_notes !== undefined ? String(data.job_notes).trim() : String(existing.job_notes || ''),
            data.branch_code !== undefined ? String(data.branch_code).trim().toUpperCase() : String(existing.branch_code),
            id,
        ]);
        this.save();
        return this.queryOne('SELECT o.*, c.name AS customer_name, c.phone AS customer_phone FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = ?', [id]);
    }
    deleteOrder(id) {
        this.run('DELETE FROM orders WHERE id = ?', [id]);
        this.save();
        return { ok: true };
    }
    listReceipts(orderId, customerId) {
        const clauses = [];
        const params = [];
        if (orderId) {
            clauses.push('r.order_id = ?');
            params.push(orderId);
        }
        if (customerId) {
            clauses.push('r.customer_id = ?');
            params.push(customerId);
        }
        const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        return this.queryAll(`SELECT r.*, o.ord_no, c.name AS customer_name
       FROM receipts r
       JOIN orders o ON o.id = r.order_id
       JOIN customers c ON c.id = r.customer_id
       ${whereSql}
       ORDER BY r.receipt_date DESC, r.id DESC`, params);
    }
    createReceipt(data) {
        const orderId = Number(data.order_id);
        const order = this.queryOne('SELECT id, customer_id FROM orders WHERE id = ?', [orderId]);
        if (!order)
            throw new Error('Order not found');
        const amountPaid = Math.max(0.01, Number(data.total_rcpt) || 0);
        const adjusted = data.adjusted_amt !== undefined ? Number(data.adjusted_amt) : amountPaid;
        const refId = `RCP-${Math.floor(1000 + Math.random() * 89999)}`;
        this.db.run('BEGIN TRANSACTION');
        try {
            this.run(`INSERT INTO receipts (ref_id, order_id, customer_id, receipt_date, notes, total_rcpt, adjusted_amt, pay_mode, user_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                refId,
                order.id,
                order.customer_id,
                String(data.receipt_date),
                String(data.notes || 'Payment received').trim(),
                amountPaid,
                adjusted,
                String(data.pay_mode || 'Cash'),
                String(data.user_name || 'Vishwanath N.'),
            ]);
            this.recalculateOrderBalance(order.id);
            this.db.run('COMMIT');
            this.save();
            return this.queryOne('SELECT * FROM receipts ORDER BY id DESC LIMIT 1');
        }
        catch (err) {
            this.db.run('ROLLBACK');
            throw err;
        }
    }
    deleteReceipt(id) {
        const existing = this.queryOne('SELECT order_id FROM receipts WHERE id = ?', [id]);
        if (!existing)
            throw new Error('Receipt not found');
        this.db.run('BEGIN TRANSACTION');
        try {
            this.run('DELETE FROM receipts WHERE id = ?', [id]);
            this.recalculateOrderBalance(existing.order_id);
            this.db.run('COMMIT');
            this.save();
            return { ok: true };
        }
        catch (err) {
            this.db.run('ROLLBACK');
            throw err;
        }
    }
    recalculateOrderBalance(orderId) {
        const sumRow = this.queryOne('SELECT COALESCE(SUM(adjusted_amt), 0) AS total_adj FROM receipts WHERE order_id = ?', [orderId]);
        const orderRow = this.queryOne('SELECT amount FROM orders WHERE id = ?', [orderId]);
        if (!orderRow)
            return;
        const rcvd = Number((sumRow?.total_adj || 0).toFixed(2));
        const bal = Number(Math.max(0, orderRow.amount - rcvd).toFixed(2));
        this.run('UPDATE orders SET rcvd_amt = ?, bal_amt = ? WHERE id = ?', [rcvd, bal, orderId]);
    }
    listProducts() {
        return this.queryAll('SELECT * FROM products ORDER BY code ASC');
    }
    createProduct(data) {
        const code = String(data.code || '').trim().toUpperCase();
        const name = String(data.name || '').trim();
        if (!code || !name)
            throw new Error('Product code and name are required');
        this.run('INSERT INTO products (code, name, category, default_rate, unit, gst_percent) VALUES (?, ?, ?, ?, ?, ?)', [
            code,
            name,
            String(data.category || 'Commercial Print').trim(),
            Number(data.default_rate) || 0,
            String(data.unit || 'Lot').trim(),
            Number(data.gst_percent) ?? 18,
        ]);
        this.save();
        return this.queryOne('SELECT * FROM products ORDER BY id DESC LIMIT 1');
    }
    updateProduct(id, data) {
        this.run('UPDATE products SET code = ?, name = ?, category = ?, default_rate = ?, unit = ?, gst_percent = ? WHERE id = ?', [
            String(data.code || '').trim().toUpperCase(),
            String(data.name || '').trim(),
            String(data.category || '').trim(),
            Number(data.default_rate) || 0,
            String(data.unit || '').trim(),
            Number(data.gst_percent) ?? 18,
            id,
        ]);
        this.save();
        return this.queryOne('SELECT * FROM products WHERE id = ?', [id]);
    }
    deleteProduct(id) {
        this.run('DELETE FROM products WHERE id = ?', [id]);
        this.save();
        return { ok: true };
    }
    listBranches() {
        return this.queryAll('SELECT * FROM branches ORDER BY id ASC');
    }
    createBranch(data) {
        const code = String(data.code || '').trim().toUpperCase();
        const name = String(data.name || '').trim();
        if (!code || !name)
            throw new Error('Branch code and name are required');
        this.run('INSERT INTO branches (code, name, city, phone, is_active) VALUES (?, ?, ?, ?, 1)', [
            code,
            name,
            String(data.city || '').trim(),
            String(data.phone || '').trim(),
        ]);
        this.save();
        return this.queryOne('SELECT * FROM branches ORDER BY id DESC LIMIT 1');
    }
    updateBranch(id, data) {
        this.run('UPDATE branches SET code = ?, name = ?, city = ?, phone = ?, is_active = ? WHERE id = ?', [
            String(data.code || '').trim().toUpperCase(),
            String(data.name || '').trim(),
            String(data.city || '').trim(),
            String(data.phone || '').trim(),
            data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
            id,
        ]);
        this.save();
        return this.queryOne('SELECT * FROM branches WHERE id = ?', [id]);
    }
    deleteBranch(id) {
        this.run('DELETE FROM branches WHERE id = ?', [id]);
        this.save();
        return { ok: true };
    }
    listUsers() {
        return this.queryAll('SELECT * FROM users ORDER BY id ASC');
    }
    createUser(data) {
        const username = String(data.username || '').trim().toLowerCase();
        const fullName = String(data.full_name || '').trim();
        if (!username || !fullName)
            throw new Error('Username and full name are required');
        this.run('INSERT INTO users (username, full_name, role, branch_code, phone, is_active) VALUES (?, ?, ?, ?, ?, 1)', [
            username,
            fullName,
            String(data.role || 'Operator'),
            String(data.branch_code || 'JPB').trim().toUpperCase(),
            String(data.phone || '').trim(),
        ]);
        this.save();
        return this.queryOne('SELECT * FROM users ORDER BY id DESC LIMIT 1');
    }
    updateUser(id, data) {
        this.run('UPDATE users SET username = ?, full_name = ?, role = ?, branch_code = ?, phone = ?, is_active = ? WHERE id = ?', [
            String(data.username || '').trim().toLowerCase(),
            String(data.full_name || '').trim(),
            String(data.role || 'Operator'),
            String(data.branch_code || 'JPB').trim().toUpperCase(),
            String(data.phone || '').trim(),
            data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
            id,
        ]);
        this.save();
        return this.queryOne('SELECT * FROM users WHERE id = ?', [id]);
    }
    deleteUser(id) {
        this.run('DELETE FROM users WHERE id = ?', [id]);
        this.save();
        return { ok: true };
    }
    getDashboardSummary() {
        const totals = this.queryOne(`
      SELECT
        COUNT(*) AS totalOrdersCount,
        COALESCE(SUM(amount), 0) AS totalRevenue,
        COALESCE(SUM(rcvd_amt), 0) AS totalReceived,
        COALESCE(SUM(bal_amt), 0) AS totalOutstanding,
        COALESCE(SUM(CASE WHEN br_despatch = 0 THEN 1 ELSE 0 END), 0) AS pendingDespatchCount,
        COALESCE(SUM(CASE WHEN br_transfer = 0 THEN 1 ELSE 0 END), 0) AS pendingTransferCount
      FROM orders
    `);
        const custCount = this.queryOne('SELECT COUNT(*) AS cnt FROM customers');
        const latestDateRow = this.queryOne('SELECT MAX(order_date) AS max_date FROM orders');
        const todayStr = latestDateRow?.max_date || new Date().toISOString().slice(0, 10);
        const todayStats = this.queryOne('SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS rev FROM orders WHERE order_date = ?', [todayStr]);
        const productBreakdown = this.queryAll(`
      SELECT product_code, COUNT(*) AS order_count, COALESCE(SUM(qty), 0) AS total_qty, COALESCE(SUM(amount), 0) AS total_amount
      FROM orders GROUP BY product_code ORDER BY total_amount DESC
    `);
        const branchBreakdown = this.queryAll(`
      SELECT branch_code, COUNT(*) AS order_count, COALESCE(SUM(amount), 0) AS total_amount, COALESCE(SUM(bal_amt), 0) AS total_bal
      FROM orders GROUP BY branch_code ORDER BY total_amount DESC
    `);
        return {
            totalOrdersCount: totals?.totalOrdersCount || 0,
            totalRevenue: totals?.totalRevenue || 0,
            totalReceived: totals?.totalReceived || 0,
            totalOutstanding: totals?.totalOutstanding || 0,
            pendingDespatchCount: totals?.pendingDespatchCount || 0,
            pendingTransferCount: totals?.pendingTransferCount || 0,
            activeCustomersCount: custCount?.cnt || 0,
            todayOrdersCount: todayStats?.cnt || 0,
            todayRevenue: todayStats?.rev || 0,
            productBreakdown,
            branchBreakdown,
        };
    }
    getDbInfo() {
        const stat = fs_1.default.existsSync(this.dbPath) ? fs_1.default.statSync(this.dbPath) : { size: 0 };
        const tableNames = ['branches', 'users', 'products', 'customers', 'orders', 'receipts'];
        const tables = {};
        for (const t of tableNames) {
            const r = this.queryOne(`SELECT COUNT(*) AS cnt FROM ${t}`);
            tables[t] = r?.cnt || 0;
        }
        return {
            dbPath: this.dbPath,
            fileSizeBytes: stat.size,
            tables,
            engine: 'SQLite 3 (AppData persistent file)',
        };
    }
    exportBackupBuffer() {
        this.save();
        return Buffer.from(this.db.export());
    }
    restoreBackupBuffer(buf) {
        const testDb = new this.SQL.Database(buf);
        const check = testDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('customers', 'orders', 'receipts')");
        if (!check.length || check[0].values.length < 3) {
            testDb.close();
            throw new Error('Invalid Vidyasagara Printers SQLite backup file.');
        }
        this.db.close();
        this.db = testDb;
        this.db.run(exports.SCHEMA_SQL);
        this.save();
    }
    resetToSampleData() {
        this.db.close();
        if (fs_1.default.existsSync(this.dbPath)) {
            fs_1.default.unlinkSync(this.dbPath);
        }
        this.db = new this.SQL.Database();
        this.db.run(exports.SCHEMA_SQL);
        this.seedIfEmpty();
        this.save();
    }
}
exports.DesktopPrinterDatabase = DesktopPrinterDatabase;
