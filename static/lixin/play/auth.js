/* ============================================================
   Lixin · 精灵学院  ——  账号系统 (auth.js)
   邮箱 + 密码注册/登录；SHA-256 加盐哈希（不可用时降级为本地哈希）；
   会话写入 localStorage，默认长期保持登录，打开即进游戏。
   存档按账号隔离；支持游客试玩、登出与切换账号。
   ============================================================ */
(function (global) {
  'use strict';

  const K_USERS = 'lixin_mon_users';
  const K_SESSION = 'lixin_mon_session';
  const K_SAVE = 'lixin_mon_save_';
  const GUEST = '__guest__';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function ls(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* 降级哈希：crypto.subtle 在 http/file 场景可能不可用 */
  function fallbackHash(str) {
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = (h1 ^ c) >>> 0; h1 = (h1 * 16777619) >>> 0;
      h2 = (h2 + c * (i + 7)) >>> 0; h2 = ((h2 << 13) | (h2 >>> 19)) >>> 0;
    }
    return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') +
            str.length.toString(16).padStart(4, '0'));
  }

  function sha256(str) {
    const c = global.crypto;
    if (c && c.subtle && c.subtle.digest && global.isSecureContext !== false) {
      try {
        return c.subtle.digest('SHA-256', new TextEncoder().encode(str))
          .then(function (buf) {
            return Array.prototype.map.call(new Uint8Array(buf), function (b) {
              return b.toString(16).padStart(2, '0');
            }).join('');
          })
          .catch(function () { return Promise.resolve(fallbackHash(str)); });
      } catch (e) { /* fallthrough */ }
    }
    return Promise.resolve(fallbackHash(str));
  }

  function salt() {
    const a = new Uint8Array(8);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(a);
    else for (let i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function uidOf(email) {
    return 'u' + fallbackHash(String(email).toLowerCase().trim()).slice(0, 12);
  }

  const Auth = {
    users: {},
    current: null,      // 当前账号邮箱（游客为 __guest__）
    profile: null,      // {email,nick,createdAt}
    listeners: [],

    loadUsers: function () {
      try { this.users = JSON.parse(ls(K_USERS, '{}')) || {}; } catch (e) { this.users = {}; }
      return this.users;
    },
    saveUsers: function () { lsSet(K_USERS, JSON.stringify(this.users)); },

    onChange: function (fn) { this.listeners.push(fn); },
    emit: function () { this.listeners.forEach(function (f) { try { f(); } catch (e) {} }); },

    /* ---------- 会话 ---------- */
    restore: function () {
      this.loadUsers();
      let email = null;
      try { const s = JSON.parse(ls(K_SESSION, 'null')); if (s && s.email) email = s.email; } catch (e) {}
      if (email === GUEST) { this.current = GUEST; this.profile = { email: GUEST, nick: '游客' }; return true; }
      if (email && this.users[email]) {
        this.current = email;
        this.profile = this.users[email];
        this.users[email].lastLogin = Date.now();
        this.saveUsers();
        return true;
      }
      return false;
    },
    login: function (email, pwd) {
      return new Promise(function (resolve, reject) {
        email = String(email || '').trim().toLowerCase();
        const u = Auth.users[email];
        if (!u) return reject(new Error('该邮箱尚未注册'));
        sha256(u.salt + '|' + pwd).then(function (h) {
          if (h !== u.hash) return reject(new Error('密码不正确'));
          Auth.current = email; Auth.profile = u;
          u.lastLogin = Date.now(); Auth.saveUsers();
          lsSet(K_SESSION, JSON.stringify({ email: email, at: Date.now() }));
          Auth.emit(); resolve(u);
        });
      });
    },
    register: function (email, pwd, nick) {
      return new Promise(function (resolve, reject) {
        email = String(email || '').trim().toLowerCase();
        if (!EMAIL_RE.test(email)) return reject(new Error('请输入有效的邮箱地址'));
        if (String(pwd || '').length < 6) return reject(new Error('密码至少 6 位'));
        if (Auth.users[email]) return reject(new Error('该邮箱已注册，请直接登录'));
        const s = salt();
        sha256(s + '|' + pwd).then(function (h) {
          const u = {
            email: email, salt: s, hash: h,
            nick: (String(nick || '').trim() || email.split('@')[0]).slice(0, 16),
            createdAt: Date.now(), lastLogin: Date.now()
          };
          Auth.users[email] = u; Auth.saveUsers();
          Auth.current = email; Auth.profile = u;
          lsSet(K_SESSION, JSON.stringify({ email: email, at: Date.now(), remember: true }));
          Auth.emit(); resolve(u);
        });
      });
    },
    guest: function () {
      this.current = GUEST;
      this.profile = { email: GUEST, nick: '游客' };
      lsSet(K_SESSION, JSON.stringify({ email: GUEST, at: Date.now() }));
      this.emit();
    },
    logout: function () {
      this.current = null; this.profile = null;
      lsDel(K_SESSION);
      this.emit();
    },

    /* ---------- 存档（按账号隔离） ---------- */
    loadSave: function () {
      const uid = uidOf(this.current || GUEST);
      try { const raw = ls(K_SAVE + uid, ''); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    writeSave: function (obj) {
      const uid = uidOf(this.current || GUEST);
      return lsSet(K_SAVE + uid, JSON.stringify(obj));
    },

    /* ---------- 界面 ---------- */
    root: null,
    ensureUI: function () {
      if (this.root) return this.root;
      const d = document.createElement('div');
      d.id = 'monAuth';
      d.innerHTML =
        '<div class="ma-card">' +
        '  <div class="ma-brand">🎒 Lixin · 精灵学院</div>' +
        '  <div class="ma-sub">注册即自动登录，之后打开页面无需再输</div>' +
        '  <div class="ma-tabs"><button class="ma-tab on" data-t="login">登录</button>' +
        '    <button class="ma-tab" data-t="reg">注册</button></div>' +
        '  <div class="ma-body"></div>' +
        '  <div class="ma-msg"></div>' +
        '  <button class="ma-guest">先不登录，游客试玩 →</button>' +
        '  <div class="ma-note">账号与精灵数据保存在<b>本机浏览器</b>，不上传服务器；换设备或清理缓存会丢失，请用邮箱注册以便自己记住。</div>' +
        '</div>';
      document.body.appendChild(d);
      this.root = d;

      const body = d.querySelector('.ma-body');
      const msg = d.querySelector('.ma-msg');
      let tab = 'login';

      function form() {
        if (tab === 'login') {
          body.innerHTML =
            '<label>邮箱</label><input class="ma-in" id="maEmail" type="email" placeholder="you@example.com" autocomplete="username" />' +
            '<label>密码</label><input class="ma-in" id="maPwd" type="password" placeholder="登录密码" autocomplete="current-password" />' +
            '<button class="ma-go" id="maGo">登录并进入校园</button>';
        } else {
          body.innerHTML =
            '<label>邮箱</label><input class="ma-in" id="maEmail" type="email" placeholder="you@example.com" autocomplete="username" />' +
            '<label>昵称（可留空）</label><input class="ma-in" id="maNick" type="text" placeholder="训练家名号" />' +
            '<label>密码（至少 6 位）</label><input class="ma-in" id="maPwd" type="password" placeholder="设置密码" autocomplete="new-password" />' +
            '<button class="ma-go" id="maGo">注册并开始冒险</button>';
        }
        const go = document.getElementById('maGo');
        const pwd = document.getElementById('maPwd');
        function submit() {
          msg.className = 'ma-msg';
          const em = document.getElementById('maEmail').value;
          const pw = pwd.value;
          const nk = document.getElementById('maNick') ? document.getElementById('maNick').value : '';
          go.disabled = true; go.textContent = '处理中…';
          const p = (tab === 'login') ? Auth.login(em, pw) : Auth.register(em, pw, nk);
          p.then(function () {
            go.disabled = false;
            Auth.close();
          }).catch(function (err) {
            go.disabled = false;
            go.textContent = (tab === 'login') ? '登录并进入校园' : '注册并开始冒险';
            msg.textContent = '⚠ ' + (err.message || err);
            msg.className = 'ma-msg show';
          });
        }
        go.onclick = submit;
        pwd.addEventListener('keydown', function (e) { if (e.code === 'Enter') submit(); });
      }

      d.querySelectorAll('.ma-tab').forEach(function (b) {
        b.onclick = function () {
          d.querySelectorAll('.ma-tab').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on'); tab = b.getAttribute('data-t'); form();
        };
      });
      d.querySelector('.ma-guest').onclick = function () { Auth.guest(); Auth.close(); };
      form();
      return d;
    },
    open: function () {
      const d = this.ensureUI();
      // 从「个人信息」态切回表单态
      d.querySelector('.ma-guest').style.display = '';
      d.querySelector('.ma-tabs').style.display = '';
      d.querySelector('.ma-sub').textContent = '注册即自动登录，之后打开页面无需再输';
      d.querySelector('.ma-msg').className = 'ma-msg';
      const on = d.querySelector('.ma-tab.on') || d.querySelector('.ma-tab');
      if (on) on.click();
      d.classList.add('show');
    },
    close: function () {
      if (this.root) this.root.classList.remove('show');
      if (global.MonGame && global.MonGame.onAuthReady) global.MonGame.onAuthReady();
    },
    isOpen: function () { return !!this.root && this.root.classList.contains('show'); },

    /* 账号信息面板（HUD「账号」按钮） */
    openProfile: function () {
      const d = this.ensureUI();
      d.classList.add('show');
      if (this.current && this.current !== GUEST) {
        const u = this.users[this.current] || {};
        d.querySelector('.ma-body').innerHTML =
          '<div class="ma-prof"><div class="ma-av">' + (u.nick || '训').slice(0, 1) + '</div>' +
          '<div><p class="ma-nm">' + escapeHtml(u.nick || '训练家') + '</p>' +
          '<div class="ma-em">' + escapeHtml(this.current) + '</div>' +
          '<div class="ma-em">注册于 ' + fmtDate(u.createdAt) + '</div></div></div>' +
          '<button class="ma-go ghost" id="maSwitch">切换 / 登录其它账号</button>' +
          '<button class="ma-go ghost" id="maOut" style="margin-top:8px">退出登录</button>';
        d.querySelector('.ma-guest').style.display = 'none';
        d.querySelector('.ma-tabs').style.display = 'none';
        d.querySelector('.ma-sub').textContent = '已登录 · 数据保存在本机';
        const sw = document.getElementById('maSwitch');
        const out = document.getElementById('maOut');
        sw.onclick = function () {
          Auth.logout();
          d.querySelector('.ma-guest').style.display = '';
          d.querySelector('.ma-tabs').style.display = '';
          d.querySelector('.ma-msg').className = 'ma-msg';
          d.querySelector('.ma-tab[data-t="login"]').click();
        };
        out.onclick = function () {
          Auth.logout(); Auth.close();
          if (global.MonGame) global.MonGame.toast('已退出登录');
        };
      }
    },

    boot: function () {
      this.loadUsers();
      if (this.restore()) {
        // 已记住登录态：不放弹窗
        if (global.MonGame && global.MonGame.onAuthReady) global.MonGame.onAuthReady();
        return true;
      }
      // 首次进入直接使用本机游客存档，避免连续出现“形象 → 登录 → 初始精灵”三层阻断。
      // 账号仍可从 HUD 随时注册或切换，已有账号继续自动登录。
      this.guest();
      if (global.MonGame && global.MonGame.onAuthReady) global.MonGame.onAuthReady();
      return true;
    }
  };

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 样式 ---------- */
  const CSS =
    '#monAuth{position:fixed;inset:0;z-index:9998;display:none;align-items:center;justify-content:center;' +
    'background:rgba(24,18,12,.72);backdrop-filter:blur(3px);padding:16px;overflow:auto;}' +
    '#monAuth.show{display:flex;}' +
    '.ma-card{width:min(420px,100%);background:linear-gradient(180deg,#fffaf0,#f7ead2);' +
    'border:4px solid #8a5a3b;border-radius:20px;box-shadow:0 14px 40px rgba(40,26,12,.45);padding:20px 20px 16px;}' +
    '.ma-brand{font-size:24px;color:#6e452c;text-align:center;letter-spacing:.05em;}' +
    '.ma-sub{font-size:12px;color:#8a7a62;text-align:center;margin-top:4px;}' +
    '.ma-tabs{display:flex;gap:8px;margin:14px 0 10px;}' +
    '.ma-tab{flex:1;font-family:inherit;cursor:pointer;border:2px solid #d9c7a3;background:#fff;color:#8a7a62;' +
    'border-radius:999px;padding:7px 0;font-size:14px;}' +
    '.ma-tab.on{background:#d98a1f;border-color:#b9700f;color:#fff;}' +
    '.ma-body label{display:block;font-size:12px;color:#6b5a44;margin:10px 0 4px;}' +
    '.ma-in{width:100%;font-family:inherit;font-size:15px;padding:9px 12px;border:2px solid #d9c7a3;' +
    'border-radius:10px;background:#fff;color:#3a2f25;outline:none;}' +
    '.ma-in:focus{border-color:#d98a1f;}' +
    '.ma-go{width:100%;margin-top:14px;font-family:inherit;cursor:pointer;border:none;border-radius:999px;' +
    'padding:11px 0;font-size:16px;background:#d98a1f;color:#fff;box-shadow:0 3px 0 #b9700f;}' +
    '.ma-go:active{transform:translateY(2px);box-shadow:0 1px 0 #b9700f;}' +
    '.ma-go:disabled{opacity:.6;}' +
    '.ma-go.ghost{background:#fff;color:#6e452c;box-shadow:0 3px 0 #d9c7a3;}' +
    '.ma-msg{display:none;margin-top:10px;font-size:13px;color:#c0392b;text-align:center;}' +
    '.ma-msg.show{display:block;}' +
    '.ma-guest{display:block;width:100%;margin-top:12px;background:none;border:none;cursor:pointer;' +
    'font-family:inherit;font-size:13px;color:#6b5a44;text-decoration:underline;}' +
    '.ma-note{margin-top:10px;font-size:11px;line-height:1.6;color:#98876c;text-align:center;}' +
    '.ma-prof{display:flex;gap:14px;align-items:center;background:#fff;border:2px solid #e6d5b4;' +
    'border-radius:14px;padding:12px;margin-top:6px;}' +
    '.ma-av{width:54px;height:54px;flex:none;border-radius:50%;background:#d98a1f;color:#fff;' +
    'display:flex;align-items:center;justify-content:center;font-size:24px;}' +
    '.ma-nm{margin:0;font-size:17px;color:#3a2f25;}' +
    '.ma-em{font-size:12px;color:#8a7a62;word-break:break-all;}';

  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  Auth.escapeHtml = escapeHtml;
  global.MonAuth = Auth;
})(window);
