const API_BASE = window.location.origin;

function authGuard() {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'index.html' && page !== '' && localStorage.getItem('painel_logado') !== '1') {
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('painel_logado');
  localStorage.removeItem('painel_user');
  window.location.href = 'index.html';
}

function apiUrl(path) {
  return path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path));
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro GET');
  return data;
}

async function apiPost(path, body = {}) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro POST');
  return data;
}

async function apiPut(path, body = {}) {
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro PUT');
  return data;
}

async function apiDelete(path) {
  const res = await fetch(apiUrl(path), { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro DELETE');
  return data;
}

async function uploadFile(route, file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(apiUrl(route), {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro upload');
  return data;
}

function safe(value, fallback = '-') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
}

function isExpired(device) {
  if (!device.expiresAt) return false;
  return new Date(device.expiresAt).getTime() < Date.now();
}

function isInactive3Days(device) {
  if (!device.lastSeen) return false;
  return Date.now() - new Date(device.lastSeen).getTime() >= 3 * 24 * 60 * 60 * 1000;
}

function getStatusDot(device) {
  if (isExpired(device)) {
    return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff4040;margin-right:8px"></span>';
  }
  if (device.active && isInactive3Days(device)) {
    return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff4040;margin-right:8px"></span>';
  }
  if (device.active) {
    return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#26d94c;margin-right:8px"></span>';
  }
  return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#999;margin-right:8px"></span>';
}

function getStatusText(device) {
  if (isExpired(device)) return 'VENCIDO';
  if (device.active && isInactive3Days(device)) return 'SEM ENTRAR 3+ DIAS';
  if (device.active) return 'ONLINE';
  return 'PENDENTE';
}

document.addEventListener('DOMContentLoaded', authGuard);