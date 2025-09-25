// ApacheAI - Intelligent Aviation Weather Briefings (MVP SPA)

const AppState = {
  route: '/',
  data: null,
  params: {},
};

const routes = {
  '/': renderLanding,
  '/plan': renderFlightPlan,
  '/briefing': renderBriefing,
};

function navigate(path, params = {}) {
  AppState.route = path;
  AppState.params = params;
  window.history.pushState({ path, params }, '', path);
  render();
}

window.onpopstate = (e) => {
  if (e.state) {
    AppState.route = e.state.path;
    AppState.params = e.state.params || {};
  } else {
    AppState.route = window.location.pathname;
  }
  render();
};

function $(sel) { return document.querySelector(sel); }

function render() {
  const app = $('#app');
  const view = routes[AppState.route] || renderLanding;
  app.innerHTML = view();
  // Trigger enter animation
  requestAnimationFrame(() => {
    const container = app.querySelector('.route');
    if (!container) return;
    container.classList.add('fade-enter');
    requestAnimationFrame(() => container.classList.add('fade-enter-active'));
  });
  attachEvents();
  if (AppState.route === '/briefing') {
    initMapIfData();
  }
}

// ---------- Views ----------
function renderLanding() {
  return `
  <main class="route min-h-screen flex flex-col items-center justify-center px-6">
    <section class="text-center max-w-4xl">
      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight">
        ApacheAI <span class="text-indigo-400">–</span> Intelligent Aviation Weather Briefings
      </h1>
      <p class="mt-4 text-lg" style="color: #ffffff;">
        Fast, readable, and predictive weather insights for safer flight decisions.
      </p>
      <div class="mt-10">
        <button id="cta-start" class="btn-shimmer glow-hover inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium shadow-lg shadow-green-900/40 transition apache-green-btn">
  Start Briefing
  <span aria-hidden="true">→</span>
</button>
      </div>
    </section>

    <section class="mt-14 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full max-w-6xl">
      ${featureCard('Unified Threat Score','Condenses conditions into a single actionable index.','⚠️')}
      ${featureCard('Predictive Hazard Alerts','Proactive heads-up on convective, icing, and wind shear.','🌩️')}
      ${featureCard('Natural Language Briefings','Plain-English summaries for your route.','🗣️')}
      ${featureCard('Dynamic Anomaly Detection','Spots abnormal trends and rapid deteriorations.','📈')}
    </section>

    <div class="mt-16 text-sm" style="color: #ffffff;">MVP demo – Map and ML features are placeholders.</div>
  </main>`;
}

function featureCard(title, desc, icon) {
  return `
    <div class="card glow-hover p-5">
      <div class="flex items-start gap-3">
        <div class="text-2xl">${icon}</div>
        <div>
        <h3 class="text-lg font-semibold" style="color: var(--apache-green);">${title}</h3>
        <p class="text-sm mt-1" style="color: #ffffff;">${desc}</p>
        </div>
      </div>
    </div>
  `;
}

function renderFlightPlan() {
  return `
  <main class="route min-h-screen flex items-center justify-center px-6">
    <div class="card p-6 w-full max-w-2xl">
      <h2 class="text-2xl font-bold" style="color: var(--apache-green);">Enter Flight Plan</h2>
      <p class="mt-1" style="color: #ffffff;">Example: KRIC KJFK KORD</p>
      <div class="mt-5 flex gap-3">
        <input id="route-input" class="flex-1 rounded-xl bg-white/10 border border-white/20 focus:border-indigo-400 focus:outline-none px-4 py-3 placeholder:text-gray-400" placeholder="ICAO route (e.g., KRIC KJFK KORD)" />
        <button id="btn-generate" class="btn-shimmer glow-hover rounded-xl px-5 py-3 font-medium apache-green-btn">Generate Briefing</button>
      </div>
    </div>
  </main>`;
}

function renderBriefing() {
  const summary = AppState.data?.summary || 'No data available.';
  const legs = AppState.data?.legs || [];
  return `
  <main class="route min-h-screen px-6 py-10">
    <div class="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <section class="dialog border-hacker">
        <div class="section-title flex items-center justify-between">
          <h3 class="text-lg font-semibold">Route Summary</h3>
          <span class="text-xs opacity-70">Live</span>
        </div>
        <div class="p-3" style="color: #ffffff;">${summary}</div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          ${legs.map(renderAirportCard).join('')}
        </div>
      </section>

      <section class="dialog border-hacker p-0 overflow-hidden">
        <div class="section-title"><h3 class="text-lg font-semibold">Route Map</h3></div>
        <div id="map" style="height:540px;"></div>
      </section>

      <div class="xl:col-span-2 mt-2 flex items-center justify-between" style="color: #ffffff;">
        <div class="opacity-80">Interactive briefing</div>
        <button id="btn-back" class="rounded-lg px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/15" style="color: #ffffff;">Back</button>
      </div>
    </div>
  </main>`;
}

