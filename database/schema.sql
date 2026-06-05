-- Usuarios
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- UUID
  email TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK(role IN ('consumer', 'merchant')),
  full_name TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Negocios
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  merchant_id TEXT,
  name TEXT,
  rfc TEXT UNIQUE,
  address TEXT,
  business_type TEXT,
  status TEXT DEFAULT 'pending',
  qr_code TEXT, -- URL o base64 del QR
  score INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(merchant_id) REFERENCES users(id)
);

-- Preguntas del autodiagnóstico NOM-251
CREATE TABLE diagnostic_questions (
  id TEXT PRIMARY KEY,
  question_text TEXT,
  category TEXT
);

-- Respuestas del diagnóstico
CREATE TABLE diagnostic_answers (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  question_id TEXT,
  answer BOOLEAN,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(business_id) REFERENCES businesses(id)
);

-- Incidentes reportados
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  reported_by TEXT, -- NULL si es anónimo
  category TEXT CHECK(category IN ('higiene', 'temperatura', 'contaminacion', 'fecha_caducidad')),
  description TEXT,
  status TEXT DEFAULT 'pending',
  merchant_response TEXT,
  reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  FOREIGN KEY(business_id) REFERENCES businesses(id)
);

-- Alertas
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  alert_type TEXT CHECK(alert_type IN ('orange', 'red')),
  is_active BOOLEAN DEFAULT 1,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY(business_id) REFERENCES businesses(id)
);

-- Decisiones de consumidores
CREATE TABLE consumer_decisions (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  consumer_id TEXT,
  decision TEXT CHECK(decision IN ('buy', 'caution', 'avoid')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(business_id) REFERENCES businesses(id),
  FOREIGN KEY(consumer_id) REFERENCES users(id)
);