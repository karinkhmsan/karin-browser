class KarinApp {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.history = [];
    this.bookmarks = [
      { title: "Google", url: "https://www.google.com", icon: "fa-google" },
      { title: "YouTube", url: "https://www.youtube.com", icon: "fa-youtube" },
      { title: "GitHub", url: "https://github.com", icon: "fa-github" },
      { title: "Wikipedia", url: "https://en.wikipedia.org", icon: "fa-wikipedia-w" }
    ];
    this.isDarkMode = true;
    this.searchEngine = "https://www.google.com/search?q=";

    this.initElements();
    this.bindEvents();
    this.renderBookmarks();
    this.createTab("karin://start", "Karin Start Page");
  }

  initElements() {
    this.tabBar = document.getElementById("tabBar");
    this.btnNewTab = document.getElementById("btnNewTab");
    this.btnBack = document.getElementById("btnBack");
    this.btnForward = document.getElementById("btnForward");
    this.btnReload = document.getElementById("btnReload");
    this.btnHome = document.getElementById("btnHome");
    this.urlInput = document.getElementById("urlInput");
    this.omniboxForm = document.getElementById("omniboxForm");
    this.securityBadge = document.getElementById("securityBadge");
    this.securityIcon = document.getElementById("securityIcon");
    this.securityText = document.getElementById("securityText");
    this.progressBar = document.getElementById("progressBar");
    this.startPageView = document.getElementById("startPageView");
    this.webviewsContainer = document.getElementById("webviewsContainer");
    this.quickBookmarksList = document.getElementById("quickBookmarksList");
    this.memUsage = document.getElementById("memUsage");
    this.btnBookmarkStar = document.getElementById("btnBookmarkStar");
    this.bookmarkStarIcon = document.getElementById("bookmarkStarIcon");

    // Menu & Modals
    this.btnBrowserMenu = document.getElementById("btnBrowserMenu");
    this.browserDropdown = document.getElementById("browserDropdown");
    this.globalModal = document.getElementById("globalModal");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalBody = document.getElementById("modalBody");
    this.btnModalClose = document.getElementById("btnModalClose");
    this.btnModalAction = document.getElementById("btnModalAction");
  }

  bindEvents() {
    this.btnNewTab.addEventListener("click", () => this.createTab("karin://start", "New Tab"));
    this.btnHome.addEventListener("click", () => this.navigateTo("karin://start"));
    this.btnReload.addEventListener("click", () => this.reloadCurrentTab());
    this.btnBack.addEventListener("click", () => this.navigateBack());
    this.btnForward.addEventListener("click", () => this.navigateForward());

    this.omniboxForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleUrlSubmit();
    });

    document.getElementById("btnThemeToggle").addEventListener("click", () => this.toggleTheme());
    document.getElementById("btnToggleBookmarks").addEventListener("click", () => {
      document.getElementById("bookmarksBar").classList.toggle("hidden");
    });

    this.btnBookmarkStar.addEventListener("click", () => this.toggleBookmark());

    // Window controls
    document.getElementById("btnWindowMin").addEventListener("click", () => window.karinAPI?.minimize());
    document.getElementById("btnWindowMax").addEventListener("click", () => window.karinAPI?.maximize());
    document.getElementById("btnWindowClose").addEventListener("click", () => window.karinAPI?.close());

    // DevTools
    document.getElementById("btnToggleDevTools").addEventListener("click", () => this.toggleDevTools());

    // Menu Actions
    this.btnBrowserMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      this.browserDropdown.classList.toggle("hidden");
    });
    document.addEventListener("click", () => this.browserDropdown.classList.add("hidden"));

    document.getElementById("menuItemNewTab").addEventListener("click", () => this.createTab("karin://start", "New Tab"));
    document.getElementById("menuItemHistory").addEventListener("click", () => this.openHistory());
    document.getElementById("menuItemDevTools").addEventListener("click", () => this.toggleDevTools());
    document.getElementById("menuItemSettings").addEventListener("click", () => this.openSettings());
    document.getElementById("menuItemAbout").addEventListener("click", () => this.openAbout());

    this.btnModalClose.addEventListener("click", () => this.globalModal.classList.add("hidden"));
    this.btnModalAction.addEventListener("click", () => this.globalModal.classList.add("hidden"));

    // Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        this.createTab("karin://start", "New Tab");
      } else if (e.ctrlKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (this.activeTabId) this.closeTab(this.activeTabId);
      } else if (e.ctrlKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        this.reloadCurrentTab();
      } else if (e.key === "F12") {
        e.preventDefault();
        this.toggleDevTools();
      }
    });
  }

  createTab(url = "karin://start", title = "New Tab") {
    const tabId = "tab_" + Date.now();
    let webview = null;

    if (!url.startsWith("karin://")) {
      webview = this.createWebviewElement(tabId, url);
      this.webviewsContainer.appendChild(webview);
    }

    const tab = { id: tabId, url, title, webview };
    this.tabs.push(tab);
    this.switchTab(tabId);
    this.updateMemory();
  }

  createWebviewElement(tabId, url) {
    const wv = document.createElement("webview");
    wv.id = `view_${tabId}`;
    wv.src = url;
    wv.setAttribute("allowpopups", "true");

    wv.addEventListener("did-start-loading", () => {
      this.progressBar.classList.remove("hidden");
    });
    wv.addEventListener("did-stop-loading", () => {
      this.progressBar.classList.add("hidden");
      this.updateTabInfo(tabId, wv.getTitle(), wv.getURL());
    });
    wv.addEventListener("page-title-updated", (e) => {
      this.updateTabInfo(tabId, e.title, wv.getURL());
    });
    return wv;
  }

  updateTabInfo(tabId, title, url) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;
    if (title) tab.title = title;
    if (url) {
      tab.url = url;
      this.recordHistory(url, title);
    }
    if (this.activeTabId === tabId) {
      this.updateAddressBar(tab.url);
      this.updateBookmarkButton();
    }
    this.renderTabs();
  }

  switchTab(tabId) {
    this.activeTabId = tabId;
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    // ซ่อน / แสดง Webviews ทั้งหมด
    this.tabs.forEach(t => {
      if (t.webview) {
        if (t.id === tabId && !t.url.startsWith("karin://")) {
          t.webview.classList.add("active");
        } else {
          t.webview.classList.remove("active");
        }
      }
    });

    if (tab.url.startsWith("karin://start")) {
      this.startPageView.classList.remove("hidden");
      this.renderStartPage();
    } else {
      this.startPageView.classList.add("hidden");
    }

    this.updateAddressBar(tab.url);
    this.updateBookmarkButton();
    this.renderTabs();
  }

  closeTab(tabId) {
    if (this.tabs.length <= 1) {
      this.navigateTo("karin://start");
      return;
    }
    const idx = this.tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    const tab = this.tabs[idx];
    if (tab.webview) this.webviewsContainer.removeChild(tab.webview);
    this.tabs.splice(idx, 1);

    if (this.activeTabId === tabId) {
      const nextTab = this.tabs[Math.max(0, idx - 1)];
      this.switchTab(nextTab.id);
    } else {
      this.renderTabs();
    }
    this.updateMemory();
  }

  renderTabs() {
    this.tabBar.innerHTML = "";
    this.tabs.forEach(tab => {
      const isActive = tab.id === this.activeTabId;
      const el = document.createElement("div");
      el.className = `karin-tab flex items-center gap-2 px-3 py-2 rounded-t-xl text-xs max-w-[200px] min-w-[120px] cursor-pointer border-t border-x ${
        isActive
          ? "active border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
          : "border-transparent text-slate-500 hover:bg-slate-300/50 dark:hover:bg-slate-800/40"
      }`;

      const icon = tab.url.startsWith("karin://") ? "fa-compass text-karin-500" : "fa-globe text-indigo-400";
      el.innerHTML = `
        <i class="fa-solid ${icon} text-[11px] shrink-0"></i>
        <span class="truncate flex-1 pointer-events-none">${tab.title || 'แท็บใหม่'}</span>
        <button class="close-btn p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
          <i class="fa-solid fa-xmark text-[10px]"></i>
        </button>
      `;

      el.addEventListener("click", () => this.switchTab(tab.id));
      el.querySelector(".close-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeTab(tab.id);
      });
      this.tabBar.appendChild(el);
    });
  }

  handleUrlSubmit() {
    let input = this.urlInput.value.trim();
    if (!input) return;

    let target = input;
    if (input.startsWith("karin://")) {
      target = input;
    } else if (/^https?:\/\//i.test(input)) {
      target = input;
    } else if (input.includes(".") && !input.includes(" ")) {
      target = "https://" + input;
    } else {
      target = this.searchEngine + encodeURIComponent(input);
    }

    this.navigateTo(target);
  }

  navigateTo(url) {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (!tab) return;

    tab.url = url;
    if (url.startsWith("karin://start")) {
      tab.title = "Karin Start Page";
      if (tab.webview) tab.webview.classList.remove("active");
      this.startPageView.classList.remove("hidden");
      this.renderStartPage();
    } else {
      this.startPageView.classList.add("hidden");
      if (!tab.webview) {
        tab.webview = this.createWebviewElement(tab.id, url);
        this.webviewsContainer.appendChild(tab.webview);
      } else {
        tab.webview.loadURL(url);
      }
      tab.webview.classList.add("active");
    }

    this.updateAddressBar(url);
    this.renderTabs();
  }

  renderStartPage() {
    this.startPageView.innerHTML = `
      <div class="min-h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 select-none">
        
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-karin-600 via-karin-500 to-indigo-500 shadow-xl shadow-karin-500/20 mb-4 transform hover:scale-105 transition duration-300">
            <i class="fa-solid fa-wind text-4xl text-white"></i>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-karin-500 to-indigo-500 bg-clip-text text-transparent">
            Karin Browser
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Lightweight, Ultra-Fast & Resource Friendly</p>
        </div>

        <div class="w-full max-w-xl mb-10">
          <div class="relative flex items-center">
            <i class="fa-solid fa-magnifying-glass absolute left-4 text-slate-400 text-sm"></i>
            <input 
              id="startSearchInput" 
              type="text" 
              placeholder="ค้นหาด้วย Google หรือพิมพ์ URL..."
              class="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 shadow-xl border border-slate-200 dark:border-slate-700/80 focus:border-karin-500 focus:ring-4 focus:ring-karin-500/20 outline-none text-sm transition"
            />
            <button id="btnStartSearchSubmit" class="absolute right-2 px-4 py-2 bg-karin-500 hover:bg-karin-600 text-white rounded-xl text-xs font-medium transition shadow-md shadow-karin-500/30">
              ค้นหา
            </button>
          </div>
        </div>

        <div class="w-full max-w-2xl mb-10">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1 flex items-center justify-between">
            <span>ทางลัดด่วน (Quick Access)</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${this.bookmarks.map(bm => `
              <div class="shortcut-card bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 hover:border-karin-500/50 hover:shadow-lg p-3.5 rounded-xl cursor-pointer transition flex items-center gap-3 group" data-url="${bm.url}">
                <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-karin-500 group-hover:text-white transition">
                  <i class="fa-brands ${bm.icon || 'fa-globe'} text-lg"></i>
                </div>
                <div class="overflow-hidden">
                  <p class="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">${bm.title}</p>
                  <p class="text-[10px] text-slate-400 truncate">${bm.url.replace(/^https?:\/\//, '')}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    const searchInput = document.getElementById("startSearchInput");
    const searchBtn = document.getElementById("btnStartSearchSubmit");
    const doSearch = () => {
      const q = searchInput.value.trim();
      if (q) this.navigateTo(this.searchEngine + encodeURIComponent(q));
    };
    searchBtn.addEventListener("click", doSearch);
    searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

    document.querySelectorAll(".shortcut-card").forEach(c => {
      c.addEventListener("click", () => this.navigateTo(c.dataset.url));
    });
  }

  updateAddressBar(url) {
    this.urlInput.value = url;
    if (url.startsWith("https://")) {
      this.securityBadge.className = "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mr-2 font-medium";
      this.securityIcon.className = "fa-solid fa-lock text-[11px]";
      this.securityText.innerText = "Secure";
    } else if (url.startsWith("karin://")) {
      this.securityBadge.className = "flex items-center gap-1.5 text-karin-500 mr-2 font-medium";
      this.securityIcon.className = "fa-solid fa-shield-halved text-[11px]";
      this.securityText.innerText = "Karin System";
    } else {
      this.securityBadge.className = "flex items-center gap-1.5 text-amber-500 mr-2 font-medium";
      this.securityIcon.className = "fa-solid fa-triangle-exclamation text-[11px]";
      this.securityText.innerText = "Not Secure";
    }
  }

  toggleBookmark() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (!tab || tab.url.startsWith("karin://")) return;

    const idx = this.bookmarks.findIndex(b => b.url === tab.url);
    if (idx >= 0) {
      this.bookmarks.splice(idx, 1);
    } else {
      this.bookmarks.push({ title: tab.title || "เว็บโปรด", url: tab.url, icon: "fa-globe" });
    }
    this.updateBookmarkButton();
    this.renderBookmarks();
  }

  updateBookmarkButton() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (!tab) return;
    const isBookmarked = this.bookmarks.some(b => b.url === tab.url);
    this.bookmarkStarIcon.className = isBookmarked ? "fa-solid fa-star text-amber-500 text-xs" : "fa-regular fa-star text-xs";
  }

  renderBookmarks() {
    this.quickBookmarksList.innerHTML = "";
    this.bookmarks.forEach(bm => {
      const btn = document.createElement("button");
      btn.className = "flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition truncate max-w-[130px]";
      btn.innerHTML = `
        <i class="fa-brands ${bm.icon || 'fa-globe'} text-[11px] text-slate-500"></i>
        <span class="truncate">${bm.title}</span>
      `;
      btn.addEventListener("click", () => this.navigateTo(bm.url));
      this.quickBookmarksList.appendChild(btn);
    });
  }

  recordHistory(url, title) {
    if (url.startsWith("karin://")) return;
    this.history.unshift({ url, title: title || url, time: new Date().toLocaleTimeString() });
    if (this.history.length > 50) this.history.pop();
  }

  openHistory() {
    this.modalTitle.innerHTML = `<i class="fa-solid fa-clock-rotate-left text-karin-500 mr-2"></i> ประวัติการเข้าชม (History)`;
    if (this.history.length === 0) {
      this.modalBody.innerHTML = `<p class="text-slate-400 text-center py-6">ไม่มีประวัติการท่องเว็บ</p>`;
    } else {
      this.modalBody.innerHTML = `
        <div class="divide-y divide-slate-100 dark:divide-slate-700/60">
          ${this.history.map(item => `
            <div class="py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-lg cursor-pointer" onclick="karin.navigateTo('${item.url}'); karin.globalModal.classList.add('hidden');">
              <div class="overflow-hidden pr-2">
                <p class="font-medium text-slate-800 dark:text-slate-200 truncate">${item.title}</p>
                <p class="text-[10px] text-slate-400 truncate">${item.url}</p>
              </div>
              <span class="text-[10px] text-slate-400 font-mono shrink-0">${item.time}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    this.globalModal.classList.remove("hidden");
  }

  openSettings() {
    this.modalTitle.innerHTML = `<i class="fa-solid fa-sliders text-karin-500 mr-2"></i> ตั้งค่า Karin Browser`;
    this.modalBody.innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 mb-1">SEARCH ENGINE เริ่มต้น</label>
          <select id="settingEngine" class="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs outline-none">
            <option value="https://www.google.com/search?q=" ${this.searchEngine.includes('google') ? 'selected' : ''}>Google Search</option>
            <option value="https://duckduckgo.com/?q=" ${this.searchEngine.includes('duckduckgo') ? 'selected' : ''}>DuckDuckGo</option>
          </select>
        </div>
      </div>
    `;
    this.btnModalAction.onclick = () => {
      this.searchEngine = document.getElementById("settingEngine").value;
      this.globalModal.classList.add("hidden");
    };
    this.globalModal.classList.remove("hidden");
  }

  openAbout() {
    this.modalTitle.innerHTML = `<i class="fa-solid fa-wind text-karin-500 mr-2"></i> เกี่ยวกับ Karin Browser`;
    this.modalBody.innerHTML = `
      <div class="text-center py-4 space-y-3">
        <div class="inline-flex p-3 rounded-2xl bg-karin-500/10 text-karin-500 text-3xl">
          <i class="fa-solid fa-wind"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white">Karin Browser v1.4.0</h3>
        <p class="text-slate-500 text-[11px] max-w-sm mx-auto">
          เบราว์เซอร์ Open-Source แบบเบาพิเศษ กิน RAM ต่ำ ออกแบบมาเพื่อประสิทธิภาพสูงสุด
        </p>
      </div>
    `;
    this.btnModalAction.onclick = () => this.globalModal.classList.add("hidden");
    this.globalModal.classList.remove("hidden");
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add("dark");
      document.getElementById("themeIcon").className = "fa-solid fa-sun text-xs text-amber-400";
    } else {
      document.documentElement.classList.remove("dark");
      document.getElementById("themeIcon").className = "fa-solid fa-moon text-xs";
    }
  }

  updateMemory() {
    const total = 42 + (this.tabs.length * 14);
    this.memUsage.innerText = `RAM: ${total} MB`;
  }

  reloadCurrentTab() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (tab?.webview) tab.webview.reload();
  }

  navigateBack() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (tab?.webview && tab.webview.canGoBack()) tab.webview.goBack();
  }

  navigateForward() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (tab?.webview && tab.webview.canGoForward()) tab.webview.goForward();
  }

  toggleDevTools() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (tab?.webview) {
      if (tab.webview.isDevToolsOpened()) tab.webview.closeDevTools();
      else tab.webview.openDevTools();
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.karin = new KarinApp();
});