function renderAirportCard(apt) {
  const categoryClass = {
    VFR: 'fc-vfr',
    MVFR: 'fc-mvfr',
    IFR: 'fc-ifr',
    LIFR: 'fc-lifr',
  }[apt.category] || 'fc-vfr';

  return `
    <div class="card p-5 tooltip">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-xl font-bold tracking-wide" style="color: var(--apache-green);">${apt.icao} <span class="font-medium" style="color: #ffffff;">${apt.name}</span></div>
          <div class="mt-1" style="color: #ffffff;">${apt.metarDecoded}</div>
          <div class="mt-2" style="color: #ffffff;">TAF: ${apt.tafHighlights}</div>
        </div>
        <div class="fc-chip ${categoryClass} rounded-lg px-3 py-1 text-sm font-semibold">${apt.category}</div>
      </div>
      <div class="tooltip-content">
        <div class="font-semibold mb-1" style="color: var(--apache-green);">Raw METAR</div>
        <code class="block" style="color: #ffffff;">${escapeHtml(apt.metarRaw)}</code>
        <div class="font-semibold mt-2 mb-1" style="color: var(--apache-green);">Raw TAF</div>
        <code class="block" style="color: #ffffff;">${escapeHtml(apt.tafRaw)}</code>
      </div>
    </div>
  `;
}

