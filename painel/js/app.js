const API_BASE = 'http://localhost:3000';

function apiUrl(path) {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) {
    throw new Error(`GET ${path} -> ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body = {}) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`POST ${path} -> ${res.status}`);
  }
  return res.json();
}

async function apiPut(path, body = {}) {
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} -> ${res.status}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(apiUrl(path), {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`DELETE ${path} -> ${res.status}`);
  }
  return res.json();
}

function goTo(page) {
  if (!page) return;
  if (page.startsWith('http://') || page.startsWith('https://') || page.startsWith('/')) {
    window.location.href = page;
    return;
  }
  window.location.href = page;
}

function bindMenuLinks(root = document) {
  const elements = root.querySelectorAll('[data-go]');
  elements.forEach((el) => {
    if (el.dataset.bound === '1') return;
    el.dataset.bound = '1';

    el.style.cursor = 'pointer';

    el.addEventListener('click', (e) => {
      const noNav = e.target.closest('[data-no-nav="1"]');
      if (noNav) return;

      const page = el.dataset.go;
      if (page) goTo(page);
    });
  });
}

function openDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('show');
}

function closeDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

function bindDrawer() {
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('drawerOverlay');
  const closeBtn = document.getElementById('drawerClose');

  if (menuBtn && menuBtn.dataset.bound !== '1') {
    menuBtn.dataset.bound = '1';
    menuBtn.addEventListener('click', openDrawer);
  }

  if (overlay && overlay.dataset.bound !== '1') {
    overlay.dataset.bound = '1';
    overlay.addEventListener('click', closeDrawer);
  }

  if (closeBtn && closeBtn.dataset.bound !== '1') {
    closeBtn.dataset.bound = '1';
    closeBtn.addEventListener('click', closeDrawer);
  }
}

function badge(value) {
  return Number(value || 0);
}

function renderCredits(containerId, stats = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="credits-grid">
      <div class="credit-pill">
        <span class="pill-label">ANUAL:</span>
        <span class="pill-value">${badge(stats.annualCreditsInUse)}</span>
      </div>

      <div class="credit-pill">
        <span class="pill-label">2 ANOS:</span>
        <span class="pill-value">${badge(stats.twoYearsCreditsInUse)}</span>
      </div>

      <div class="credit-pill">
        <span class="pill-label">Layouts:</span>
        <span class="pill-value">${badge(stats.totalLayouts)}</span>
      </div>

      <div class="credit-pill">
        <span class="pill-label">Apps:</span>
        <span class="pill-value">${badge(stats.totalApps)}</span>
      </div>

      <div class="credit-pill">
        <span class="pill-label">Dispositivos ativos:</span>
        <span class="pill-value">${badge(stats.activeDevices)}</span>
      </div>

      <div class="credit-pill">
        <span class="pill-label">Pendentes:</span>
        <span class="pill-value">${badge(stats.pendingDevices)}</span>
      </div>

      <div class="credit-pill">
        <span class="pill-label">Revendas:</span>
        <span class="pill-value">${badge(stats.totalResellers)}</span>
      </div>
    </div>
  `;
}

async function loadDashboardStats() {
  const creditsBox = document.getElementById('creditsBox');
  if (!creditsBox) return;

  try {
    const data = await apiGet('/dashboard');
    renderCredits('creditsBox', data);

    const layoutsCount = document.getElementById('layoutsCount');
    const appsCount = document.getElementById('appsCount');
    const devicesCount = document.getElementById('devicesCount');
    const resellersCount = document.getElementById('resellersCount');

    if (layoutsCount) layoutsCount.textContent = badge(data.totalLayouts);
    if (appsCount) appsCount.textContent = badge(data.totalApps);
    if (devicesCount) devicesCount.textContent = badge(data.totalDevices);
    if (resellersCount) resellersCount.textContent = badge(data.totalResellers);
  } catch (err) {
    console.error(err);
  }
}

function createOptionRow(text, count, page) {
  return `
    <div class="menu-item" data-go="${page}">
      <span>${text}</span>
      <span class="badge">${badge(count)}</span>
    </div>
  `;
}

async function loadLauncherSummary() {
  const launcherMenu = document.getElementById('launcherMenu');
  if (!launcherMenu) return;

  try {
    const [layouts, apps] = await Promise.all([
      apiGet('/layouts'),
      apiGet('/apps')
    ]);

    launcherMenu.innerHTML = `
      ${createOptionRow('Meus layouts', layouts.length, 'layouts.html')}
      ${createOptionRow('Meus aplicativos', apps.length, 'apps.html')}
      ${createOptionRow('Gavetas de aplicativos', 0, 'drawers.html')}
      ${createOptionRow('Meus links', 0, 'links.html')}
      ${createOptionRow('Meus banners', 0, 'banners.html')}
      ${createOptionRow('Meus planos de fundo (imagens)', 0, 'backgrounds.html')}
      ${createOptionRow('Meus packs de planos de fundo', 0, 'background-packs.html')}
      ${createOptionRow('Meus temas', 0, 'themes.html')}
    `;

    bindMenuLinks(launcherMenu);
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar menu do launcher');
  }
}

async function loadLayoutsList() {
  const list = document.getElementById('layoutsList');
  const layoutsCount = document.getElementById('layoutsCount');
  if (!list) return;

  try {
    const layouts = await apiGet('/layouts');

    if (layoutsCount) layoutsCount.textContent = layouts.length;

    if (!layouts.length) {
      list.innerHTML = `<div class="empty-box">Nenhum layout cadastrado.</div>`;
      return;
    }

    list.innerHTML = layouts.map(layout => `
      <div class="list-card">
        <div class="list-card-header">
          <div class="list-title">${layout.name || 'Sem nome'}</div>
          <div class="list-actions">
            <button class="action-btn" data-no-nav="1" onclick="editLayout('${layout.id}')">Editar</button>
            <button class="action-btn danger" data-no-nav="1" onclick="deleteLayout('${layout.id}')">Excluir</button>
          </div>
        </div>
        <div class="list-meta">
          Apps no layout: ${(layout.appObjects || []).length}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar layouts');
  }
}

async function loadAppsList() {
  const list = document.getElementById('appsList');
  const appsCount = document.getElementById('appsCount');
  if (!list) return;

  try {
    const apps = await apiGet('/apps');

    if (appsCount) appsCount.textContent = apps.length;

    if (!apps.length) {
      list.innerHTML = `<div class="empty-box">Nenhum aplicativo cadastrado.</div>`;
      return;
    }

    list.innerHTML = apps.map(app => `
      <div class="list-card">
        <div class="list-card-header">
          <div class="list-title">${app.name || 'Sem nome'}</div>
          <div class="list-actions">
            <button class="action-btn" data-no-nav="1" onclick="editApp('${app.id}')">Editar</button>
            <button class="action-btn danger" data-no-nav="1" onclick="deleteApp('${app.id}')">Excluir</button>
          </div>
        </div>
        <div class="list-meta">
          Pacote: ${app.package || '-'}<br>
          Versão: ${app.version || '-'}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar apps');
  }
}

async function loadDevicesList() {
  const list = document.getElementById('devicesList');
  const devicesCount = document.getElementById('devicesCount');
  const searchInput = document.getElementById('deviceSearch');
  if (!list) return;

  try {
    const [devices, layouts, stats] = await Promise.all([
      apiGet('/devices'),
      apiGet('/layouts'),
      apiGet('/dashboard')
    ]);

    if (devicesCount) devicesCount.textContent = devices.length;
    renderCredits('creditsBox', stats);

    let filtered = devices;
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.trim().toLowerCase();
      filtered = devices.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.code || '').toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      list.innerHTML = `<div class="empty-box">Nenhum dispositivo encontrado.</div>`;
      return;
    }

    list.innerHTML = filtered.map(device => `
      <div class="list-card">
        <div class="list-card-header">
          <div>
            <div class="list-title">${device.name || 'Sem nome'}</div>
            <div class="list-meta">
              Código: ${device.code || '-'}<br>
              Status: ${device.status || '-'}<br>
              Expira: ${device.expiresAt || '-'}<br>
              Último acesso: ${device.lastSeen || '-'}
            </div>
          </div>

          <div class="device-actions">
            <select id="layout_${device.id}" class="input">
              <option value="">Sem layout</option>
              ${layouts.map(layout => `
                <option value="${layout.id}" ${device.layout === layout.id ? 'selected' : ''}>
                  ${layout.name}
                </option>
              `).join('')}
            </select>

            <button class="action-btn" onclick="saveDeviceLayout('${device.id}')">Salvar layout</button>
            <button class="action-btn" onclick="activateDevice('${device.id}')">Ativar aparelho</button>
            <button class="action-btn danger" onclick="deactivateDevice('${device.id}')">Desativar</button>
            <button class="action-btn danger" onclick="deleteDevice('${device.id}')">Excluir cliente</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar dispositivos');
  }
}

async function loadResellersList() {
  const list = document.getElementById('resellersList');
  const resellersCount = document.getElementById('resellersCount');
  if (!list) return;

  try {
    const resellers = await apiGet('/resellers');

    if (resellersCount) resellersCount.textContent = resellers.length;

    if (!resellers.length) {
      list.innerHTML = `<div class="empty-box">Nenhuma revenda cadastrada.</div>`;
      return;
    }

    list.innerHTML = resellers.map(r => `
      <div class="list-card">
        <div class="list-card-header">
          <div>
            <div class="list-title">${r.name || '-'}</div>
            <div class="list-meta">
              Login: ${r.login || '-'}<br>
              Créditos anual: ${badge(r.annualCredits)}<br>
              Créditos 2 anos: ${badge(r.twoYearsCredits)}
            </div>
          </div>

          <div class="list-actions">
            <button class="action-btn" onclick="addCreditsPrompt('${r.id}')">Adicionar créditos</button>
            <button class="action-btn danger" onclick="deleteReseller('${r.id}')">Excluir</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar revendas');
  }
}

async function saveDeviceLayout(deviceId) {
  try {
    const select = document.getElementById(`layout_${deviceId}`);
    const layout = select ? select.value : null;

    await apiPut(`/devices/${deviceId}`, { layout: layout || null });
    alert('Layout salvo com sucesso');
    loadDevicesList();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar layout do aparelho');
  }
}

async function activateDevice(deviceId) {
  try {
    const select = document.getElementById(`layout_${deviceId}`);
    const layoutId = select ? select.value : null;

    await apiPost(`/devices/${deviceId}/activate`, {
      type: 'annual',
      layoutId: layoutId || null
    });

    alert('Aparelho ativado com sucesso');
    loadDevicesList();
  } catch (err) {
    console.error(err);
    alert('Erro ao ativar aparelho');
  }
}

async function deactivateDevice(deviceId) {
  try {
    await apiPost(`/devices/${deviceId}/deactivate`, {});
    alert('Aparelho desativado');
    loadDevicesList();
  } catch (err) {
    console.error(err);
    alert('Erro ao desativar aparelho');
  }
}

async function deleteDevice(deviceId) {
  if (!confirm('Deseja excluir este cliente/aparelho?')) return;

  try {
    await apiDelete(`/devices/${deviceId}`);
    alert('Cliente excluído');
    loadDevicesList();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir cliente');
  }
}

async function deleteLayout(layoutId) {
  if (!confirm('Deseja excluir este layout?')) return;

  try {
    await apiDelete(`/layouts/${layoutId}`);
    alert('Layout excluído');
    loadLayoutsList();
    loadDashboardStats();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir layout');
  }
}

async function deleteApp(appId) {
  if (!confirm('Deseja excluir este app?')) return;

  try {
    await apiDelete(`/apps/${appId}`);
    alert('App excluído');
    loadAppsList();
    loadDashboardStats();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir app');
  }
}

function editLayout(layoutId) {
  alert(`Editar layout: ${layoutId}\n\nAgora a base está pronta. Na próxima etapa eu te entrego a tela completa de edição igual ao painel modelo.`);
}

function editApp(appId) {
  alert(`Editar app: ${appId}\n\nAgora a base está pronta. Na próxima etapa eu te entrego a tela completa de edição igual ao painel modelo.`);
}

async function deleteReseller(resellerId) {
  if (!confirm('Deseja excluir esta revenda?')) return;

  try {
    await apiDelete(`/resellers/${resellerId}`);
    alert('Revenda excluída');
    loadResellersList();
    loadDashboardStats();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir revenda');
  }
}

async function addCreditsPrompt(resellerId) {
  const annual = prompt('Quantos créditos ANUAL deseja adicionar?', '1');
  if (annual === null) return;

  const twoYears = prompt('Quantos créditos de 2 ANOS deseja adicionar?', '0');
  if (twoYears === null) return;

  try {
    await apiPost(`/resellers/${resellerId}/add-credits`, {
      annual: Number(annual || 0),
      twoYears: Number(twoYears || 0)
    });

    alert('Créditos adicionados');
    loadResellersList();
  } catch (err) {
    console.error(err);
    alert('Erro ao adicionar créditos');
  }
}

function bootPage() {
  bindMenuLinks();
  bindDrawer();
  loadDashboardStats();

  const page = window.location.pathname.split('/').pop();

  if (page === 'dashboard.html') {
    loadDashboardStats();
  }

  if (page === 'glauncher.html') {
    loadDashboardStats();
    loadLauncherSummary();
  }

  if (page === 'layouts.html') {
    loadLayoutsList();
  }

  if (page === 'apps.html') {
    loadAppsList();
  }

  if (page === 'devices.html') {
    loadDevicesList();

    const searchBtn = document.getElementById('deviceRefreshBtn');
    const searchInput = document.getElementById('deviceSearch');

    if (searchBtn && searchBtn.dataset.bound !== '1') {
      searchBtn.dataset.bound = '1';
      searchBtn.addEventListener('click', loadDevicesList);
    }

    if (searchInput && searchInput.dataset.bound !== '1') {
      searchInput.dataset.bound = '1';
      searchInput.addEventListener('input', loadDevicesList);
    }
  }

  if (page === 'resellers.html') {
    loadResellersList();

    const saveBtn = document.getElementById('saveResellerBtn');
    if (saveBtn && saveBtn.dataset.bound !== '1') {
      saveBtn.dataset.bound = '1';
      saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('resellerName')?.value?.trim() || '';
        const login = document.getElementById('resellerLogin')?.value?.trim() || '';
        const password = document.getElementById('resellerPassword')?.value?.trim() || '';

        if (!name || !login || !password) {
          alert('Preencha nome, login e senha');
          return;
        }

        try {
          await apiPost('/resellers', { name, login, password });
          alert('Revenda salva');
          document.getElementById('resellerName').value = '';
          document.getElementById('resellerLogin').value = '';
          document.getElementById('resellerPassword').value = '';
          loadResellersList();
          loadDashboardStats();
        } catch (err) {
          console.error(err);
          alert('Erro ao salvar revenda');
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', bootPage);