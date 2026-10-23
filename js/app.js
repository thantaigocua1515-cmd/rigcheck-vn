/*
 * RigCheck VN — Logic ứng dụng (bản tĩnh, không cần build step)
 * Dữ liệu: ưu tiên Supabase (nếu đã cấu hình trong js/supabase-config.js),
 * lỗi/chưa cấu hình thì fallback về dữ liệu nhúng js/data.js.
 */
(function () {
  'use strict';

  var DATA = window.RIGCHECK_DATA;
  var FORM_ORDER = { ITX: 1, mATX: 2, ATX: 3 };

  // Hồ sơ yêu cầu (req) của phần mềm theo bản nhúng — dùng để gắn vào dữ liệu sống
  // từ Supabase khi bảng software_apps chưa có cột req (xem loadFromSupabase).
  var EMBEDDED_SW_REQ = {};
  (DATA.software || []).forEach(function (s) { if (s.req) EMBEDDED_SW_REQ[s.id] = s.req; });

  function statsHtml() {
    var aiCount = DATA.aiModels ? DATA.aiModels.length : 0;
    return '<div class="stat"><b>' + CATEGORIES.reduce(function (s, c) { return s + DATA[c.key].length; }, 0) + '</b><small>linh kiện PC</small></div>' +
      '<div class="stat"><b>' + DATA.laptops.length + '</b><small>mẫu laptop gaming</small></div>' +
      '<div class="stat"><b>' + DATA.games.length + '</b><small>game hỗ trợ check FPS</small></div>' +
      '<div class="stat"><b>' + (DATA.software.length + aiCount) + '</b><small>' + DATA.software.length + ' phần mềm &amp; ' + aiCount + ' model AI</small></div>';
  }

  var CATEGORIES = [
    { key: 'cpus',       label: 'CPU',        singular: 'CPU' },
    { key: 'gpus',       label: 'GPU (Card đồ hoạ)', singular: 'GPU' },
    { key: 'mainboards', label: 'Mainboard',  singular: 'Mainboard' },
    { key: 'rams',       label: 'RAM',        singular: 'RAM' },
    { key: 'ssds',       label: 'SSD',        singular: 'SSD' },
    { key: 'psus',       label: 'Nguồn (PSU)', singular: 'PSU' },
    { key: 'cases',      label: 'Case',       singular: 'Case' },
    { key: 'coolers',    label: 'Tản nhiệt',  singular: 'Tản nhiệt' },
  ];

  // Build mặc định: cấu hình khuyên dùng 2K
  var selected = {
    cpus: 'r5-7500f', gpus: 'rtx4070', mainboards: 'b650-toma', rams: 'ram-d5-32-6000',
    ssds: 'ssd-990pro-1t', psus: 'psu-750', cases: 'case-h5flow', coolers: 'cool-pa120',
  };

  var fpsState = { gameId: 'cyberpunk' };

  /* ---------- Tiện ích ---------- */
  function $(id) { return document.getElementById(id); }
  function fmt(n) { return n.toLocaleString('vi-VN') + '₫'; }
  function findById(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function part(key) { return findById(DATA[key], selected[key]); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + name); });
    if (name === 'software') renderSoftwareBuild();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Tab Build: picker ---------- */
  function sortedFiltered(list) {
    var q = ($('partSearch').value || '').toLowerCase().trim();
    var out = list.filter(function (x) { return !q || x.name.toLowerCase().indexOf(q) !== -1; });
    var mode = $('partSort').value;
    if (mode === 'price-asc') out = out.slice().sort(function (a, b) { return a.price - b.price; });
    if (mode === 'price-desc') out = out.slice().sort(function (a, b) { return b.price - a.price; });
    if (mode === 'name') out = out.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    return out;
  }

  function renderPickers() {
    var html = '';
    CATEGORIES.forEach(function (cat) {
      var items = sortedFiltered(DATA[cat.key]);
      html += '<div class="part-row"><div class="part-cat">' + cat.label + '</div><div><select data-cat="' + cat.key + '" aria-label="' + cat.label + '">';
      if (!items.length) html += '<option value="">— Không có kết quả —</option>';
      items.forEach(function (x) {
        html += '<option value="' + x.id + '"' + (x.id === selected[cat.key] ? ' selected' : '') + '>' + esc(x.name) + ' — ' + fmt(x.price) + '</option>';
      });
      html += '</select></div><div class="part-price">' + (part(cat.key) ? fmt(part(cat.key).price) : '—') + '</div></div>';
    });
    $('partPickers').innerHTML = html;
    document.querySelectorAll('#partPickers select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        selected[sel.dataset.cat] = sel.value;
        renderAll();
      });
    });
  }

  /* ---------- Tương thích + nghẽn cổ chai ---------- */
  function checkCompat() {
    var issues = [];
    var cpu = part('cpus'), gpu = part('gpus'), main = part('mainboards'), ram = part('rams'),
        psu = part('psus'), kase = part('cases'), cool = part('coolers');
    if (!cpu || !gpu || !main || !ram || !psu || !kase || !cool) {
      return { issues: [{ level: 'warn', msg: 'Hãy chọn đủ 8 loại linh kiện để kiểm tra tương thích đầy đủ.' }], totalPrice: 0, estWatt: 0, requiredPsu: 0 };
    }
    if (cpu.socket !== main.socket) issues.push({ level: 'err', part: 'mainboards', msg: 'Socket không khớp: CPU ' + cpu.socket + ' không lắp được trên main ' + main.socket + ' (' + main.name + ').' });
    if (ram.type !== main.ramType) issues.push({ level: 'err', part: 'rams', msg: 'RAM không khớp: main ' + main.name + ' chỉ hỗ trợ ' + main.ramType + ', bạn đang chọn RAM ' + ram.type + '.' });
    if (gpu.length > kase.gpuMax) issues.push({ level: 'err', part: 'gpus', msg: 'GPU quá dài: ' + gpu.name + ' dài ' + gpu.length + 'mm, case ' + kase.name + ' chỉ chứa tối đa ' + kase.gpuMax + 'mm.' });
    if (FORM_ORDER[main.form] > FORM_ORDER[kase.maxForm]) issues.push({ level: 'err', part: 'mainboards', msg: 'Main quá lớn: main ' + main.form + ' không vừa case ' + kase.name + ' (tối đa ' + kase.maxForm + ').' });
    if (cool.type === 'air' && cool.height > kase.coolerMax) issues.push({ level: 'err', part: 'coolers', msg: 'Tản tháp quá cao: ' + cool.name + ' cao ' + cool.height + 'mm, case chỉ hỗ trợ tối đa ' + kase.coolerMax + 'mm.' });
    if (cool.type === 'aio' && cool.radiator > kase.radiatorMax) issues.push({ level: 'err', part: 'coolers', msg: 'Radiator AIO quá lớn: ' + cool.radiator + 'mm, case ' + kase.name + ' chỉ gắn tối đa ' + kase.radiatorMax + 'mm.' });
    if (cpu.tdp > cool.tdpSupport) issues.push({ level: 'warn', part: 'coolers', msg: 'Tản nhiệt hơi đuối: TDP CPU ' + cpu.tdp + 'W cao hơn mức khuyến nghị của ' + cool.name + ' (' + cool.tdpSupport + 'W).' });

    var estWatt = cpu.tdp + gpu.tdp + 80; // +80W cho main/RAM/SSD/quạt
    var requiredPsu = Math.ceil(estWatt * 1.4 / 50) * 50;
    if (psu.watt < estWatt) issues.push({ level: 'err', part: 'psus', msg: 'Nguồn không đủ: tải ước tính ~' + estWatt + 'W, nguồn ' + psu.watt + 'W có nguy cơ sập nguồn.' });
    else if (psu.watt < requiredPsu) issues.push({ level: 'warn', msg: 'Nguồn hơi sát: tải ước tính ~' + estWatt + 'W, nên dùng nguồn từ ~' + requiredPsu + 'W để dư địa nâng cấp.' });

    var totalPrice = CATEGORIES.reduce(function (s, c) { return s + part(c.key).price; }, 0);
    if (!issues.length) issues.push({ level: 'ok', msg: 'Tất cả linh kiện tương thích với nhau. ✓' });
    return { issues: issues, totalPrice: totalPrice, estWatt: estWatt, requiredPsu: requiredPsu };
  }

  function bottleneck() {
    var cpu = part('cpus'), gpu = part('gpus');
    if (!cpu || !gpu) return '';
    var diff = gpu.perf - cpu.score;
    if (diff >= 45) return '<div class="issue warn">⚠️ Nghẽn cổ chai phía CPU (~' + Math.round(diff * 0.5) + '%): GPU mạnh hơn CPU khá nhiều ở 1080p, nên cân nhắc CPU nhanh hơn.</div>';
    if (diff <= -45) return '<div class="issue warn">⚠️ Nghẽn cổ chai phía GPU (~' + Math.round(-diff * 0.5) + '%): CPU đang dư sức so với GPU, nâng GPU sẽ tăng FPS rõ nhất.</div>';
    return '<div class="issue ok">Cân bằng tốt giữa CPU và GPU (nghẽn cổ chai không đáng kể).</div>';
  }

  function renderSummary() {
    var r = checkCompat();
    var chosen = CATEGORIES.filter(function (c) { return !!part(c.key); }).length;
    $('totalPrice').textContent = r.totalPrice ? fmt(r.totalPrice) : '—';
    $('totalWatt').textContent = r.estWatt ? ('Điện năng ước tính: ~' + r.estWatt + 'W · Nguồn khuyến nghị: từ ~' + r.requiredPsu + 'W') : '';
    $('buildProgress').textContent = 'Đã chọn ' + chosen + '/8 linh kiện';
    $('compatList').innerHTML = r.issues.map(function (i) { return '<div class="issue ' + i.level + '">' + esc(i.msg) + '</div>'; }).join('');
    $('bottleneckBox').innerHTML = bottleneck();
    $('viewerLabels').textContent = 'GPU ' + (part('gpus') ? part('gpus').length : '—') + 'mm · Case tối đa ' + (part('cases') ? part('cases').gpuMax : '—') + 'mm';
  }

  function buildText() {
    var r = checkCompat();
    var lines = ['RigCheck VN — Cấu hình PC', '--------------------------'];
    CATEGORIES.forEach(function (c) { var p = part(c.key); if (p) lines.push(c.singular + ': ' + p.name + ' — ' + fmt(p.price)); });
    lines.push('--------------------------');
    lines.push('Tổng giá tham khảo: ' + fmt(r.totalPrice));
    lines.push('Điện năng ước tính: ~' + r.estWatt + 'W (nguồn khuyến nghị từ ~' + r.requiredPsu + 'W)');
    lines.push('Giá đối chiếu niêm yết online shop VN (10/2026), chỉ mang tính tham khảo.');
    return lines.join('\n');
  }

  /* ---------- 3D: model Blender (GLB) làm chính, khối hộp procedural làm dự phòng ---------- */
  var three = null;      // trạng thái renderer khối hộp (fallback, THREE UMD r128)
  var glb = null;        // trạng thái renderer GLB (three module 0.160)
  var viewMode = 'none'; // 'glb' | 'box' | 'none'

  /* ----- Tương tác hai chiều danh sách ↔ 3D (chỉ ở chế độ GLB) -----
   * interact.pickerCat: category đang được highlight từ phía picker (focus/change).
   * interact.hoverCat: category đang được hover bằng raycast trên canvas.
   * Emissive được áp DUY NHẤT tại applyEmissiveState() theo ưu tiên:
   *   lỗi tương thích (đỏ) > highlight tương tác (xanh) > emissive gốc. */
  var interact = { pickerCat: null, hoverCat: null, timer: null };
  var GROUP_TO_CAT = {
    CASE: 'cases', BOARD: 'mainboards', GPU_STD: 'gpus', GPU_LONG: 'gpus',
    COOLER_AIO: 'coolers', COOLER_AIR: 'coolers', RADIATOR: 'coolers', PSU: 'psus',
    RAM_1: 'rams', RAM_2: 'rams', RAM_3: 'rams', RAM_4: 'rams',
  };

  function sync3D() {
    if (viewMode === 'glb') syncGLB();
    else if (viewMode === 'box') drawPC();
  }

  function init3D() {
    $('viewerFallback').textContent = 'Đang tải model 3D Blender… Nếu tải chậm hoặc lỗi mạng, khung sẽ tự chuyển sang bản dựng đơn giản.';
    initGLB().then(function (ok) {
      if (!ok) initBox3D();
    }, function () { initBox3D(); });
  }

  /* ----- Đường GLB ----- */
  function initGLB() {
    var box = $('viewer3d');
    return Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/controls/OrbitControls.js'),
    ]).then(function (mods) {
      var THREE = mods[0];
      var GLTFLoader = mods[1].GLTFLoader;
      var OrbitControls = mods[2].OrbitControls;
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(box.clientWidth, 340);
      if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(42, box.clientWidth / 340, 0.1, 100);
      camera.position.set(6.6, 4.4, 7.6);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xdbe4ef, 1.15));
      var key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(5, 9, 6); scene.add(key);
      var fill = new THREE.DirectionalLight(0xcfe2ff, 0.55); fill.position.set(-6, 3, -5); scene.add(fill);
      var controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 2.0, 0);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.minDistance = 5; controls.maxDistance = 16;
      controls.maxPolarAngle = Math.PI * 0.62;
      controls.autoRotate = true; controls.autoRotateSpeed = 0.7;
      controls.addEventListener('start', function () { controls.autoRotate = false; if (glb) glb.autoWanted = false; });
      controls.update(); controls.saveState();
      glb = { THREE: THREE, renderer: renderer, scene: scene, camera: camera, controls: controls, groups: {}, groupMats: {}, caseMats: [], ready: false, autoWanted: true };
      var loader = new GLTFLoader();
      // Nguồn GLB: ưu tiên file local (khi chạy local / bản deploy đầy đủ), sau đó tới CDN
      // jsDelivr trỏ đúng commit GitHub chứa model (Vercel không nhận file >100KB qua kênh deploy hiện tại).
      var GLB_URLS = [
        'assets/case.glb',
        'https://cdn.jsdelivr.net/gh/thantaigocua1515-cmd/rigcheck-vn@0a7da4bbf221cf7046f53e26877a5bbc53d79acc/assets/case.glb',
      ];
      function tryLoad(idx) {
        return new Promise(function (resolve, reject) {
          var to = setTimeout(function () { reject(new Error('GLB timeout')); }, 25000);
          loader.load(GLB_URLS[idx],
            function (g) { clearTimeout(to); resolve(g); },
            undefined,
            function (e) { clearTimeout(to); reject(e || new Error('GLB load error')); });
        }).catch(function (err) {
          if (idx + 1 < GLB_URLS.length) return tryLoad(idx + 1);
          throw err;
        });
      }
      return tryLoad(0).then(function (gltf) {
        scene.add(gltf.scene);
        if (!collectGLBGroups(gltf.scene)) throw new Error('GLB thiếu nhóm CASE/GPU_STD');
        box.insertBefore(renderer.domElement, box.firstChild);
        $('viewerFallback').style.display = 'none';
        $('btnResetView').hidden = false;
        $('modelStatus').textContent = 'Model 3D: Blender (GLB)';
        viewMode = 'glb'; glb.ready = true;
        (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
        syncGLB();
        setupGLBInteract(renderer.domElement);
        return true;
      });
    }).catch(function () { glb = null; return false; });
  }

  // Clone material theo từng mesh (tránh dùng chung material giữa các nhóm khi tint/phát sáng),
  // đăng ký material theo nhóm, gán lại kính và lưu màu vỏ case gốc.
  function collectGLBGroups(root) {
    root.traverse(function (o) {
      if (o.isMesh) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        var cloned = mats.map(function (m) { return m ? m.clone() : m; });
        o.material = Array.isArray(o.material) ? cloned : cloned[0];
      }
    });
    var NAMES = ['CASE', 'BOARD', 'GPU_STD', 'GPU_LONG', 'COOLER_AIO', 'COOLER_AIR', 'RADIATOR', 'PSU', 'RAM_1', 'RAM_2', 'RAM_3', 'RAM_4'];
    NAMES.forEach(function (n) { var o = root.getObjectByName(n); if (o) glb.groups[n] = o; });
    if (!glb.groups.CASE || !glb.groups.GPU_STD) return false;
    NAMES.forEach(function (n) {
      var g = glb.groups[n]; if (!g) return;
      var seen = [];
      g.traverse(function (o) {
        if (!o.isMesh) return;
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) {
          if (m && seen.indexOf(m) === -1) {
            seen.push(m);
            (glb.groupMats[n] = glb.groupMats[n] || []).push({
              mat: m,
              emissive: m.emissive ? m.emissive.getHex() : 0,
              emissiveIntensity: m.emissiveIntensity != null ? m.emissiveIntensity : 1,
            });
          }
        });
      });
    });
    // Kính: shader Blender không qua được glTF → gán lại trong suốt tại đây
    glb.groups.CASE.traverse(function (o) {
      if (!o.isMesh) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        if (!m || !/glass/i.test(m.name || '')) return;
        m.transparent = true;
        m.opacity = /front/i.test(m.name) ? 0.38 : 0.22;
        m.roughness = 0.08; m.metalness = 0.0;
        m.depthWrite = false;
        m.side = glb.THREE.DoubleSide;
        m.needsUpdate = true;
      });
    });
    // Màu vỏ: lưu màu gốc của các material sơn trắng thuộc CASE để tint Đen/Trắng
    glb.groups.CASE.traverse(function (o) {
      if (!o.isMesh) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        if (m && /white/i.test(m.name || '') && m.color) glb.caseMats.push({ mat: m, orig: m.color.getHex() });
      });
    });
    return true;
  }

  /* ----- Ánh xạ category ↔ nhóm GLB (theo lựa chọn hiện tại) ----- */
  function coolerGroupName() { var c = part('coolers'); return c && c.type === 'air' ? 'COOLER_AIR' : 'COOLER_AIO'; }
  function gpuGroupName() { var g = part('gpus'); return g && g.length > 270 ? 'GPU_LONG' : 'GPU_STD'; }
  function groupsForCat(cat) {
    switch (cat) {
      case 'cpus': case 'coolers': return [coolerGroupName()]; // CPU nằm dưới tản — highlight khối tản đang hiện
      case 'gpus': return [gpuGroupName()];
      case 'mainboards': case 'ssds': return ['BOARD'];        // SSD gắn trên mainboard, chưa có hình riêng
      case 'rams': return ['RAM_1', 'RAM_2', 'RAM_3', 'RAM_4'];
      case 'cases': return ['CASE'];
      case 'psus': return ['PSU'];
    }
    return [];
  }
  function catLabel(cat) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].key === cat) return CATEGORIES[i].label;
    return cat;
  }

  /* Áp emissive cho mọi nhóm — ĐIỂM ÁP DUY NHẤT.
   * Ưu tiên: nhóm lỗi tương thích (glb.errSet do syncGLB tính) phát đỏ >
   * highlight tương tác (xanh 0x2563eb; hover nhẹ hơn picker) > emissive gốc đã lưu. */
  function applyEmissiveState() {
    if (!glb || !glb.ready) return;
    var err = glb.errSet || {};
    var hlCat = interact.hoverCat || interact.pickerCat;
    var hl = {};
    if (hlCat) {
      var strength = interact.hoverCat ? 0.32 : 0.55;
      groupsForCat(hlCat).forEach(function (n) { hl[n] = strength; });
    }
    var applied = {};
    Object.keys(glb.groupMats).forEach(function (n) {
      var mode = err[n] ? 'err' : (hl[n] != null ? 'hl' : 'base');
      applied[n] = mode;
      (glb.groupMats[n] || []).forEach(function (rec) {
        if (!rec.mat.emissive) return;
        if (mode === 'err') { rec.mat.emissive.setHex(0xff2418); rec.mat.emissiveIntensity = 0.9; }
        else if (mode === 'hl') { rec.mat.emissive.setHex(0x2563eb); rec.mat.emissiveIntensity = hl[n]; }
        else { rec.mat.emissive.setHex(rec.emissive); rec.mat.emissiveIntensity = rec.emissiveIntensity; }
      });
    });
    glb.hlSet = hl;
    // Hook trạng thái phục vụ kiểm chứng tự động (chỉ đọc)
    window.__rcHl = {
      pickerCat: interact.pickerCat, hoverCat: interact.hoverCat,
      hlGroups: Object.keys(hl), errGroups: Object.keys(err).filter(function (k) { return err[k]; }),
      applied: applied,
    };
  }

  /* ----- Chiều danh sách → 3D: nhãn nổi + highlight theo picker ----- */
  function showHlLabel(cat) {
    var el = $('hlLabel');
    if (!el) return;
    if (!cat || viewMode !== 'glb' || !glb || !glb.ready) { el.hidden = true; el.textContent = ''; return; }
    var p = part(cat);
    el.innerHTML = '<strong>' + esc(catLabel(cat)) + '</strong>: ' + esc(p ? p.name : '—') +
      (p ? ' — ' + fmt(p.price) : '') +
      (cat === 'ssds' ? ' <span class="muted">(SSD gắn trên mainboard)</span>' : '');
    el.hidden = false;
  }
  function armHlTimer() {
    if (interact.timer) clearTimeout(interact.timer);
    interact.timer = setTimeout(function () {
      interact.pickerCat = null;
      showHlLabel(null);
      applyEmissiveState();
    }, 2500);
  }
  function setPickerHighlight(cat) {
    if (viewMode !== 'glb' || !glb || !glb.ready) return;
    interact.pickerCat = cat;
    showHlLabel(cat);
    applyEmissiveState();
    armHlTimer();
  }

  /* ----- Chiều 3D → danh sách: bấm trúng nhóm thì mở picker tương ứng ----- */
  function activatePicker(cat) {
    var sel = document.querySelector('#partPickers select[data-cat="' + cat + '"]');
    if (!sel) return;
    var row = sel.closest ? sel.closest('.part-row') : null;
    setPickerHighlight(cat);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('flash');
      setTimeout(function () { row.classList.remove('flash'); }, 1200);
    }
    setTimeout(function () { try { sel.focus({ preventScroll: true }); } catch (e) { sel.focus(); } }, 380);
  }

  /* Hit-test + hover tooltip + click trên canvas GLB.
   * - Vùng bấm = bounding box (Box3) của từng nhóm đang hiển thị, KHÔNG raycast từng mesh:
   *   card GPU mỏng nằm ngang và thanh RAM mảnh rất khó trúng tia mesh, còn BOARD thì bị
   *   khay case che — box cho vùng bấm rộng và ổn định hơn hẳn, nhất là trên cảm ứng.
   * - Box được nới mỗi phía: 10% kích thước của chính chiều đó, nhưng tối thiểu HIT_MIN_PAD
   *   (đệm tuyệt đối cho các chiều quá mỏng như bề dày GPU/RAM).
   * - Tia trúng nhiều box → thắng box THỂ TÍCH NHỎ NHẤT (nhóm nhỏ/nested thắng nhóm lớn bao ngoài).
   * - CASE không có box: chỉ khi không trúng box nào mới raycast mesh thật của CASE (fallback cuối).
   * - Box cache trong glb.hitBoxes; syncGLB xoá cache (gán null) mỗi lần đổi hiển thị/scale,
   *   lần hit-test đầu tiên sau đó mới tính lại (kèm updateMatrixWorld) — rẻ và luôn đúng.
   * - pointermove được throttle bằng requestAnimationFrame, không hit-test mỗi frame render.
   * - Click = pointerup lệch < 6px và < 400ms so với pointerdown (kéo xoay thì bỏ qua). */
  var HIT_MIN_PAD = 0.15;
  // Các nhóm có box hit-test riêng. RADIATOR tách khỏi COOLER_AIO (nó là con của AIO)
  // để box phần còn lại của AIO (block + ống) không bị phình theo radiator.
  var HIT_BOX_GROUPS = ['BOARD', 'GPU_STD', 'GPU_LONG', 'COOLER_AIO', 'RADIATOR', 'COOLER_AIR', 'PSU', 'RAM_1', 'RAM_2', 'RAM_3', 'RAM_4'];

  function setupGLBInteract(canvas) {
    var THREE = glb.THREE;
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();
    var downPos = null;
    var lastMove = null, moveRaf = false;

    function chainVisible(node, stopAt) {
      // true nếu node và mọi tổ tiên lên tới (không gồm) stopAt đều visible
      var n = node;
      while (n && n !== stopAt) { if (n.visible === false) return false; n = n.parent; }
      return true;
    }
    function isGlassMesh(o) {
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      return mats.some(function (m) { return m && /glass/i.test(m.name || ''); });
    }

    function buildHitBoxes() {
      glb.scene.updateMatrixWorld(true);
      var list = [];
      HIT_BOX_GROUPS.forEach(function (n) {
        var g = glb.groups[n];
        if (!g || !chainVisible(g, glb.scene)) return; // nhóm đang ẩn → không có vùng bấm
        var box = new THREE.Box3();
        var tmp = new THREE.Box3();
        var has = false;
        g.traverse(function (o) {
          if (!o.isMesh) return;
          // Bỏ qua subtree là một nhóm hit-test khác (RADIATOR trong COOLER_AIO có box riêng)
          var anc = o.parent, nested = false;
          while (anc && anc !== g) { if (HIT_BOX_GROUPS.indexOf(anc.name) !== -1) { nested = true; break; } anc = anc.parent; }
          if (nested) return;
          if (!chainVisible(o, g)) return;      // mesh/nhánh con đang ẩn
          if (isGlassMesh(o)) return;           // kính không tính vào vùng bấm
          tmp.setFromObject(o);
          if (tmp.isEmpty()) return;
          if (!has) { box.copy(tmp); has = true; } else box.union(tmp);
        });
        if (!has) return;
        var size = box.getSize(new THREE.Vector3());
        box.expandByVector(new THREE.Vector3(
          Math.max(size.x * 0.10, HIT_MIN_PAD),
          Math.max(size.y * 0.10, HIT_MIN_PAD),
          Math.max(size.z * 0.10, HIT_MIN_PAD)));
        var s2 = box.getSize(new THREE.Vector3());
        list.push({ name: n, cat: GROUP_TO_CAT[n], box: box, volume: s2.x * s2.y * s2.z });
      });
      // Hook chẩn đoán chỉ đọc (kiểm chứng tự động đối chiếu thể tích/kích thước box)
      window.__rcHitBoxes = list.map(function (e) {
        var s = e.box.getSize(new THREE.Vector3());
        var c = e.box.getCenter(new THREE.Vector3());
        return { name: e.name, cat: e.cat, volume: Math.round(e.volume * 100) / 100,
                 size: [Math.round(s.x * 100) / 100, Math.round(s.y * 100) / 100, Math.round(s.z * 100) / 100],
                 center: [Math.round(c.x * 100) / 100, Math.round(c.y * 100) / 100, Math.round(c.z * 100) / 100] };
      });
      return list;
    }

    function pickAt(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, glb.camera);
      if (!glb.hitBoxes) glb.hitBoxes = buildHitBoxes();
      var best = null;
      var hitP = new THREE.Vector3();
      for (var i = 0; i < glb.hitBoxes.length; i++) {
        var e = glb.hitBoxes[i];
        if (raycaster.ray.intersectBox(e.box, hitP) && (!best || e.volume < best.volume)) best = e;
      }
      if (best) return best.cat;
      // Fallback cuối: raycast mesh thật của riêng CASE (vỏ, quạt trước...) — bỏ qua kính và phần ẩn.
      var kase = glb.groups.CASE;
      if (kase && chainVisible(kase, glb.scene)) {
        var hits = raycaster.intersectObject(kase, true);
        for (var j = 0; j < hits.length; j++) {
          var obj = hits[j].object;
          if (isGlassMesh(obj)) continue; // kính: bỏ qua, xét hit phía sau
          var node = obj, groupName = null, hidden = false;
          while (node && node !== glb.scene) {
            if (node.visible === false) { hidden = true; break; }
            if (GROUP_TO_CAT[node.name]) { groupName = node.name; break; }
            node = node.parent;
          }
          if (hidden || !groupName) continue;
          return GROUP_TO_CAT[groupName];
        }
      }
      return null;
    }

    function setHover(cat, clientX, clientY) {
      if (cat !== interact.hoverCat) {
        interact.hoverCat = cat;
        applyEmissiveState();
      }
      var tip = $('glbTip');
      if (cat) {
        canvas.style.cursor = 'pointer';
        var p = part(cat);
        tip.innerHTML = '<strong>' + esc(catLabel(cat)) + '</strong> — ' + esc(p ? p.name : '—') + (p ? ' · ' + fmt(p.price) : '');
        var box = $('viewer3d').getBoundingClientRect();
        tip.style.left = Math.max(4, Math.min(box.width - 290, clientX - box.left + 14)) + 'px';
        tip.style.top = (clientY - box.top + 16) + 'px';
        tip.hidden = false;
      } else {
        canvas.style.cursor = '';
        tip.hidden = true;
      }
    }

    canvas.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      lastMove = { x: e.clientX, y: e.clientY };
      if (moveRaf) return;
      moveRaf = true;
      requestAnimationFrame(function () {
        moveRaf = false;
        if (!lastMove) return;
        var m = lastMove; lastMove = null;
        setHover(pickAt(m.x, m.y), m.x, m.y);
      });
    });
    canvas.addEventListener('pointerenter', function () { glb.controls.autoRotate = false; });
    canvas.addEventListener('pointerleave', function () {
      lastMove = null;
      setHover(null, 0, 0);
      downPos = null;
      if (glb.autoWanted) glb.controls.autoRotate = true; // chưa từng kéo thủ công thì khôi phục tự xoay nhẹ
    });
    canvas.addEventListener('pointerdown', function (e) { downPos = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    canvas.addEventListener('pointercancel', function () { downPos = null; });
    canvas.addEventListener('pointerup', function (e) {
      if (!downPos) return;
      var dx = e.clientX - downPos.x, dy = e.clientY - downPos.y;
      var dt = Date.now() - downPos.t;
      downPos = null;
      if (Math.sqrt(dx * dx + dy * dy) >= 6 || dt >= 400) return; // kéo xoay/zoom — không phải click
      var cat = pickAt(e.clientX, e.clientY);
      if (cat) activatePicker(cat);
    });
  }

  function clampScale(v) { return Math.max(0.95, Math.min(1.1, v)); }

  function syncGLB() {
    if (!glb || !glb.ready) return;
    glb.hitBoxes = null; // hiển thị/scale sắp thay đổi → box hit-test tính lại ở lần pickAt kế tiếp
    var G = glb.groups;
    var gpu = part('gpus'), main = part('mainboards'), ram = part('rams'), cool = part('coolers'), kase = part('cases');
    // GPU: ≤270mm dùng biến thể chuẩn, dài hơn dùng biến thể dài; scale nhẹ theo độ dài
    var longGpu = !!(gpu && gpu.length > 270);
    if (G.GPU_STD) { G.GPU_STD.visible = !longGpu; G.GPU_STD.scale.x = clampScale((gpu ? gpu.length : 245) / 245); }
    if (G.GPU_LONG) { G.GPU_LONG.visible = longGpu; if (longGpu) G.GPU_LONG.scale.x = clampScale(gpu.length / 320); }
    // Tản nhiệt: air ↔ AIO; radiator scale theo 240/280/360
    var isAir = !!(cool && cool.type === 'air');
    if (G.COOLER_AIR) G.COOLER_AIR.visible = isAir;
    if (G.COOLER_AIO) G.COOLER_AIO.visible = !isAir;
    if (!isAir && G.RADIATOR && cool) G.RADIATOR.scale.x = Math.max(0.6, (cool.radiator || 360) / 360);
    // RAM: hiện đúng số thanh
    var sticks = ram ? ram.sticks : 2;
    for (var i = 1; i <= 4; i++) { if (G['RAM_' + i]) G['RAM_' + i].visible = i <= sticks; }
    // Mainboard: scale theo form factor
    if (G.BOARD) { var fs = !main ? 1 : (main.form === 'ATX' ? 1 : (main.form === 'mATX' ? 0.92 : 0.8)); G.BOARD.scale.set(fs, 1, fs); }
    // Case: tint vỏ theo tông màu của case được chọn
    if (kase && glb.caseMats.length) {
      var dark = kase.color.indexOf('Trắng') === -1 && kase.color.indexOf('Đen') !== -1;
      glb.caseMats.forEach(function (rec) { rec.mat.color.setHex(dark ? 0x2b3038 : rec.orig); });
    }
    // Lỗi tương thích (theo checkCompat): chỉ GHI NHẬN tập nhóm lỗi vào glb.errSet.
    // Emissive thật do applyEmissiveState() áp theo ưu tiên lỗi đỏ > highlight tương tác > gốc,
    // nên highlight từ picker/hover không bao giờ đè được báo lỗi, và highlight đang bật
    // cũng tự bám theo khi nhóm hiển thị thay đổi (GPU_STD ↔ GPU_LONG, AIO ↔ tháp).
    var partGroups = {
      gpus: [longGpu ? 'GPU_LONG' : 'GPU_STD'],
      mainboards: ['BOARD'],
      coolers: [isAir ? 'COOLER_AIR' : 'COOLER_AIO'],
      cases: ['CASE'],
      rams: ['RAM_1', 'RAM_2', 'RAM_3', 'RAM_4'],
      psus: ['PSU'],
    };
    var errSet = {};
    checkCompat().issues.forEach(function (it) {
      if (it.level !== 'err' || !it.part || !partGroups[it.part]) return;
      partGroups[it.part].forEach(function (n) { errSet[n] = true; });
    });
    glb.errSet = errSet;
    applyEmissiveState();
    // Hook trạng thái phục vụ kiểm chứng tự động (chỉ đọc)
    var snap = {};
    Object.keys(G).forEach(function (n) { snap[n] = { visible: G[n].visible, scaleX: Math.round(G[n].scale.x * 100) / 100 }; });
    window.__rcGroups = snap; window.__rcViewMode = 'glb';
  }

  /* ----- Đường dự phòng: khối hộp procedural (THREE UMD r128 như bản cũ) ----- */
  function initBox3D() {
    if (typeof THREE === 'undefined') { $('viewerFallback').textContent = 'Không tải được thư viện 3D (CDN bị chặn/mất mạng). Phần chọn linh kiện bên dưới vẫn dùng bình thường.'; return; }
    viewMode = 'box';
    window.__rcViewMode = 'box';
    $('modelStatus').textContent = 'Model 3D: bản dựng đơn giản (dự phòng — không tải được model Blender)';
    var box = $('viewer3d');
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(box.clientWidth, 340);
    box.insertBefore(renderer.domElement, box.firstChild);
    $('viewerFallback').style.display = 'none';
    $('btnResetView').hidden = false;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, box.clientWidth / 340, 0.1, 100);
    camera.position.set(5.2, 3.4, 6.4);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    var dl = new THREE.DirectionalLight(0xffffff, 0.7); dl.position.set(4, 8, 6); scene.add(dl);
    var group = new THREE.Group(); scene.add(group);
    three = { renderer: renderer, scene: scene, camera: camera, group: group, rotY: -0.55, rotX: 0.25, dist: 8.6 };

    // Kéo xoay + zoom
    var dragging = false, px = 0, py = 0;
    var el = renderer.domElement;
    el.addEventListener('pointerdown', function (e) { dragging = true; px = e.clientX; py = e.clientY; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', function (e) { if (!dragging) return; three.rotY += (e.clientX - px) * 0.01; three.rotX += (e.clientY - py) * 0.006; three.rotX = Math.max(-1, Math.min(1, three.rotX)); px = e.clientX; py = e.clientY; });
    el.addEventListener('pointerup', function () { dragging = false; });
    el.addEventListener('wheel', function (e) { e.preventDefault(); three.dist = Math.max(5.5, Math.min(13, three.dist + e.deltaY * 0.01)); }, { passive: false });

    (function loop() {
      requestAnimationFrame(loop);
      group.rotation.y = three.rotY; group.rotation.x = three.rotX;
      camera.position.set(0, 2.2, three.dist); camera.lookAt(0, 0.1, 0);
      renderer.render(scene, camera);
    })();
    drawPC();
  }

  function drawPC() {
    if (!three) return;
    var g = three.group;
    while (g.children.length) g.remove(g.children[0]);
    var cpu = part('cpus'), gpu = part('gpus'), main = part('mainboards'), ram = part('rams'), cool = part('coolers'), kase = part('cases');
    function addBox(w, h, d, x, y, z, color, opacity) {
      var mat = new THREE.MeshStandardMaterial({ color: color, transparent: opacity < 1, opacity: opacity, roughness: 0.55, metalness: 0.15 });
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); g.add(m); return m;
    }
    // Vỏ case: khung + mặt kính trong
    var caseMat = new THREE.MeshStandardMaterial({ color: 0x334155, wireframe: true });
    var caseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.4, 4.6), caseMat); g.add(caseMesh);
    var glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 4.2, 4.4),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.13 }));
    glass.position.set(-1.22, 0, 0); g.add(glass);
    // Mainboard: ATX cao hơn mATX, ITX nhỏ nhất
    var mainH = !main ? 3.0 : (main.form === 'ATX' ? 3.4 : main.form === 'mATX' ? 2.9 : 2.2);
    addBox(0.08, mainH, 3.1, -1.0, 0.1, -0.3, 0x1e40af, 1);
    // GPU: chiều dài theo mm thật (240mm ≈ 2.4 đơn vị)
    if (gpu) { var gl = gpu.length / 100; addBox(0.55, 0.85, gl, -0.55, -0.35, -1.5 + gl / 2, 0x0f172a, 1); addBox(0.6, 0.12, gl, -0.55, 0.12, -1.5 + gl / 2, 0x2563eb, 1); }
    // CPU + tản
    if (cool) {
      if (cool.type === 'air') { var th = cool.height / 100; addBox(th, 1.0, 1.0, -1.0 + th / 2 + 0.06, 0.75, -0.4, 0x9ca3af, 1); }
      else { addBox(2.0, 0.28, cool.radiator / 100, 0, 2.05, -0.3, 0x64748b, 1); addBox(0.5, 0.5, 0.5, -0.7, 0.75, -0.4, 0x9ca3af, 1); }
    }
    // RAM: đúng số thanh
    if (ram) for (var i = 0; i < ram.sticks; i++) addBox(0.1, 1.15, 0.28, -0.88, 0.65, 0.85 + i * 0.36, 0x16a34a, 1);
    // Nắp che nguồn + PSU
    addBox(2.2, 0.7, 4.4, 0, -1.85, 0, 0x475569, 1);
    // Quạt trước (3 vòng)
    for (var f = 0; f < 3; f++) {
      var fan = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 24), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
      fan.position.set(0, -1.3 + f * 1.3, 2.28); g.add(fan);
    }
    if (kase) { /* case đổi màu viền theo tông case chọn */ caseMat.color.set(kase.color.indexOf('Trắng') !== -1 ? 0x94a3b8 : 0x334155); }
    if (cpu) { /* CPU chỉ thể hiện qua tản — giữ tham chiếu để tránh lint */ }
  }

  /* ---------- Tab FPS ---------- */
  var RES_FACTOR = { '1080': 1, '1440': 0.68, '2160': 0.38 };
  var SET_FACTOR = { low: 1.55, medium: 1.22, high: 1, ultra: 0.78 };
  var UP_FACTOR = { off: 1, dlss: 1.38, fg: 1.85 };

  function estimateFps(game, gpuPerf, cpuScore, res, setting, upscale) {
    var gpuFactor = Math.pow(gpuPerf / 100, 0.92);
    var cpuCap = game.baseFps * Math.pow(cpuScore / 100, 1.6) * 2.4; // trần do CPU ở game esports
    var cpuFactor = 1 - game.cpuWeight * Math.max(0, (100 - cpuScore)) / 160;
    var avg = game.baseFps * gpuFactor * cpuFactor * RES_FACTOR[res] * SET_FACTOR[setting] * UP_FACTOR[upscale];
    avg = Math.min(avg, cpuCap * RES_FACTOR[res] * (setting === 'low' ? 1.15 : 1));
    avg = Math.max(5, Math.round(avg));
    return { min: Math.max(3, Math.round(avg * 0.72)), avg: avg, max: Math.round(avg * 1.28) };
  }

  function currentFpsConfig() {
    if ($('fpsSource').value === 'laptop') {
      var lap = findById(DATA.laptops, $('fpsLaptop').value) || DATA.laptops[0];
      return { label: lap.name + ' (' + lap.cpu + ' · ' + lap.gpu + ' ' + lap.tgp + 'W)', gpuPerf: lap.gpuPerf, cpuScore: lap.cpuScore };
    }
    var cpu = part('cpus'), gpu = part('gpus');
    return { label: (cpu ? cpu.name : '—') + ' + ' + (gpu ? gpu.name : '—'), gpuPerf: gpu ? gpu.perf : 50, cpuScore: cpu ? cpu.score : 80 };
  }

  function renderFps() {
    var game = findById(DATA.games, fpsState.gameId) || DATA.games[0];
    var cfg = currentFpsConfig();
    var r = estimateFps(game, cfg.gpuPerf, cfg.cpuScore, $('fpsRes').value, $('fpsSetting').value, $('fpsUpscale').value);
    var marks = [30, 60, 144, 240].map(function (m) { return '<span class="' + (r.avg >= m ? 'hit' : '') + '">' + (r.avg >= m ? '✓' : '') + ' ' + m + ' FPS</span>'; }).join('');
    var verdict = r.avg < 30 ? 'Khó chơi — nên giảm setting hoặc nâng GPU.' : r.avg < 60 ? 'Chơi được ở mức cơ bản.' : r.avg < 144 ? 'Mượt — trải nghiệm tốt.' : 'Rất mượt — phù hợp màn hình tần số quét cao / esports.';
    $('fpsResult').innerHTML =
      '<p class="small muted" style="margin-top:14px">Cấu hình: <strong>' + esc(cfg.label) + '</strong> · Game: <strong>' + esc(game.name) + '</strong></p>' +
      '<div class="fps-nums"><div class="fps-box"><small>Tối thiểu</small><b>' + r.min + '</b><small>FPS</small></div>' +
      '<div class="fps-box"><small>Trung bình</small><b>' + r.avg + '</b><small>FPS</small></div>' +
      '<div class="fps-box"><small>Tối đa</small><b>' + r.max + '</b><small>FPS</small></div></div>' +
      '<p><strong>' + verdict + '</strong></p><div class="fps-scale">' + marks + '</div>';
  }

  function renderGameGrid() {
    $('gameGrid').innerHTML = DATA.games.map(function (g) {
      return '<button type="button" class="game-chip' + (g.id === fpsState.gameId ? ' active' : '') + '" data-game="' + g.id + '">' + esc(g.name) + '<small>' + esc(g.genre) + '</small></button>';
    }).join('');
    document.querySelectorAll('.game-chip').forEach(function (ch) {
      ch.addEventListener('click', function () { fpsState.gameId = ch.dataset.game; renderGameGrid(); renderFps(); });
    });
  }

  /* ---------- Tab Gợi ý ---------- */
  function cheapestCompatible(catKey, filterFn, sortFn) {
    var list = DATA[catKey].filter(filterFn || function () { return true; });
    list.sort(sortFn || function (a, b) { return a.price - b.price; });
    return list[0] || null;
  }

  function assembleBuild(cpu, gpu, preferPerf) {
    var main = cheapestCompatible('mainboards', function (m) { return m.socket === cpu.socket; });
    if (!main) return null;
    var ram = cheapestCompatible('rams', function (r) { return r.type === main.ramType && r.capacity >= 16; },
      preferPerf ? function (a, b) { return b.capacity - a.capacity || a.price - b.price; } : null) ||
      cheapestCompatible('rams', function (r) { return r.type === main.ramType; });
    var estWatt = cpu.tdp + gpu.tdp + 80;
    var psu = cheapestCompatible('psus', function (p) { return p.watt >= Math.ceil(estWatt * 1.4 / 50) * 50; }) ||
      DATA.psus[DATA.psus.length - 1];
    var kase = cheapestCompatible('cases', function (c) {
      return c.gpuMax >= gpu.length && FORM_ORDER[c.maxForm] >= FORM_ORDER[main.form] && c.coolerMax >= 150;
    }) || DATA.cases[0];
    var cool = cheapestCompatible('coolers', function (c) {
      return c.tdpSupport >= cpu.tdp && (c.type === 'aio' ? c.radiator <= kase.radiatorMax : c.height <= kase.coolerMax);
    }) || DATA.coolers[0];
    var ssd = cheapestCompatible('ssds', null, preferPerf ? function (a, b) { return b.capacity - a.capacity || a.price - b.price; } : null);
    var parts = { cpus: cpu, gpus: gpu, mainboards: main, rams: ram, ssds: ssd, psus: psu, cases: kase, coolers: cool };
    var total = Object.keys(parts).reduce(function (s, k) { return s + (parts[k] ? parts[k].price : 0); }, 0);
    return { parts: parts, total: total };
  }

  function recoFpsOf(cpu, gpu, game) { return estimateFps(game, gpu.perf, cpu.score, '1080', 'high', 'off').avg; }

  function renderReco() {
    var game = findById(DATA.games, $('recoGame').value) || DATA.games[0];
    var target = parseInt($('recoTarget').value, 10);
    var budget = parseInt($('recoBudget').value, 10) || 0;
    var combos = [];
    DATA.cpus.forEach(function (cpu) { DATA.gpus.forEach(function (gpu) {
      var b = assembleBuild(cpu, gpu, false); if (!b) return;
      combos.push({ cpu: cpu, gpu: gpu, build: b, fps: recoFpsOf(cpu, gpu, game) });
    });});
    combos.sort(function (a, b) { return a.build.total - b.build.total; });
    var minPkg = null, i;
    for (i = 0; i < combos.length; i++) if (combos[i].fps >= target && combos[i].build.total <= (budget || Infinity)) { minPkg = combos[i]; break; }
    if (!minPkg) { for (i = 0; i < combos.length; i++) if (combos[i].fps >= target) { minPkg = combos[i]; break; } }
    var within = combos.filter(function (c) { return c.build.total <= (budget || Infinity); });
    var maxPkg = within.length ? within.slice().sort(function (a, b) { return b.fps - a.fps; })[0] : combos[combos.length - 1];
    var recPkg = null;
    var recCandidates = combos.filter(function (c) { return c.fps >= Math.round(target * 1.25) && c.build.total <= (budget || Infinity); });
    recPkg = recCandidates.length ? recCandidates[0] : maxPkg;

    var pkgs = [
      { title: 'Gói Tối thiểu', desc: 'Rẻ nhất đạt FPS mục tiêu ở 1080p High.', data: minPkg, featured: false },
      { title: 'Gói Khuyên dùng', desc: 'Dư ~25% hiệu năng so với mục tiêu, bền vững lâu dài.', data: recPkg, featured: true },
      { title: 'Gói Max trong ngân sách', desc: 'FPS cao nhất mua được với ngân sách đã nhập.', data: maxPkg, featured: false },
    ];
    $('recoResult').innerHTML = pkgs.map(function (p, idx) {
      if (!p.data) return '<div class="pkg"><h3>' + p.title + '</h3><p class="muted">Chưa tìm được cấu hình phù hợp.</p></div>';
      var d = p.data, parts = d.build.parts;
      var lap = DATA.laptops.slice().sort(function (a, b) {
        var fa = estimateFps(game, a.gpuPerf, a.cpuScore, '1080', 'high', 'off').avg;
        var fb = estimateFps(game, b.gpuPerf, b.cpuScore, '1080', 'high', 'off').avg;
        return Math.abs(fa - d.fps) - Math.abs(fb - d.fps);
      })[0];
      var lis = CATEGORIES.map(function (c) { return '<li>' + c.singular + ': ' + esc(parts[c.key].name) + '</li>'; }).join('');
      return '<div class="pkg' + (p.featured ? ' featured' : '') + '"><h3>' + p.title + '</h3><p class="muted small">' + p.desc + '</p>' +
        '<div class="price">' + fmt(d.build.total) + '</div><p class="small">FPS ước tính ' + esc(game.name) + ': <strong>' + d.fps + ' FPS</strong> (1080p High)</p><ul>' + lis + '</ul>' +
        '<p class="small muted">Laptop tương đương: ' + esc(lap.name) + ' — ' + fmt(lap.price) + '</p>' +
        '<button class="btn secondary" type="button" data-apply="' + idx + '">Áp dụng sang tab Build</button></div>';
    }).join('');
    document.querySelectorAll('[data-apply]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = pkgs[parseInt(btn.dataset.apply, 10)].data; if (!d) return;
        CATEGORIES.forEach(function (c) { selected[c.key] = d.build.parts[c.key].id; });
        renderAll(); switchTab('build');
      });
    });
  }

  /* ---------- Tab Phần mềm & Model AI: chấm điểm thật theo build ----------
   * Điểm từng yếu tố (0–100): đạt ≥ mức khuyến nghị (rec) = 100; nằm giữa tối thiểu (min)
   * và rec thì nội suy 50→100; dưới min thì tỉ lệ theo min (tối đa 50).
   * Yếu tố GPU gộp hiệu năng GPU (60%) + VRAM (40%). Điểm tổng = trung bình theo trọng số
   * cpuW/gpuW/ramW trong hồ sơ req của từng phần mềm (xem js/data.js).
   * ⚠️ Đây là ước tính từ thông số phần cứng + yêu cầu công bố của hãng — KHÔNG phải
   * benchmark đo trực tiếp trên máy thật. */
  function subScore(value, min, rec) {
    if (value >= rec) return 100;
    if (value >= min) return Math.round(50 + 50 * (value - min) / Math.max(1, rec - min));
    return Math.round(50 * value / Math.max(1, min));
  }
  function scoreSoftware(sw) {
    var cpu = part('cpus'), gpu = part('gpus'), ram = part('rams');
    if (!sw.req || !cpu || !gpu || !ram) return null;
    var r = sw.req;
    var cpuS = subScore(cpu.score, r.minCpu, r.recCpu);
    var gpuS = Math.round(0.6 * subScore(gpu.perf, r.minGpu, r.recGpu) + 0.4 * subScore(gpu.vram, r.minVram, r.recVram));
    var ramS = subScore(ram.capacity, r.minRam, r.recRam);
    return { cpu: cpuS, gpu: gpuS, ram: ramS, total: Math.round(cpuS * r.cpuW + gpuS * r.gpuW + ramS * r.ramW) };
  }
  function swLevel(total) {
    if (total >= 80) return { label: 'Rất tốt', cls: 'ok' };
    if (total >= 60) return { label: 'Mượt', cls: 'info' };
    if (total >= 40) return { label: 'Chạy cơ bản', cls: 'warn' };
    return { label: 'Chưa đáp ứng', cls: 'err' };
  }
  // Gợi ý nâng cấp: yếu tố yếu nhất → món rẻ nhất trong catalog đạt mức khuyến nghị cho yếu tố đó
  // (CPU ưu tiên cùng socket với main hiện tại, RAM ưu tiên đúng DDR4/DDR5 của main).
  function upgradeHint(sw, sc) {
    var r = sw.req, main = part('mainboards');
    var factors = [{ k: 'cpu', s: sc.cpu, label: 'CPU' }, { k: 'gpu', s: sc.gpu, label: 'GPU' }, { k: 'ram', s: sc.ram, label: 'RAM' }];
    factors.sort(function (a, b) { return a.s - b.s; });
    var w = factors[0];
    if (w.s >= 100) return '';
    var pick = null;
    if (w.k === 'cpu') {
      pick = DATA.cpus.filter(function (c) { return c.score >= r.recCpu && (!main || c.socket === main.socket); }).sort(function (a, b) { return a.price - b.price; })[0] ||
             DATA.cpus.filter(function (c) { return c.score >= r.recCpu; }).sort(function (a, b) { return a.price - b.price; })[0];
    } else if (w.k === 'gpu') {
      pick = DATA.gpus.filter(function (g) { return g.perf >= r.recGpu && g.vram >= r.recVram; }).sort(function (a, b) { return a.price - b.price; })[0];
    } else {
      pick = DATA.rams.filter(function (x) { return x.capacity >= r.recRam && (!main || x.type === main.ramType); }).sort(function (a, b) { return a.price - b.price; })[0] ||
             DATA.rams.filter(function (x) { return x.capacity >= r.recRam; }).sort(function (a, b) { return a.price - b.price; })[0];
    }
    var cur = w.k === 'cpu' ? part('cpus') : w.k === 'gpu' ? part('gpus') : part('rams');
    if (!pick || (cur && pick.id === cur.id)) return '';
    return '<div class="up-note">⬆️ Điểm yếu nhất là <strong>' + w.label + '</strong> (' + w.s + '/100). Món rẻ nhất đạt mức khuyến nghị: <strong>' + esc(pick.name) + '</strong> — ' + fmt(pick.price) + '</div>';
  }
  function barRow(label, score) {
    return '<div class="bar-row"><span class="bar-label">' + label + '</span><span class="bar-track"><span class="bar-fill" style="width:' + score + '%"></span></span><span class="bar-val">' + score + '</span></div>';
  }
  function swCard(item) {
    var sc = scoreSoftware(item);
    if (!sc) {
      return '<div class="sw-card"><div class="sw-head"><h3>' + esc(item.name) + '</h3></div>' +
        '<div class="small muted">' + esc(item.category) + ' · ' + esc(item.focus) + '</div>' +
        '<p class="small muted" style="margin:10px 0 0">Chưa có hồ sơ yêu cầu để chấm điểm phần mềm này.</p></div>';
    }
    var lv = swLevel(sc.total), r = item.req;
    return '<div class="sw-card"><div class="sw-head"><h3>' + esc(item.name) + '</h3><span class="badge ' + lv.cls + '">' + lv.label + ' · ' + sc.total + '</span></div>' +
      '<div class="small muted">' + esc(item.category) + ' · ' + esc(item.focus) + '</div>' +
      '<div class="mini-bars">' + barRow('CPU', sc.cpu) + barRow('GPU', sc.gpu) + barRow('RAM', sc.ram) + '</div><dl>' +
      '<dt>Yêu cầu khuyến nghị</dt><dd>VRAM ' + r.recVram + 'GB · RAM ' + r.recRam + 'GB</dd>' +
      '<dt>Cấu hình đề xuất</dt><dd>CPU điểm ≥ ' + r.recCpu + ' · GPU hiệu năng ≥ ' + r.recGpu + ', VRAM ≥ ' + r.recVram + 'GB · RAM ≥ ' + r.recRam + 'GB</dd></dl>' +
      (sc.total < 80 ? upgradeHint(item, sc) : '') + '</div>';
  }

  /* ----- Model AI: đối chiếu VRAM cần (theo mức lượng tử hoá) với GPU hiện tại -----
   * LLM không vừa VRAM nhưng tổng VRAM + RAM hệ thống đủ chứa thì chạy theo cơ chế
   * offload (mượn RAM) — chậm hơn hẳn; model ảnh không offload nên thiếu là không chạy. */
  var QUANT_LABEL = { fp16: 'FP16', q8: 'Q8', q4: 'Q4' };
  var QUANT_BYTES = { fp16: 2, q8: 1.0, q4: 0.55 }; // GB cho mỗi 1B tham số — dùng ước tính token/s
  function aiQuantStatus(model, qk, gpu, ramGB) {
    var need = model.vram ? model.vram[qk] : null;
    if (need == null) return null;
    if (gpu && need <= gpu.vram) return { label: 'Chạy tốt', cls: 'ok' };
    if (model.kind === 'LLM' && gpu && ramGB >= 16 && need <= gpu.vram + ramGB) return { label: 'Chạy được (mượn RAM, chậm)', cls: 'warn' };
    return { label: 'Không đủ VRAM', cls: 'err' };
  }
  function aiCard(model) {
    var gpu = part('gpus'), ram = part('rams');
    var ramGB = ram ? ram.capacity : 0;
    var rows = '', bestTok = null;
    ['fp16', 'q8', 'q4'].forEach(function (qk) {
      var st = aiQuantStatus(model, qk, gpu, ramGB);
      if (!st) return;
      rows += '<tr><td>' + QUANT_LABEL[qk] + '</td><td>' + model.vram[qk] + 'GB</td><td><span class="badge ' + st.cls + '">' + st.label + '</span></td></tr>';
      // Token/s chỉ ước tính cho LLM ở mức lượng tử tốt nhất chạy trọn trong VRAM
      if (model.kind === 'LLM' && st.cls === 'ok' && !bestTok && gpu) {
        var paramsB = parseFloat(model.params) || 0;
        if (paramsB > 0) bestTok = { q: QUANT_LABEL[qk], tok: Math.max(1, Math.round(gpu.perf * 2.2 / (paramsB * QUANT_BYTES[qk]))) };
      }
    });
    return '<div class="sw-card"><div class="sw-head"><h3>' + esc(model.name) + '</h3><span class="badge info">' + esc(model.kind) + ' · ' + esc(model.params) + '</span></div>' +
      '<div class="small muted">' + esc(model.note || '') + '</div>' +
      '<table class="ai-vram"><thead><tr><th>Mức</th><th>VRAM cần</th><th>Với GPU hiện tại</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (bestTok ? '<p class="small" style="margin:8px 0 0">⚡ Ước tính ~<strong>' + bestTok.tok + ' token/s</strong> ở mức ' + bestTok.q + ' — số ước tính theo hiệu năng GPU, không phải đo thật.</p>' : '') +
      '<p class="small muted" style="margin:8px 0 0">Chạy bằng: <strong>' + esc(model.runner || '') + '</strong></p></div>';
  }

  function renderSoftwareBuild() {
    var cpu = part('cpus'), gpu = part('gpus'), ram = part('rams');
    var r = checkCompat();
    $('softwareBuildSummary').innerHTML = 'CPU: <strong>' + esc(cpu ? cpu.name : '—') + '</strong> · GPU: <strong>' + esc(gpu ? gpu.name : '—') + '</strong>' +
      (gpu ? ' (' + gpu.vram + 'GB VRAM)' : '') + ' · RAM: <strong>' + esc(ram ? ram.name : '—') + '</strong> · Tổng giá: <strong>' + fmt(r.totalPrice) + '</strong>' +
      '<br><span class="muted">Mức phù hợp cho từng phần mềm và khả năng chạy từng model AI bên dưới được chấm trực tiếp trên chính build này — đổi linh kiện ở tab Build là điểm tự cập nhật.</span>';
  }
  function renderSoftware() {
    $('softwareGrid').innerHTML = DATA.software.map(swCard).join('');
    $('aiGrid').innerHTML = (DATA.aiModels || []).map(aiCard).join('');
    renderSoftwareBuild();
  }

  /* ---------- Supabase: dữ liệu sống (tuỳ chọn) ---------- */
  function loadFromSupabase() {
    var cfg = window.RIGCHECK_SUPABASE || {};
    var status = $('dataStatus');
    if (!cfg.url || !cfg.anonKey) {
      status.textContent = 'Đang dùng dữ liệu đóng gói (chưa cấu hình Supabase) · Cập nhật: ' + DATA.updatedAt.slice(0, 10);
      return;
    }
    var headers = { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey };
    var base = cfg.url.replace(/\/$/, '') + '/rest/v1/';
    function get(path) {
      return fetch(base + path, { headers: headers }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
    }
    // Model AI: bảng riêng ai_models, fetch TÁCH khỏi luồng chính — DB chưa có bảng này
    // (chưa chạy update-software-model-ai.sql) cũng không làm sập dữ liệu sống, app giữ bản nhúng.
    get('ai_models?select=slug,name,kind,params,vram,runner,note&limit=100')
      .then(function (rows) {
        if (rows && rows.length) {
          DATA.aiModels = rows.map(function (m) { return { id: m.slug, name: m.name, kind: m.kind, params: m.params, vram: m.vram || {}, runner: m.runner, note: m.note }; });
          $('statsStrip').innerHTML = statsHtml();
          renderSoftware();
        }
      })
      .catch(function () { /* chưa có bảng ai_models → giữ danh sách model nhúng */ });
    Promise.all([
      get('components?select=category,slug,name,brand,specs,price_vnd,updated_at&limit=1000'),
      get('laptops?select=slug,name,brand,cpu,cpu_score,gpu,gpu_perf,tgp_watts,ram_gb,price_vnd,updated_at&limit=200'),
      get('games?select=slug,name,genre,base_fps,cpu_weight,updated_at&limit=200'),
      get('software_apps?select=slug,name,category,focus&limit=100'),
    ])
      .then(function (results) {
        var comps = results[0], laptops = results[1], games = results[2], software = results[3];
        if (!comps.length || !laptops.length || !games.length) throw new Error('empty');
        // Map components: specs jsonb chứa đúng các trường app cần (socket, tdp, perf...)
        var byCat = {};
        comps.forEach(function (r) {
          var item = Object.assign({}, r.specs || {}, { id: r.slug, name: r.name, brand: r.brand, price: Number(r.price_vnd) || 0 });
          (byCat[r.category] = byCat[r.category] || []).push(item);
        });
        CATEGORIES.forEach(function (c) {
          if (!byCat[c.key] || !byCat[c.key].length) throw new Error('missing category ' + c.key);
          DATA[c.key] = byCat[c.key];
        });
        DATA.laptops = laptops.map(function (l) {
          return { id: l.slug, name: l.name, brand: l.brand, cpu: l.cpu, cpuScore: l.cpu_score, gpu: l.gpu, gpuPerf: l.gpu_perf, tgp: l.tgp_watts, ram: l.ram_gb, price: Number(l.price_vnd) || 0 };
        });
        DATA.games = games.map(function (g) {
          return { id: g.slug, name: g.name, genre: g.genre, baseFps: Number(g.base_fps) || 0, cpuWeight: Number(g.cpu_weight) || 0 };
        });
        // DB software_apps hiện chưa có cột req → gắn hồ sơ yêu cầu từ bản nhúng theo slug.
        if (software.length) DATA.software = software.map(function (s) { return { id: s.slug, name: s.name, category: s.category, focus: s.focus, req: EMBEDDED_SW_REQ[s.slug] || null }; });
        // Giữ lựa chọn hiện tại nếu còn tồn tại trong dữ liệu sống, không thì về món đầu tiên
        CATEGORIES.forEach(function (c) { if (!findById(DATA[c.key], selected[c.key])) selected[c.key] = DATA[c.key][0].id; });
        if (!findById(DATA.games, fpsState.gameId)) fpsState.gameId = DATA.games[0].id;
        // Dựng lại mọi danh sách phụ thuộc dữ liệu rồi vẽ lại toàn bộ
        $('fpsLaptop').innerHTML = DATA.laptops.map(function (l) {
          return '<option value="' + l.id + '">' + esc(l.name) + ' — ' + esc(l.gpu) + ' ' + l.tgp + 'W — ' + fmt(l.price) + '</option>';
        }).join('');
        $('recoGame').innerHTML = DATA.games.map(function (g) { return '<option value="' + g.id + '">' + esc(g.name) + '</option>'; }).join('');
        $('statsStrip').innerHTML = statsHtml();
        renderGameGrid();
        renderSoftware();
        renderAll();
        renderReco();
        var latest = comps.map(function (r) { return r.updated_at; }).sort().pop();
        status.textContent = 'Dữ liệu sống từ Supabase · Cập nhật lúc: ' + latest;
        status.classList.add('live');
      })
      .catch(function () {
        status.textContent = 'Không tải được dữ liệu sống — đang dùng dữ liệu đóng gói · Cập nhật: ' + DATA.updatedAt.slice(0, 10);
      });
  }

  /* ---------- Khởi tạo ---------- */
  function renderAll() { renderPickers(); renderSummary(); sync3D(); renderFps(); renderSoftware(); }

  function init() {
    $('statsStrip').innerHTML = statsHtml();

    document.querySelectorAll('.tab-btn').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.tab); }); });
    document.querySelectorAll('[data-goto]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); switchTab(a.dataset.goto); }); });
    $('partSearch').addEventListener('input', renderPickers);
    $('partSort').addEventListener('change', renderPickers);
    $('btnResetView').addEventListener('click', function () {
      if (viewMode === 'glb' && glb) { glb.controls.reset(); glb.controls.autoRotate = true; glb.autoWanted = true; }
      else if (viewMode === 'box' && three) { three.rotY = -0.55; three.rotX = 0.25; three.dist = 8.6; }
    });

    // Highlight tương tác phía picker: dùng delegation trên #partPickers để sống sót qua
    // mỗi lần renderPickers() dựng lại DOM. focusin/change → bật highlight + nhãn;
    // rời hẳn khu vực picker → đếm ngược 2,5s tự tắt (armHlTimer cũng chạy sau mỗi lần bật).
    var pk = $('partPickers');
    function pickerSelOf(e) { return e.target && e.target.closest ? e.target.closest('select[data-cat]') : null; }
    pk.addEventListener('focusin', function (e) { var s = pickerSelOf(e); if (s) setPickerHighlight(s.dataset.cat); });
    pk.addEventListener('change', function (e) { var s = pickerSelOf(e); if (s) setPickerHighlight(s.dataset.cat); });
    pk.addEventListener('focusout', function (e) { if (!pk.contains(e.relatedTarget)) armHlTimer(); });

    $('fpsLaptop').innerHTML = DATA.laptops.map(function (l) {
      return '<option value="' + l.id + '">' + esc(l.name) + ' — ' + esc(l.gpu) + ' ' + l.tgp + 'W — ' + fmt(l.price) + '</option>';
    }).join('');
    $('fpsSource').addEventListener('change', function () { $('laptopField').style.display = this.value === 'laptop' ? 'block' : 'none'; renderFps(); });
    $('fpsLaptop').addEventListener('change', renderFps);
    ['fpsRes', 'fpsSetting', 'fpsUpscale'].forEach(function (id) { $(id).addEventListener('change', renderFps); });

    $('recoGame').innerHTML = DATA.games.map(function (g) { return '<option value="' + g.id + '">' + esc(g.name) + '</option>'; }).join('');
    $('btnReco').addEventListener('click', renderReco);

    $('btnCopy').addEventListener('click', function () {
      var text = buildText();
      function done() { $('copyStatus').textContent = 'Đã sao chép ✓'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { $('copyStatus').textContent = text; });
      else { $('copyStatus').textContent = text; }
    });
    $('btnDownload').addEventListener('click', function () {
      var blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'rigcheck-bao-gia.txt'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });

    renderGameGrid();
    renderSoftware();
    renderAll();
    init3D();
    renderReco();
    loadFromSupabase();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
