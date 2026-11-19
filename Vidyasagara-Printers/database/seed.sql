-- Initial reference data seeded automatically on first launch by electron/database.ts
-- Stored persistently at: %APPDATA%\Vidyasagara Printers\vidyasagara-printers.db (Windows)

INSERT OR IGNORE INTO branches (code, name, city, phone, is_active) VALUES
  ('JUSTPRINT', 'JustPrint Hub', 'Hubballi', '91486 08960', 1),
  ('JPB', 'Vidyasagara Main Press', 'Belagavi', '96322 99767', 1),
  ('GNG', 'Ganganagar Counter', 'Bengaluru', '98450 11223', 1),
  ('DWD', 'Dharwad Express Unit', 'Dharwad', '94481 77654', 1);

INSERT OR IGNORE INTO products (code, name, category, default_rate, unit, gst_percent) VALUES
  ('ADS', 'Art Card Single Side (300 GSM)', 'Offset Print', 450, '1000 Pcs', 18),
  ('ASS', 'Art Card Double Side + Lamination', 'Offset Print', 370, '500 Pcs', 18),
  ('DIGITAL', 'Digital Multi-Color Sheet 13x19', 'Digital Print', 3190, 'Lot', 18),
  ('9*6', '9x6 Bill Book / Multi-Copy Pad', 'Commercial Binding', 4200, '20 Books', 12),
  ('VISITING', 'Matt Velvet Visiting Cards', 'Card Print', 650, '1000 Pcs', 18),
  ('BROCHURE', 'Tri-Fold Glossy Brochure 170 GSM', 'Offset Print', 2850, '1000 Pcs', 18),
  ('FLEX', 'Star Flex Banner Heavy Duty', 'Wide Format', 1200, 'Banner', 18);
