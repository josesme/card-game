'use strict';

const _routes = {};
let _current = null;

function register(name, element, module) {
    _routes[name] = { el: element, module: module || null };
}

function navigate(to) {
    if (!_routes[to] || to === _current) return;

    if (_current) {
        const cur = _routes[_current];
        if (cur.module && cur.module.teardown) cur.module.teardown();
        cur.el.classList.add('hidden');
    }

    const next = _routes[to];
    next.el.classList.remove('hidden');
    _current = to;

    if (next.module && next.module.init) next.module.init();

    if (location.hash !== '#' + to) history.replaceState(null, '', '#' + to);
}

window.addEventListener('hashchange', () => {
    const to = location.hash.slice(1);
    if (_routes[to]) navigate(to);
});

window.router = {
    register,
    navigate,
    get current() { return _current; },
};
