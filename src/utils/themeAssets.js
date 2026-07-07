// Codex改动：统一生成主题静态资源路径，V2Board 主题包会优先使用面板设置 logo，再回退到当前主题目录。
function cleanAssetPath(assetPath) {
  return String(assetPath || '').replace(/^\/+/, '');
}

function getInjectedThemeAssets() {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.EZ_THEME_ASSETS || {};
}

function normalizeThemeBase(basePath) {
  if (!basePath) {
    return '';
  }

  return String(basePath).replace(/\/?$/, '/');
}

function uniquePaths(paths) {
  const seen = new Set();

  return paths.filter((path) => {
    if (!path || seen.has(path)) {
      return false;
    }

    seen.add(path);
    return true;
  });
}

function resolvePath(path) {
  if (typeof window === 'undefined' || !path) {
    return path || '';
  }

  try {
    return new URL(path, window.location.origin).href;
  } catch (error) {
    return path;
  }
}

function getThemeBaseFromScripts() {
  const scriptSrc = Array.from(document.scripts || [])
    .map((script) => script.src || '')
    .reverse()
    .find((src) => /\/theme\/[^/]+\//.test(src));

  if (!scriptSrc) {
    return '';
  }

  try {
    const themeBase = scriptSrc.replace(/\/(?:static\/js\/)?[^/]*\.js(?:\?.*)?$/, '/');
    return new URL(themeBase, window.location.href).pathname;
  } catch (error) {
    console.warn('生成主题资源路径失败:', error);
    return '';
  }
}

export function getThemeBasePath() {
  if (typeof window === 'undefined') {
    return '/';
  }

  const injectedBase = normalizeThemeBase(getInjectedThemeAssets().themeBase);
  if (injectedBase) {
    return injectedBase;
  }

  return normalizeThemeBase(getThemeBaseFromScripts());
}

export function getThemeLogoPath() {
  return getThemeLogoFallbackPaths()[0] || '';
}

export function getThemeLogoFallbackPaths() {
  if (typeof window !== 'undefined') {
    const injectedFallbacks = getInjectedThemeAssets().logoFallbacks;
    if (Array.isArray(injectedFallbacks) && injectedFallbacks.length > 0) {
      return uniquePaths(injectedFallbacks);
    }
  }

  return uniquePaths([
    getThemeAssetPath('images/logo.png', { preferPanelLogo: false }),
    '/logo.png'
  ]);
}

export function getThemeFaviconPath() {
  return getThemeFaviconFallbackPaths()[0] || '';
}

export function getThemeFaviconFallbackPaths() {
  if (typeof window !== 'undefined') {
    const injectedFallbacks = getInjectedThemeAssets().faviconFallbacks;
    if (Array.isArray(injectedFallbacks) && injectedFallbacks.length > 0) {
      return uniquePaths(injectedFallbacks);
    }
  }

  // Codex改动：浏览器标签图标固定读取站点根目录 favicon.ico，不从主题目录读取。
  return uniquePaths(['/favicon.ico']);
}

export function getThemeAssetPath(assetPath, options = {}) {
  const cleanPath = cleanAssetPath(assetPath);

  if (!cleanPath) {
    return '';
  }

  if (options.preferPanelLogo !== false && cleanPath === 'images/logo.png') {
    const logoPath = getThemeLogoPath();
    if (logoPath) {
      return logoPath;
    }
  }

  if (typeof window === 'undefined') {
    return `/${cleanPath}`;
  }

  const themeBase = getThemeBasePath();
  if (themeBase) {
    const absoluteThemeBase = new URL(themeBase, window.location.origin);
    return new URL(cleanPath, absoluteThemeBase).pathname;
  }

  return `/${cleanPath}`;
}

export function applyThemeFavicon() {
  if (typeof document === 'undefined') {
    return;
  }

  const faviconPath = getThemeFaviconPath();
  if (!faviconPath) {
    return;
  }

  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]'
  ];

  let iconLink = document.querySelector(selectors.join(','));
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }

  const iconLinks = Array.from(document.querySelectorAll(selectors.join(',')));
  const links = iconLinks.length > 0 ? iconLinks : [iconLink];
  links.forEach((link) => {
    link.href = faviconPath;
  });
}

export function installThemeAssetFallbacks() {
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener('error', (event) => {
    const target = event.target;

    if (target?.tagName === 'IMG') {
      const fallbackPaths = getThemeLogoFallbackPaths();
      const currentSrc = resolvePath(target.currentSrc || target.src);
      const currentIndex = fallbackPaths.findIndex((path) => resolvePath(path) === currentSrc);
      const nextPath = fallbackPaths[currentIndex + 1];

      if (nextPath) {
        target.src = nextPath;
      }
    }

    if (target?.tagName === 'LINK' && /(?:^|\s)(?:icon|shortcut icon|apple-touch-icon)(?:\s|$)/i.test(target.rel || '')) {
      const fallbackPaths = getThemeFaviconFallbackPaths();
      const currentHref = resolvePath(target.href);
      const currentIndex = fallbackPaths.findIndex((path) => resolvePath(path) === currentHref);
      const nextPath = fallbackPaths[currentIndex + 1];

      if (nextPath) {
        target.href = nextPath;
      }
    }
  }, true);
}
