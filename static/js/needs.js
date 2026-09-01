/* DeepSleep · 需求投递前端
 * 两段式上传: 1) 取 COS 预签名 PUT URL  2) XHR 直传(带进度)  3) 提交元数据
 */
(function () {
  'use strict';
  var API = 'https://1437998910-ej8ywfrb5q.ap-shanghai.tencentscf.com';
  var MAX_SIZE = 20 * 1024 * 1024;
  var ALLOWED = ['.doc', '.docx', '.pdf', '.rtf', '.odt', '.txt', '.md'];
  var CONTACT_RE = {
    phone: /^1[3-9]\d{9}$/,
    wechat: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    qq: /^\d{5,12}$/,
    other: /^.{2,60}$/
  };
  var CONTACT_ERR = {
    phone: '请填写 11 位手机号',
    wechat: '微信号格式不正确（字母开头，6-20 位）',
    email: '邮箱格式不正确',
    qq: 'QQ 号应为 5-12 位数字',
    other: '请填写 2-60 字联系方式'
  };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function extOf(name) { var i = name.toLowerCase().lastIndexOf('.'); return i >= 0 ? name.slice(i) : ''; }
  function fmtSize(n) { if (!n) return ''; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'; return (n / 1048576).toFixed(1) + ' MB'; }
  function setMsg(type, text) {
    var m = $('nf-msg'); if (!m) return;
    m.className = 'nf-msg ' + (type || '');
    m.textContent = text || '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = $('needsForm');
    if (!form) return;
    var slug = form.getAttribute('data-slug') || '';
    var title = form.getAttribute('data-title') || '';

    var drop = $('nf-drop'), fileInput = $('nf-file');
    var fileInfo = $('nf-fileinfo'), fnameEl = $('nf-filename'), fsizeEl = $('nf-filesize');
    var progress = $('nf-progress'), pbar = $('nf-progress-bar'), ptext = $('nf-progress-text');
    var submitBtn = $('nf-submit');

    var pending = null; // {key, name, size, mime}

    function showFile(file) {
      fnameEl.textContent = file.name;
      fsizeEl.textContent = fmtSize(file.size);
      fileInfo.hidden = false;
      drop.hidden = true;
      progress.hidden = true;
    }
    function clearFile() {
      pending = null; fileInput.value = '';
      fileInfo.hidden = true; drop.hidden = false; progress.hidden = true;
      pbar.style.width = '0%';
    }

    drop.addEventListener('click', function () { fileInput.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handlePick(f);
    });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) handlePick(fileInput.files[0]); });
    $('nf-fileclear').addEventListener('click', clearFile);

    function handlePick(file) {
      var ext = extOf(file.name);
      if (ALLOWED.indexOf(ext) < 0) { setMsg('err', '仅支持 ' + ALLOWED.join(' / ') + ' 格式'); return; }
      if (file.size > MAX_SIZE || file.size < 100) { setMsg('err', '文件大小需在 100KB ~ 20MB 之间'); return; }
      setMsg('', '');
      pending = { name: file.name, size: file.size, mime: file.type || 'application/octet-stream', _file: file };
      showFile(file);
    }

    function uploadToCos() {
      return new Promise(function (resolve, reject) {
        if (!pending) return reject(new Error('no file'));
        var xhr = new XMLHttpRequest();
        xhr.open('POST', API + '/api/needs/upload-url', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
          if (xhr.status !== 200) { try { var d = JSON.parse(xhr.responseText); reject(new Error(d.error || '获取上传地址失败')); } catch (e) { reject(new Error('获取上传地址失败')); } return; }
          var d = JSON.parse(xhr.responseText);
          if (!d.ok || !d.putUrl) return reject(new Error('获取上传地址失败'));
          pending.key = d.key;
          // 直传 COS
          var up = new XMLHttpRequest();
          up.open('PUT', d.putUrl, true);
          up.setRequestHeader('Content-Type', 'application/octet-stream');
          up.upload.onprogress = function (e) {
            if (e.lengthComputable) {
              var pct = Math.round(e.loaded / e.total * 100);
              pbar.style.width = pct + '%';
              ptext.textContent = '上传中 ' + pct + '%';
            }
          };
          up.onload = function () {
            if (up.status >= 200 && up.status < 300) resolve(pending);
            else reject(new Error('文件上传失败（' + up.status + '）'));
          };
          up.onerror = function () { reject(new Error('网络错误，文件上传失败')); };
          up.send(pending._file);
        };
        xhr.onerror = function () { reject(new Error('网络错误，请稍后重试')); };
        xhr.send(JSON.stringify({ projectSlug: slug, filename: pending.name, size: pending.size }));
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setMsg('', '');
      var name = $('nf-name').value.trim();
      var ctype = $('nf-ctype').value;
      var contact = $('nf-contact').value.trim();
      var message = $('nf-msg') ? $('nf-msg').value.trim() : '';

      if (!name) { setMsg('err', '请填写姓名 / 昵称'); return; }
      if (!CONTACT_RE[ctype].test(contact)) { setMsg('err', CONTACT_ERR[ctype]); return; }
      if (!pending || !pending.key) { setMsg('err', '请上传 Word/PDF 文档'); return; }

      submitBtn.disabled = true;
      setMsg('info', '正在上传文档…');
      progress.hidden = false; pbar.style.width = '0%'; ptext.textContent = '上传中…';

      uploadToCos().then(function (up) {
        setMsg('info', '文档已上传，正在提交…');
        return fetch(API + '/api/needs/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectSlug: slug, projectTitle: title, name: name,
            contactType: ctype, contact: contact, message: message,
            file: { key: up.key, name: up.name, size: up.size, mime: up.mime }
          })
        }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); });
      }).then(function (res) {
        if (res.ok && res.d.ok) {
          setMsg('ok', '✅ 提交成功！我已收到你的投递，会在 24 小时内通过你留的' + ctypeLabel(ctype) + '联系你。');
          form.reset(); clearFile(); progress.hidden = true;
        } else {
          setMsg('err', (res.d && res.d.error) || '提交失败，请稍后重试');
          submitBtn.disabled = false;
        }
      }).catch(function (err) {
        setMsg('err', (err && err.message) || '提交失败，请稍后重试');
        submitBtn.disabled = false;
      });
    });

    function ctypeLabel(t) {
      return { phone: '手机号', wechat: '微信号', email: '邮箱', qq: 'QQ', other: '联系方式' }[t] || '联系方式';
    }
  });
})();