// ---------- Events ----------
function attachEvents() {
  const cta = document.getElementById('cta-start');
  if (cta) cta.addEventListener('click', () => navigate('/plan'));

  const back = document.getElementById('btn-back');
  if (back) back.addEventListener('click', () => navigate('/plan'));

  const generate = document.getElementById('btn-generate');
  if (generate) generate.addEventListener('click', async () => {
    const val = /** @type {HTMLInputElement} */(document.getElementById('route-input')).value.trim();
    if (!val) return;
    try {
      showGlobalLoader(true);
      toggleFaviconSpinner(true);
      const params = new URLSearchParams({ codes: val.replace(/\s+/g, ',') });
      const resp = await fetch(`/briefing?${params.toString()}`);
      if (!resp.ok) throw new Error('Failed to fetch briefing');
      const data = await resp.json();
      AppState.data = {
        summary: data.summary,
        legs: mapReportsToLegs(data.metar_reports, data.taf_reports)
      };
      navigate('/briefing');
      // After navigating, render will call initMapIfData
    } catch (err) {
      console.error(err);
      alert('Unable to generate briefing. Please try again.');
    } finally {
      showGlobalLoader(false);
      toggleFaviconSpinner(false);
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

// Initial mount
render();

// ---------- Helpers to map API response to UI ----------
function mapReportsToLegs(metarReports = [], tafReports = []) {
  const icaoToTaf = new Map();
  for (const taf of tafReports) {
    const icao = taf.stationId || taf.icaoId || taf.icao || taf.site || '';
    if (icao) icaoToTaf.set(icao.toUpperCase(), taf);
  }
  return metarReports.map((m, idx) => {
    const icao = (m.stationId || m.icaoId || m.icao || m.site || '').toUpperCase();
    const taf = icaoToTaf.get(icao) || {};
    const category = deriveFlightCategory(m);
    return {
      icao,
      name: icao, // API doesn't provide full name; keep ICAO for now
      category,
      metarDecoded: m.rawOb || m.text || '—',
      tafHighlights: extractTafHighlights(taf),
      metarRaw: m.rawOb || '—',
      tafRaw: taf.rawTAF || '—',
      coords: deriveCoords(m)
    };
  });
}

function deriveFlightCategory(metar) {
  const fltcat = (metar && metar.fltcat) || '';
  if (['VFR','MVFR','IFR','LIFR'].includes(fltcat)) return fltcat;
  return 'VFR';
}

function extractTafHighlights(taf) {
  const raw = taf && (taf.rawTAF || taf.text);
  if (!raw) return '—';
  // Simple heuristic summary
  if (/OVC00\d|BKN00\d/.test(raw)) return 'Low ceilings likely';
  if (/SHRA|TS/.test(raw)) return 'Showers or storms possible';
  if (/BR|FG/.test(raw)) return 'Reduced visibility possible';
  return 'No significant changes expected';
}

// ---------- Global loader + favicon spinner ----------
function showGlobalLoader(show) {
  const el = document.getElementById('global-loader');
  if (!el) return;
  el.style.display = show ? 'flex' : 'none';
}

const FAVICON_IDLE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23000000'/%3E%3Cpath d='M8 18c4-6 12-6 16 0' stroke='%2300ff85' stroke-width='2' fill='none'/%3E%3Ccircle cx='16' cy='14' r='3' fill='%2300ff85'/%3E%3C/svg%3E";
const FAVICON_SPIN = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3Cstyle%3E@keyframes r{from{transform:rotate(0)}to{transform:rotate(360deg)}} .s{transform-origin:16px 16px;animation:r 0.9s linear infinite}%3C/style%3E%3C/defs%3E%3Ccircle cx='16' cy='16' r='16' fill='%23000000'/%3E%3Cg class='s'%3E%3Cpath d='M16 4a12 12 0 1 1-8.49 3.51' stroke='%2300ff85' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E";
function toggleFaviconSpinner(spin) {
  const link = document.getElementById('favicon');
  if (!link) return;
  link.setAttribute('href', spin ? FAVICON_SPIN : FAVICON_IDLE);
}

// ---------- Collapsible per-airport section ----------
function togglePerAirport() {
  const content = document.querySelector('.per-airport-content');
  const btn = document.querySelector('.read-more-btn');
  if (!content || !btn) return;
  
  const isHidden = content.style.display === 'none';
  content.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? 'Read Less <<' : 'Read More >>';
}

// Make togglePerAirport globally available
window.togglePerAirport = togglePerAirport;

// ---------- Map (Leaflet) ----------
async function ensureLeaflet() {
  if (window.L) return;
  await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  await loadScript('https://cdn.jsdelivr.net/npm/leaflet.geodesic');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

function initMapIfData() {
  const container = document.getElementById('map');
  if (!container || !window.L) return;
  const legs = AppState.data?.legs || [];
  const coords = legs.map(l => l.coords).filter(Boolean);
  const center = coords[0] || [20, 0];
  const map = L.map('map').setView(center, coords.length ? 5 : 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
  const layer = L.layerGroup().addTo(map);

  // Add markers
  legs.forEach((leg) => {
    if (!leg.coords) return;
    L.marker(leg.coords).addTo(layer).bindPopup(`<b>${leg.icao}</b>`);
  });

  // Draw great-circle (curved) path between first and last if available
  if (coords.length >= 2) {
    const start = coords[0];
    const end = coords[coords.length - 1];
    const arc = generateGreatCircle(start[0], start[1], end[0], end[1], 128);
    const poly = L.polyline(arc, { color: '#4f46e5', weight: 3 }).addTo(layer);
    map.fitBounds(poly.getBounds(), { padding: [40, 40] });
  }
}

function deriveCoords(m) {
  // aviationweather.gov METAR json provides lat/lon fields when latlon=true
  const lat = m.latitude || m.lat || (m.station && m.station.lat);
  const lon = m.longitude || m.lon || (m.station && m.station.lon);
  if (typeof lat === 'number' && typeof lon === 'number') return [lat, lon];
  if (lat && lon) return [Number(lat), Number(lon)];
  return null;
}

// ---------- Great-circle helper ----------
function generateGreatCircle(lat1Deg, lon1Deg, lat2Deg, lon2Deg, numPoints = 128) {
  const lat1 = toRad(lat1Deg);
  const lon1 = toRad(lon1Deg);
  const lat2 = toRad(lat2Deg);
  const lon2 = toRad(lon2Deg);

  // Convert to Cartesian on unit sphere
  const p1 = latLonToCartesian(lat1, lon1);
  const p2 = latLonToCartesian(lat2, lon2);

  // Angle between vectors
  const omega = Math.acos(Math.max(-1, Math.min(1, dot(p1, p2))));
  if (omega === 0) return [[lat1Deg, lon1Deg], [lat2Deg, lon2Deg]];

  const sinOmega = Math.sin(omega);
  const coords = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const s1 = Math.sin((1 - t) * omega) / sinOmega;
    const s2 = Math.sin(t * omega) / sinOmega;
    const x = s1 * p1[0] + s2 * p2[0];
    const y = s1 * p1[1] + s2 * p2[1];
    const z = s1 * p1[2] + s2 * p2[2];
    const latlon = cartesianToLatLon([x, y, z]);
    coords.push([toDeg(latlon[0]), normalizeLonDeg(toDeg(latlon[1]))]);
  }
  return coords;
}

function latLonToCartesian(lat, lon) {
  const cosLat = Math.cos(lat);
  return [
    cosLat * Math.cos(lon),
    cosLat * Math.sin(lon),
    Math.sin(lat),
  ];
}

function cartesianToLatLon([x, y, z]) {
  const hyp = Math.hypot(x, y);
  const lat = Math.atan2(z, hyp);
  const lon = Math.atan2(y, x);
  return [lat, lon];
}

function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }
function normalizeLonDeg(lon) {
  // normalize to [-180, 180)
  let L = lon;
  while (L < -180) L += 360;
  while (L >= 180) L -= 360;
  return L;
}

