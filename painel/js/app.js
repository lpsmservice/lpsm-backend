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
  const res = await fetch(apiUrl(path), {
    method: 'DELETE'
  });
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

function bindDrawer() {
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const close = document.getElementById('drawerClose');

  if (menuBtn && drawer && overlay) {
    menuBtn.onclick = () => {
      drawer.classList.add('open');
      overlay.classList.add('show');
    };
  }

  if (close && drawer && overlay) {
    close.onclick = () => {
      drawer.classList.remove('open');
      overlay.classList.remove('show');
    };
  }

  if (overlay && drawer) {
    overlay.onclick = () => {
      drawer.classList.remove('open');
      overlay.classList.remove('show');
    };
  }
}

function setDrawerUser() {
  const user = JSON.parse(localStorage.getItem('painel_user') || '{}');
  const settingsName = localStorage.getItem('painel_company_name') || 'LAUNCHER BOX';

  const drawerUserName = document.getElementById('drawerUserName');
  const drawerUserEmail = document.getElementById('drawerUserEmail');
  const drawerAvatar = document.getElementById('drawerAvatar');

  const displayName =
    safe(user.companyName, '').trim() ||
    settingsName ||
    'LAUNCHER BOX';

  const displayEmail =
    safe(user.email, '').trim() ||
    'Painel administrativo';

  if (drawerUserName) drawerUserName.textContent = displayName;
  if (drawerUserEmail) drawerUserEmail.textContent = displayEmail;
  if (drawerAvatar) drawerAvatar.textContent = (displayName[0] || 'L').toUpperCase();
}

function formatCreditsValidity(raw) {
  if (!raw) return '--/--/----';
  try {
    return new Date(raw).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return raw;
  }
}

function getCreditsValidity(settings) {
  if (settings && settings.creditsExpiresAt) return settings.creditsExpiresAt;
  if (settings && settings.expiresAt) return settings.expiresAt;
  if (settings && settings.validUntil) return settings.validUntil;
  if (settings && settings.validadeCreditos) return settings.validadeCreditos;
  return null;
}

function getLayoutLimit(dashboard) {
  if (dashboard && dashboard.settings) {
    if (dashboard.settings.layoutLimit !== undefined) return Number(dashboard.settings.layoutLimit || 0);
    if (dashboard.settings.layoutsLimit !== undefined) return Number(dashboard.settings.layoutsLimit || 0);
    if (dashboard.settings.maxLayouts !== undefined) return Number(dashboard.settings.maxLayouts || 0);
  }
  return Number(dashboard.totalLayouts || 0);
}

function getAppsLimit(dashboard) {
  if (dashboard && dashboard.settings) {
    if (dashboard.settings.appLimit !== undefined) return Number(dashboard.settings.appLimit || 0);
    if (dashboard.settings.appsLimit !== undefined) return Number(dashboard.settings.appsLimit || 0);
    if (dashboard.settings.maxApps !== undefined) return Number(dashboard.settings.maxApps || 0);
  }
  return Number(dashboard.totalApps || 0);
}

async function loadDashboardHome() {
  const welcomeTitle = document.getElementById('welcomeTitle');
  const annualCreditsValue = document.getElementById('annualCreditsValue');
  const twoYearsCreditsValue = document.getElementById('twoYearsCreditsValue');
  const creditsValidity = document.getElementById('creditsValidity');
  const layoutLimitValue = document.getElementById('layoutLimitValue');
  const appsLimitValue = document.getElementById('appsLimitValue');

  if (!welcomeTitle) return;

  const localUser = JSON.parse(localStorage.getItem('painel_user') || '{}');

  try {
    const dashboard = await apiGet('/dashboard');
    const settings = dashboard.settings || {};

    const companyName =
      safe(settings.companyName, '').trim() ||
      safe(localUser.companyName, '').trim() ||
      'launcher box';

    localStorage.setItem('painel_company_name', companyName);

    welcomeTitle.textContent = `Bem vindo(a) ${companyName.toLowerCase()}`;

    if (annualCreditsValue) {
      annualCreditsValue.textContent = String(
        Number(settings.annualCredits ?? settings.annual ?? dashboard.annualCreditsInUse ?? 0)
      );
    }

    if (twoYearsCreditsValue) {
      twoYearsCreditsValue.textContent = String(
        Number(settings.twoYearsCredits ?? settings.twoYears ?? dashboard.twoYearsCreditsInUse ?? 0)
      );
    }

    if (creditsValidity) {
      creditsValidity.textContent = formatCreditsValidity(getCreditsValidity(settings));
    }

    if (layoutLimitValue) {
      layoutLimitValue.textContent = String(getLayoutLimit(dashboard));
    }

    if (appsLimitValue) {
      appsLimitValue.textContent = String(getAppsLimit(dashboard));
    }

    setDrawerUser();
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);

    const companyName =
      safe(localUser.companyName, '').trim() ||
      'launcher box';

    welcomeTitle.textContent = `Bem vindo(a) ${companyName.toLowerCase()}`;

    if (annualCreditsValue) annualCreditsValue.textContent = '0';
    if (twoYearsCreditsValue) twoYearsCreditsValue.textContent = '0';
    if (creditsValidity) creditsValidity.textContent = '--/--/----';
    if (layoutLimitValue) layoutLimitValue.textContent = '0';
    if (appsLimitValue) appsLimitValue.textContent = '0';

    setDrawerUser();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  authGuard();
  bindDrawer();
  setDrawerUser();
  await loadDashboardHome();
});