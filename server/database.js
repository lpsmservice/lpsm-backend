const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');

const FILES = {
  apps: path.join(DB_DIR, 'apps.json'),
  devices: path.join(DB_DIR, 'devices.json'),
  layouts: path.join(DB_DIR, 'layouts.json'),
  resellers: path.join(DB_DIR, 'resellers.json'),
  settings: path.join(DB_DIR, 'settings.json')
};

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function ensureFile(filePath, defaultValue) {
  ensureDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    return;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return;
    }
    JSON.parse(raw);
  } catch {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
  }
}

function readJson(filePath, defaultValue) {
  ensureFile(filePath, defaultValue);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return defaultValue;
  }
}

function writeJson(filePath, value) {
  ensureFile(filePath, Array.isArray(value) ? [] : {});
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function getApps() {
  return readJson(FILES.apps, []);
}

function saveApps(data) {
  writeJson(FILES.apps, Array.isArray(data) ? data : []);
}

function getDevices() {
  return readJson(FILES.devices, []);
}

function saveDevices(data) {
  writeJson(FILES.devices, Array.isArray(data) ? data : []);
}

function getLayouts() {
  return readJson(FILES.layouts, []);
}

function saveLayouts(data) {
  writeJson(FILES.layouts, Array.isArray(data) ? data : []);
}

function getResellers() {
  return readJson(FILES.resellers, []);
}

function saveResellers(data) {
  writeJson(FILES.resellers, Array.isArray(data) ? data : []);
}

function getSettings() {
  return readJson(FILES.settings, {
    companyName: 'LPSM BOX',
    fullName: '',
    cpfCnpj: '',
    email: '',
    cep: '',
    state: '',
    city: '',
    district: '',
    street: '',
    number: '',
    whatsapp: '',
    supportHours: '',
    masterPassword: '951753'
  });
}

function saveSettings(data) {
  writeJson(FILES.settings, data || {});
}

module.exports = {
  getApps,
  saveApps,
  getDevices,
  saveDevices,
  getLayouts,
  saveLayouts,
  getResellers,
  saveResellers,
  getSettings,
  saveSettings
};