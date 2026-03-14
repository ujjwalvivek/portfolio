export class Router {
  constructor() {
    this.routes = new Map();
    this.currentHash = '';
    
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  add(route, handler) {
    this.routes.set(route, handler);
    return this;
  }

  start(defaultRoute = '#docs') {
    if (!window.location.hash) {
      window.history.replaceState(null, '', defaultRoute);
    }
    this.handleHashChange();
  }

  navigate(hash) {
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }

  handleHashChange() {
    let hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex > -1) hash = hash.slice(0, qIndex);

    this.currentHash = hash;
    const handler = this.routes.get(hash);

    if (handler) {
      handler();
    } else {
      if (this.routes.has('#docs')) {
        this.navigate('#docs');
      }
    }
    
    window.dispatchEvent(new CustomEvent('routechange', { detail: { hash } }));
  }
}
