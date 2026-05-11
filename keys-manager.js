(function() {
  'use strict';

  // Modal structure (injected into DOM)
  function createModal() {
    if (document.getElementById('kp-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'kp-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(8px);';
    modal.innerHTML = `
      <div style="background:var(--surface,#111827);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:16px;padding:24px;width:380px;max-width:90%;color:var(--text,#F3F4F6);box-shadow:0 12px 40px rgba(0,0,0,.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <strong style="font-size:1.1rem;">Inserisci API Key</strong>
          <button id="kp-close" style="background:transparent;border:0;color:var(--text2,#9CA3AF);font-size:20px;cursor:pointer;">&times;</button>
        </div>
        <p style="font-size:.82rem;color:var(--text2,#9CA3AF);margin-bottom:14px;">Inserisci le chiavi per i provider che vuoi utilizzare. Verranno salvate solo nel tuo browser.</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <label style="font-size:.78rem;font-weight:600;color:var(--text2,#9CA3AF);text-transform:uppercase;letter-spacing:.03em;">Gemini</label>
          <input id="kp-gemini" class="field" type="password" placeholder="AIzaSy..." style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border,rgba(255,255,255,.1));background:rgba(255,255,255,.05);color:var(--text,#F3F4F6);font-size:.88rem;outline:none;" />
          <label style="font-size:.78rem;font-weight:600;color:var(--text2,#9CA3AF);text-transform:uppercase;letter-spacing:.03em;">DeepSeek</label>
          <input id="kp-deepseek" class="field" type="password" placeholder="sk-..." style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border,rgba(255,255,255,.1));background:rgba(255,255,255,.05);color:var(--text,#F3F4F6);font-size:.88rem;outline:none;" />
          <label style="font-size:.78rem;font-weight:600;color:var(--text2,#9CA3AF);text-transform:uppercase;letter-spacing:.03em;">Grok (xAI)</label>
          <input id="kp-grok" class="field" type="password" placeholder="xai-..." style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border,rgba(255,255,255,.1));background:rgba(255,255,255,.05);color:var(--text,#F3F4F6);font-size:.88rem;outline:none;" />
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;">
          <button id="kp-save" style="padding:8px 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#F43F5E,#F97316);color:#fff;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s;">Salva e continua</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('kp-close').addEventListener('click', hideModal);
    document.getElementById('kp-save').addEventListener('click', handleSave);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });
  }

  let _pendingResolve = null;

  function showModal(provider, onSaved) {
    createModal();
    const modal = document.getElementById('kp-modal');
    
    // Prefill existing keys
    document.getElementById('kp-gemini').value = localStorage.getItem('gemini_key') || '';
    document.getElementById('kp-deepseek').value = localStorage.getItem('deepseek_key') || '';
    document.getElementById('kp-grok').value = localStorage.getItem('grok_key') || '';
    
    modal.style.display = 'flex';
    
    // Store callback
    _pendingCallback = onSaved || null;
    
    // Return a promise that resolves when user saves
    return new Promise(resolve => {
      _pendingResolve = resolve;
    });
  }

  let _pendingCallback = null;

  function hideModal() {
    const modal = document.getElementById('kp-modal');
    if (modal) modal.style.display = 'none';
    if (_pendingResolve) {
      _pendingResolve(false);
      _pendingResolve = null;
    }
  }

  function handleSave() {
    const gemini = document.getElementById('kp-gemini').value.trim();
    const deepseek = document.getElementById('kp-deepseek').value.trim();
    const grok = document.getElementById('kp-grok').value.trim();
    
    if (gemini) localStorage.setItem('gemini_key', gemini);
    if (deepseek) localStorage.setItem('deepseek_key', deepseek);
    if (grok) localStorage.setItem('grok_key', grok);
    
    // Call the saved callback if provided (e.g., to switch provider)
    if (_pendingCallback) {
      _pendingCallback();
      _pendingCallback = null;
    }
    
    hideModal();
    if (_pendingResolve) {
      _pendingResolve(true);
      _pendingResolve = null;
    }
    // Dispatch event so React components can react
    window.dispatchEvent(new CustomEvent('apikeysaved'));
  }

  // Helper to get key with fallback to prompt
  async function getKey(provider) {
    const storageKey = provider + '_key';
    let key = localStorage.getItem(storageKey);
    if (!key) {
      const saved = await showModal(provider);
      if (saved) {
        key = localStorage.getItem(storageKey);
      }
    }
    return key;
  }

  // Expose to global scope
  window.apiKeyManager = {
    showModal,
    hideModal,
    getKey,
    createModal
  };
})();
