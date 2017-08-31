(function () {
'use strict';

var scheduler = {
    components: [],
    running: false,
    add: function (component) {
        if (~scheduler.components.indexOf(component))
            return;
        scheduler.components.push(component);
        if (!scheduler.running) {
            scheduler.running = true;
            requestAnimationFrame(scheduler.next);
        }
    },
    next: function () {
        var now = window.performance.now();
        var hasComponents = false;
        var i = scheduler.components.length;
        while (i--) {
            var component = scheduler.components[i];
            var data = {};
            var hasTweens = false;
            for (var key in component._currentTweens) {
                var t = component._currentTweens[key];
                if (now >= t.end) {
                    data[key] = t.to;
                    delete component._currentTweens[key];
                    t.fulfil();
                }
                else {
                    hasTweens = true;
                    hasComponents = true;
                    if (now >= t.start) {
                        var p = (now - t.start) / t.duration;
                        data[key] = t.value(t.ease(p));
                    }
                }
            }
            component._tweening = true;
            component.set(data);
            component._tweening = false;
            if (!hasTweens)
                scheduler.components.splice(i, 1);
        }
        if (hasComponents) {
            requestAnimationFrame(scheduler.next);
        }
        else {
            scheduler.running = false;
        }
    }
};
function snap(to) {
    return function () { return to; };
}
function interpolate(a, b) {
    if (a === b || a !== a)
        return snap(a);
    var type = typeof a;
    if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
        throw new Error('Cannot interpolate values of different type');
    }
    if (Array.isArray(a)) {
        var arr_1 = b.map(function (bi, i) {
            return interpolate(a[i], bi);
        });
        return function (t) {
            return arr_1.map(function (fn) { return fn(t); });
        };
    }
    if (type === 'object') {
        if (!a || !b)
            throw new Error('Object cannot be null');
        if (isDate(a) && isDate(b)) {
            a = a.getTime();
            b = b.getTime();
            var delta_1 = b - a;
            return function (t) {
                return new Date(a + t * delta_1);
            };
        }
        var keys_1 = Object.keys(b);
        var interpolators_1 = {};
        var result_1 = {};
        keys_1.forEach(function (key) {
            interpolators_1[key] = interpolate(a[key], b[key]);
        });
        return function (t) {
            keys_1.forEach(function (key) {
                result_1[key] = interpolators_1[key](t);
            });
            return result_1;
        };
    }
    if (type === 'number') {
        var delta_2 = b - a;
        return function (t) {
            return a + t * delta_2;
        };
    }
    throw new Error("Cannot interpolate " + type + " values");
}
function linear(x) {
    return x;
}
function tween(key, to, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    if (!this._currentTweens) {
        this._currentTweens = Object.create(null);
        this._tweening = false;
        var set_1 = this.set;
        this.set = function (data) {
            if (!_this._tweening) {
                for (var key_1 in data) {
                    if (_this._currentTweens[key_1])
                        _this._currentTweens[key_1].abort();
                }
            }
            set_1.call(_this, data);
        };
    }
    var durationProgressModifier = 1;
    if (this._currentTweens[key]) {
        var progressRatio = this._currentTweens[key].abort().progressRatio;
        if (options.adjustDuration) {
            durationProgressModifier = progressRatio;
        }
    }
    var start = window.performance.now() + (options.delay || 0);
    var duration = (options.duration || 400) * durationProgressModifier;
    var end = start + duration;
    var t = {
        key: key,
        value: (options.interpolate || interpolate)(this.get(key), to),
        to: to,
        start: start,
        end: end,
        duration: duration,
        ease: options.easing || linear,
        running: true,
        abort: function () {
            t.running = false;
            delete _this._currentTweens[key];
            return { progressRatio: (window.performance.now() - start) / duration };
        }
    };
    this._currentTweens[key] = t;
    scheduler.add(this);
    var promise = new Promise(function (fulfil) {
        t.fulfil = fulfil;
    });
    promise.abort = t.abort;
    return promise;
}
function isDate(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
}

function cubicOut(t) {
  var f = t - 1.0;
  return f * f * f + 1.0
}

var tabbable = function(el) {
  var basicTabbables = [];
  var orderedTabbables = [];

  // A node is "available" if
  // - it's computed style
  var isUnavailable = createIsUnavailable();

  var candidateSelectors = [
    'input',
    'select',
    'a[href]',
    'textarea',
    'button',
    '[tabindex]',
  ];

  var candidates = el.querySelectorAll(candidateSelectors);

  var candidate, candidateIndex;
  for (var i = 0, l = candidates.length; i < l; i++) {
    candidate = candidates[i];
    candidateIndex = parseInt(candidate.getAttribute('tabindex'), 10) || candidate.tabIndex;

    if (
      candidateIndex < 0
      || (candidate.tagName === 'INPUT' && candidate.type === 'hidden')
      || candidate.disabled
      || isUnavailable(candidate)
    ) {
      continue;
    }

    if (candidateIndex === 0) {
      basicTabbables.push(candidate);
    } else {
      orderedTabbables.push({
        index: i,
        tabIndex: candidateIndex,
        node: candidate,
      });
    }
  }

  var tabbableNodes = orderedTabbables
    .sort(function(a, b) {
      return a.tabIndex === b.tabIndex ? a.index - b.index : a.tabIndex - b.tabIndex;
    })
    .map(function(a) {
      return a.node
    });

  Array.prototype.push.apply(tabbableNodes, basicTabbables);

  return tabbableNodes;
};

function createIsUnavailable() {
  // Node cache must be refreshed on every check, in case
  // the content of the element has changed
  var isOffCache = [];

  // "off" means `display: none;`, as opposed to "hidden",
  // which means `visibility: hidden;`. getComputedStyle
  // accurately reflects visiblity in context but not
  // "off" state, so we need to recursively check parents.

  function isOff(node, nodeComputedStyle) {
    if (node === document.documentElement) return false;

    // Find the cached node (Array.prototype.find not available in IE9)
    for (var i = 0, length = isOffCache.length; i < length; i++) {
      if (isOffCache[i][0] === node) return isOffCache[i][1];
    }

    nodeComputedStyle = nodeComputedStyle || window.getComputedStyle(node);

    var result = false;

    if (nodeComputedStyle.display === 'none') {
      result = true;
    } else if (node.parentNode) {
      result = isOff(node.parentNode);
    }

    isOffCache.push([node, result]);

    return result;
  }

  return function isUnavailable(node) {
    if (node === document.documentElement) return false;

    var computedStyle = window.getComputedStyle(node);

    if (isOff(node, computedStyle)) return true;

    return computedStyle.visibility === 'hidden';
  }
}

var listeningFocusTrap = null;

function focusTrap(element, userOptions) {
  var tabbableNodes = [];
  var nodeFocusedBeforeActivation = null;
  var active = false;
  var paused = false;

  var container = (typeof element === 'string')
    ? document.querySelector(element)
    : element;

  var config = userOptions || {};
  config.returnFocusOnDeactivate = (userOptions && userOptions.returnFocusOnDeactivate !== undefined)
    ? userOptions.returnFocusOnDeactivate
    : true;
  config.escapeDeactivates = (userOptions && userOptions.escapeDeactivates !== undefined)
    ? userOptions.escapeDeactivates
    : true;

  var trap = {
    activate: activate,
    deactivate: deactivate,
    pause: pause,
    unpause: unpause,
  };

  return trap;

  function activate(activateOptions) {
    if (active) return;

    var defaultedActivateOptions = {
      onActivate: (activateOptions && activateOptions.onActivate !== undefined)
        ? activateOptions.onActivate
        : config.onActivate,
    };

    active = true;
    paused = false;
    nodeFocusedBeforeActivation = document.activeElement;

    if (defaultedActivateOptions.onActivate) {
      defaultedActivateOptions.onActivate();
    }

    addListeners();
    return trap;
  }

  function deactivate(deactivateOptions) {
    if (!active) return;

    var defaultedDeactivateOptions = {
      returnFocus: (deactivateOptions && deactivateOptions.returnFocus !== undefined)
        ? deactivateOptions.returnFocus
        : config.returnFocusOnDeactivate,
      onDeactivate: (deactivateOptions && deactivateOptions.onDeactivate !== undefined)
        ? deactivateOptions.onDeactivate
        : config.onDeactivate,
    };

    removeListeners();

    if (defaultedDeactivateOptions.onDeactivate) {
      defaultedDeactivateOptions.onDeactivate();
    }

    if (defaultedDeactivateOptions.returnFocus) {
      setTimeout(function () {
        tryFocus(nodeFocusedBeforeActivation);
      }, 0);
    }

    active = false;
    paused = false;
    return this;
  }

  function pause() {
    if (paused || !active) return;
    paused = true;
    removeListeners();
  }

  function unpause() {
    if (!paused || !active) return;
    paused = false;
    addListeners();
  }

  function addListeners() {
    if (!active) return;

    // There can be only one listening focus trap at a time
    if (listeningFocusTrap) {
      listeningFocusTrap.pause();
    }
    listeningFocusTrap = trap;

    updateTabbableNodes();
    tryFocus(firstFocusNode());
    document.addEventListener('focus', checkFocus, true);
    document.addEventListener('click', checkClick, true);
    document.addEventListener('mousedown', checkPointerDown, true);
    document.addEventListener('touchstart', checkPointerDown, true);
    document.addEventListener('keydown', checkKey, true);

    return trap;
  }

  function removeListeners() {
    if (!active || listeningFocusTrap !== trap) return;

    document.removeEventListener('focus', checkFocus, true);
    document.removeEventListener('click', checkClick, true);
    document.removeEventListener('mousedown', checkPointerDown, true);
    document.removeEventListener('touchstart', checkPointerDown, true);
    document.removeEventListener('keydown', checkKey, true);

    listeningFocusTrap = null;

    return trap;
  }

  function getNodeForOption(optionName) {
    var optionValue = config[optionName];
    var node = optionValue;
    if (!optionValue) {
      return null;
    }
    if (typeof optionValue === 'string') {
      node = document.querySelector(optionValue);
      if (!node) {
        throw new Error('`' + optionName + '` refers to no known node');
      }
    }
    if (typeof optionValue === 'function') {
      node = optionValue();
      if (!node) {
        throw new Error('`' + optionName + '` did not return a node');
      }
    }
    return node;
  }

  function firstFocusNode() {
    var node;
    if (getNodeForOption('initialFocus') !== null) {
      node = getNodeForOption('initialFocus');
    } else if (container.contains(document.activeElement)) {
      node = document.activeElement;
    } else {
      node = tabbableNodes[0] || getNodeForOption('fallbackFocus');
    }

    if (!node) {
      throw new Error('You can\'t have a focus-trap without at least one focusable element');
    }

    return node;
  }

  // This needs to be done on mousedown and touchstart instead of click
  // so that it precedes the focus event
  function checkPointerDown(e) {
    if (config.clickOutsideDeactivates && !container.contains(e.target)) {
      deactivate({ returnFocus: false });
    }
  }

  function checkClick(e) {
    if (config.clickOutsideDeactivates) return;
    if (container.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function checkFocus(e) {
    if (container.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    // Checking for a blur method here resolves a Firefox issue (#15)
    if (typeof e.target.blur === 'function') e.target.blur();
  }

  function checkKey(e) {
    if (e.key === 'Tab' || e.keyCode === 9) {
      handleTab(e);
    }

    if (config.escapeDeactivates !== false && isEscapeEvent(e)) {
      deactivate();
    }
  }

  function handleTab(e) {
    e.preventDefault();
    updateTabbableNodes();
    var currentFocusIndex = tabbableNodes.indexOf(e.target);
    var lastTabbableNode = tabbableNodes[tabbableNodes.length - 1];
    var firstTabbableNode = tabbableNodes[0];

    if (e.shiftKey) {
      if (e.target === firstTabbableNode || tabbableNodes.indexOf(e.target) === -1) {
        return tryFocus(lastTabbableNode);
      }
      return tryFocus(tabbableNodes[currentFocusIndex - 1]);
    }

    if (e.target === lastTabbableNode) return tryFocus(firstTabbableNode);

    tryFocus(tabbableNodes[currentFocusIndex + 1]);
  }

  function updateTabbableNodes() {
    tabbableNodes = tabbable(container);
  }
}

function isEscapeEvent(e) {
  return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
}

function tryFocus(node) {
  if (!node || !node.focus) return;
  node.focus();
  if (node.tagName.toLowerCase() === 'input') {
    node.select();
  }
}

var focusTrap_1 = focusTrap;

function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function reinsertBetween(before, after, target) {
	while (before.nextSibling && before.nextSibling !== after) {
		target.appendChild(before.parentNode.removeChild(before.nextSibling));
	}
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function createComment() {
	return document.createComment('');
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function destroy(detach) {
	this.destroy = this.set = this.get = noop;
	this.fire('destroy');

	if (detach !== false) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = this._state = null;
}

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set(newState) {
	this._set(assign({}, newState));
	if (this._root._lock) return;
	this._root._lock = true;
	callAll(this._root._beforecreate);
	callAll(this._root._oncreate);
	callAll(this._root._aftercreate);
	this._root._lock = false;
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign({}, oldState, newState);
	this._recompute(changed, this._state, oldState, false);
	if (this._bind) this._bind(changed, this._state);
	dispatchObservers(this, this._observers.pre, changed, this._state, oldState);
	this._fragment.update(changed, this._state);
	dispatchObservers(this, this._observers.post, changed, this._state, oldState);
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

var proto = {
	destroy: destroy,
	get: get,
	fire: fire,
	observe: observe,
	on: on,
	set: set,
	teardown: destroy,
	_recompute: noop,
	_set: _set
};

var template$1 = (function () {
const DEFAULTS = {
  opacity: 0.3,
  background: '#000'
};
Object.freeze(DEFAULTS);

return {
  setup (Scrim) {
    Scrim.DEFAULTS = DEFAULTS;
  },

  data () {
    return Object.assign({}, DEFAULTS)
  }
}
}());

function encapsulateStyles$1 ( node ) {
	setAttribute( node, 'svelte-4157681185', '' );
}

function add_css$1 () {
	var style = createElement( 'style' );
	style.id = 'svelte-4157681185-style';
	style.textContent = ".scrim[svelte-4157681185]{position:fixed;top:0;right:0;left:0;height:100vh;-webkit-tap-highlight-color:rgba(0, 0, 0, 0)}";
	appendNode( style, document.head );
}

function create_main_fragment$1 ( state, component ) {
	var div, div_style_value;

	return {
		create: function () {
			div = createElement( 'div' );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles$1( div );
			div.className = "scrim";
			div.style.cssText = div_style_value = "\n    opacity: " + ( state.opacity ) + ";\n    background: " + ( state.background ) + ";\n  ";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
		},

		update: function ( changed, state ) {
			if ( ( changed.opacity || changed.background ) && div_style_value !== ( div_style_value = "\n    opacity: " + ( state.opacity ) + ";\n    background: " + ( state.background ) + ";\n  " ) ) {
				div.style.cssText = div_style_value;
			}
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: noop
	};
}

function Scrim ( options ) {
	this.options = options;
	this._state = assign( template$1.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !document.getElementById( 'svelte-4157681185-style' ) ) add_css$1();

	this._fragment = create_main_fragment$1( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}
}

assign( Scrim.prototype, proto );

template$1.setup( Scrim );

var template$1$1 = (function () {
// TODO: write a smaller, less "featured" focusTrap
const makeFocusTrap = ({ rootElement, initialFocusElement }) => {
  return focusTrap_1(rootElement, {
    initialFocus: initialFocusElement || rootElement,
    fallbackFocus: rootElement,
    escapeDeactivates: false,
    returnFocusOnDeactivate: true,
    clickOutsideDeactivates: false
  })
};

/* TODO: be fancy and take a touch/click/element position to transition in from */
/* TODO: maybe make a way to accept custom transition styles and easings */
const STYLE = {
  modal:   { open: { opacity: 1 }, hidden: { opacity: 0 } },
  content: { open: { scale: 1 },   hidden: { scale: 0.9 } }
};
const DEFAULTS = {
  initiallyHidden: false,
  initialFocusElement: false,
  center: false,
  zIndexBase: 1,
  transitionDuration: 225,
  pressScrimToDismiss: true,
  escapeToDismiss: true,
  trapFocus: true
  //backButtonToDismiss: true, // TODO: implement this
};
const FIRES = {
  opening: 'opening',
  opened: 'opened',

  result: 'result',
  dismissed: 'dismissed',
  closed: 'closed',

  hiding: 'hiding',
  hidden: 'hidden'
};
const ONS = {
  open: 'open',
  dismiss: 'dismiss',
  close: 'close'
};[ STYLE, DEFAULTS, FIRES, ONS ].forEach(Object.freeze);

return {
  setup (Modal) {
    Object.assign(Modal, { DEFAULTS, FIRES, ONS });
  },

  data () {
    return Object.assign({
      hidden: true,
      hiding: false,
      opening: false,
      modalStyle: STYLE.modal.hidden,
      contentStyle: STYLE.content.hidden
    }, DEFAULTS)
  },

  computed: {
    transitioning: (hiding, opening) => hiding || opening,
    open: (hidden, transitioning) => !hidden && !transitioning,
    initialFocusElementNeedsFocus: (initialFocusElement, opening) => initialFocusElement && opening
  },

  oncreate () {
    if (this.get('trapFocus')) {
      let focusTrap;
      this.on('opened', () => {
        focusTrap = makeFocusTrap({
          rootElement: this.refs.modal,
          initialFocusElement: this.get('initialFocusElement')
        });
        focusTrap.activate();
      });
      this.on(FIRES.hidden, () => focusTrap && focusTrap.deactivate());
    }

    this.observe('initialFocusElementNeedsFocus', needsFocus => {
      if (needsFocus) {
        this.focusInitialFocusElement();
      }
    });

    if (!this.get('initiallyHidden')) {
      this.open();
    }

    this.on(ONS.open, () => this.open());
    this.on(ONS.dismiss, e => this.dismiss(e));
    this.on(ONS.close, e => this.close(e));
  },

  methods: {
    tween,

    focusInitialFocusElement () {
      const initialFocusElement = this.get('initialFocusElement');
      initialFocusElement && initialFocusElement.focus();
    },

    onKeyup (event) {
      if (event.key.toLowerCase() === 'escape' && this.get('escapeToDismiss')) {
        this.dismiss();
      }
    },

    onScrimPress () {
      if (this.get('pressScrimToDismiss')) {
        this.dismiss();
      }
    },

    open () {
      if (this.get('open') || this.get('opening')) { return }

      this.set({ opening: true, hiding: false, hidden: false });
      this.fire(FIRES.opening);

      Promise.all([
        this.tween(
          'modalStyle',
          STYLE.modal.open,
          { duration: this.get('transitionDuration'), easing: cubicOut, adjustDuration: true }
        ),
        this.tween(
          'contentStyle',
          STYLE.content.open,
          { duration: this.get('transitionDuration'), easing: cubicOut, adjustDuration: true }
        )
      ])
        .then(() => {
          this.set({ opening: false });
          this.fire(FIRES.opened);
        });

      return this
    },

    hide (reason, result) {
      if (this.get('hidden') || this.get('hiding')) { return }

      this.set({ opening: false, hiding: true });

      this.fire(FIRES.result, result);
      this.fire(reason, result);
      this.fire(FIRES.hiding);

      Promise.all([
        this.tween(
          'modalStyle',
          STYLE.modal.hidden,
          { duration: this.get('transitionDuration'), easing: cubicOut, adjustDuration: true }
        ),
        this.tween(
          'contentStyle',
          STYLE.content.hidden,
          { duration: this.get('transitionDuration'), easing: cubicOut, adjustDuration: true }
        )
      ])
        .then(() => {
          this.set({ hiding: false, hidden: true });
          this.fire(FIRES.hidden);
        });

      return this
    },

    close (result) {
      return this.hide(FIRES.closed, result)
    },

    dismiss (result) {
      return this.hide(FIRES.dismissed, result)
    }
  }
}
}());

function encapsulateStyles ( node ) {
	setAttribute( node, 'svelte-4112083598', '' );
}

function add_css () {
	var style = createElement( 'style' );
	style.id = 'svelte-4112083598-style';
	style.textContent = ".svelte-modal[svelte-4112083598]{position:fixed;top:0;left:0;right:0;height:100%;display:flex;align-items:flex-start;justify-content:center}[data-center=\"true\"][svelte-4112083598]{align-items:center}[data-hidden=\"true\"][svelte-4112083598]{visibility:hidden}.content[svelte-4112083598]{max-width:100vw;max-height:100vh;overflow:visible;z-index:1}";
	appendNode( style, document.head );
}

function create_main_fragment$1$1 ( state, component ) {
	var text, div, div_style_value, div_1, div_1_style_value, slot_content_default = component._slotted.default, slot_content_default_before, slot_content_default_after, text_2, div_2, slot_content_scrim = component._slotted.scrim, slot_content_scrim_before, slot_content_scrim_after;

	function onwindowkeyup ( event ) {
		var state = component.get();
		component.onKeyup(event);
	}
	window.addEventListener( 'keyup', onwindowkeyup );

	function click_handler ( event ) {
		component.onScrimPress();
	}

	var scrim = new Scrim({
		_root: component._root
	});

	return {
		create: function () {
			text = createText( "\n" );
			div = createElement( 'div' );
			div_1 = createElement( 'div' );
			text_2 = createText( "\n\n  " );
			div_2 = createElement( 'div' );
			if (!slot_content_scrim) {
				scrim._fragment.create();
			}
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles( div );
			div.className = "svelte-modal";
			div.tabIndex = "-1";
			setAttribute( div, 'data-center', state.center );
			setAttribute( div, 'data-hidden', state.hidden );
			div.style.cssText = div_style_value = "z-index: " + ( state.zIndexBase ) + "; opacity: " + ( state.modalStyle.opacity ) + ";";
			encapsulateStyles( div_1 );
			div_1.className = "content";
			div_1.style.cssText = div_1_style_value = "transform: scale(" + ( state.contentStyle.scale ) + ");";
			addListener( div_2, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode( text, target, anchor );
			insertNode( div, target, anchor );
			component.refs.modal = div;
			appendNode( div_1, div );
			component.refs.content = div_1;

			if (slot_content_default) {
				appendNode(slot_content_default_before || (slot_content_default_before = createComment()), div_1);
				appendNode(slot_content_default, div_1);
				appendNode(slot_content_default_after || (slot_content_default_after = createComment()), div_1);
			}

			appendNode( text_2, div );
			appendNode( div_2, div );
			if (!slot_content_scrim) {
				scrim._fragment.mount( div_2, null );
			}

			if (slot_content_scrim) {
				appendNode(slot_content_scrim_before || (slot_content_scrim_before = createComment()), div_2);
				appendNode(slot_content_scrim, div_2);
				appendNode(slot_content_scrim_after || (slot_content_scrim_after = createComment()), div_2);
			}
		},

		update: function ( changed, state ) {
			if ( changed.center ) {
				setAttribute( div, 'data-center', state.center );
			}

			if ( changed.hidden ) {
				setAttribute( div, 'data-hidden', state.hidden );
			}

			if ( ( changed.zIndexBase || changed.modalStyle ) && div_style_value !== ( div_style_value = "z-index: " + ( state.zIndexBase ) + "; opacity: " + ( state.modalStyle.opacity ) + ";" ) ) {
				div.style.cssText = div_style_value;
			}

			if ( ( changed.contentStyle ) && div_1_style_value !== ( div_1_style_value = "transform: scale(" + ( state.contentStyle.scale ) + ");" ) ) {
				div_1.style.cssText = div_1_style_value;
			}
		},

		unmount: function () {
			detachNode( text );
			detachNode( div );

			if (slot_content_default) {
				reinsertBetween(slot_content_default_before, slot_content_default_after, slot_content_default);
				detachNode(slot_content_default_before);
				detachNode(slot_content_default_after);
			}

			if (slot_content_scrim) {
				reinsertBetween(slot_content_scrim_before, slot_content_scrim_after, slot_content_scrim);
				detachNode(slot_content_scrim_before);
				detachNode(slot_content_scrim_after);
			}
		},

		destroy: function () {
			window.removeEventListener( 'keyup', onwindowkeyup );

			if ( component.refs.modal === div ) component.refs.modal = null;
			if ( component.refs.content === div_1 ) component.refs.content = null;
			removeListener( div_2, 'click', click_handler );
			if (!slot_content_scrim) {
				scrim.destroy( false );
			}
		}
	};
}

function Modal ( options ) {
	this.options = options;
	this.refs = {};
	this._state = assign( template$1$1.data(), options.data );
	this._recompute( {}, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;
	this._slotted = options.slots || {};

	if ( !document.getElementById( 'svelte-4112083598-style' ) ) add_css();

	var oncreate = template$1$1.oncreate.bind( this );

	if ( !options._root ) {
		this._oncreate = [oncreate];
		this._beforecreate = [];
		this._aftercreate = [];
	} else {
	 	this._root._oncreate.push(oncreate);
	 }

	this.slots = {};

	this._fragment = create_main_fragment$1$1( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}

	if ( !options._root ) {
		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign( Modal.prototype, template$1$1.methods, proto );

Modal.prototype._recompute = function _recompute ( changed, state, oldState, isInitial ) {
	if ( isInitial || changed.hiding || changed.opening ) {
		if ( differs( ( state.transitioning = template$1$1.computed.transitioning( state.hiding, state.opening ) ), oldState.transitioning ) ) changed.transitioning = true;
	}

	if ( isInitial || changed.hidden || changed.transitioning ) {
		if ( differs( ( state.open = template$1$1.computed.open( state.hidden, state.transitioning ) ), oldState.open ) ) changed.open = true;
	}

	if ( isInitial || changed.initialFocusElement || changed.opening ) {
		if ( differs( ( state.initialFocusElementNeedsFocus = template$1$1.computed.initialFocusElementNeedsFocus( state.initialFocusElement, state.opening ) ), oldState.initialFocusElementNeedsFocus ) ) changed.initialFocusElementNeedsFocus = true;
	}
};

template$1$1.setup( Modal );

function noop$1() {}

function assign$1(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode$1(node, target) {
	target.appendChild(node);
}

function insertNode$1(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode$1(node) {
	node.parentNode.removeChild(node);
}

function createFragment() {
	return document.createDocumentFragment();
}

function createElement$1(name) {
	return document.createElement(name);
}

function createText$1(data) {
	return document.createTextNode(data);
}

function createComment$1() {
	return document.createComment('');
}

function addListener$1(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener$1(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute$1(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function toNumber(value) {
	return value === '' ? undefined : +value;
}

function destroy$1(detach) {
	this.destroy = this.set = this.get = noop$1;
	this.fire('destroy');

	if (detach !== false) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = this._state = null;
}

function differs$1(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers$1(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function get$1(key) {
	return key ? this._state[key] : this._state;
}

function fire$1(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function observe$1(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function on$1(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set$1(newState) {
	this._set(assign$1({}, newState));
	if (this._root._lock) return;
	this._root._lock = true;
	callAll$1(this._root._beforecreate);
	callAll$1(this._root._oncreate);
	callAll$1(this._root._aftercreate);
	this._root._lock = false;
}

function _set$1(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (differs$1(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign$1({}, oldState, newState);
	this._recompute(changed, this._state, oldState, false);
	if (this._bind) this._bind(changed, this._state);
	dispatchObservers$1(this, this._observers.pre, changed, this._state, oldState);
	this._fragment.update(changed, this._state);
	dispatchObservers$1(this, this._observers.post, changed, this._state, oldState);
}

function callAll$1(fns) {
	while (fns && fns.length) fns.pop()();
}

var proto$1 = {
	destroy: destroy$1,
	get: get$1,
	fire: fire$1,
	observe: observe$1,
	on: on$1,
	set: set$1,
	teardown: destroy$1,
	_recompute: noop$1,
	_set: _set$1
};

var template$2 = (function () {
return {
  methods: {
    closeModal (method, message) {
      this.fire(`modal.${method}`, message);
    }
  }
}
}());

function encapsulateStyles$1$1 ( node ) {
	setAttribute$1( node, 'svelte-3741696046', '' );
}

function add_css$1$1 () {
	var style = createElement$1( 'style' );
	style.id = 'svelte-3741696046-style';
	style.textContent = ".content[svelte-3741696046]{background:white;padding:30px;margin:50px 10px;border-radius:4px}";
	appendNode$1( style, document.head );
}

function create_main_fragment$2 ( state, component ) {
	var div, p, text, text_1, button, text_2, text_3, button_1, text_4;

	function click_handler ( event ) {
		component.closeModal('dismiss', 'It got dismissed.');
	}

	function click_handler_1 ( event ) {
		component.closeModal('close', `It's come to a close.`);
	}

	return {
		create: function () {
			div = createElement$1( 'div' );
			p = createElement$1( 'p' );
			text = createText$1( "Here is some modal content." );
			text_1 = createText$1( "\n  " );
			button = createElement$1( 'button' );
			text_2 = createText$1( "Dismiss Modal" );
			text_3 = createText$1( "\n  " );
			button_1 = createElement$1( 'button' );
			text_4 = createText$1( "Close Modal" );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles$1$1( div );
			div.className = "content";
			addListener$1( button, 'click', click_handler );
			addListener$1( button_1, 'click', click_handler_1 );
		},

		mount: function ( target, anchor ) {
			insertNode$1( div, target, anchor );
			appendNode$1( p, div );
			appendNode$1( text, p );
			appendNode$1( text_1, div );
			appendNode$1( button, div );
			appendNode$1( text_2, button );
			appendNode$1( text_3, div );
			appendNode$1( button_1, div );
			appendNode$1( text_4, button_1 );
		},

		update: noop$1,

		unmount: function () {
			detachNode$1( div );
		},

		destroy: function () {
			removeListener$1( button, 'click', click_handler );
			removeListener$1( button_1, 'click', click_handler_1 );
		}
	};
}

function ModalContent ( options ) {
	this.options = options;
	this._state = options.data || {};

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !document.getElementById( 'svelte-3741696046-style' ) ) add_css$1$1();

	this._fragment = create_main_fragment$2( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}
}

assign$1( ModalContent.prototype, template$2.methods, proto$1 );

var template = (function () {
return {
  data () {
    return Object.assign({}, Modal.DEFAULTS, {
      shouldShowModal: false,
      modalResult: 'None thus far.',
      showModalResult: false
    })
  }
}
}());

function create_main_fragment ( state, component ) {
	var label, text, input, input_updating = false, text_2, label_1, text_3, input_1, input_1_updating = false, text_5, button, text_6, text_7, p, strong, text_8, text_9, text_10_value = state.modalResult || '', text_10, text_11, if_block_anchor;

	function input_change_handler () {
		input_updating = true;
		component.set({ center: input.checked });
		input_updating = false;
	}

	function input_1_input_handler () {
		input_1_updating = true;
		component.set({ transitionDuration: toNumber( input_1.value ) });
		input_1_updating = false;
	}

	function click_handler ( event ) {
		component.set({ shouldShowModal: true, modalResult: '' });
	}

	var if_block = (state.shouldShowModal) && create_if_block( state, component );

	return {
		create: function () {
			label = createElement$1( 'label' );
			text = createText$1( "Center modal\n  " );
			input = createElement$1( 'input' );
			text_2 = createText$1( "\n" );
			label_1 = createElement$1( 'label' );
			text_3 = createText$1( "Transition duration in ms (0 to disable transition)\n  " );
			input_1 = createElement$1( 'input' );
			text_5 = createText$1( "\n\n" );
			button = createElement$1( 'button' );
			text_6 = createText$1( "Open Modal" );
			text_7 = createText$1( "\n\n" );
			p = createElement$1( 'p' );
			strong = createElement$1( 'strong' );
			text_8 = createText$1( "Modal result:" );
			text_9 = createText$1( " " );
			text_10 = createText$1( text_10_value );
			text_11 = createText$1( "\n\n" );
			if ( if_block ) if_block.create();
			if_block_anchor = createComment$1();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			input.type = "checkbox";
			addListener$1( input, 'change', input_change_handler );
			input_1.type = "number";
			addListener$1( input_1, 'input', input_1_input_handler );
			addListener$1( button, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode$1( label, target, anchor );
			appendNode$1( text, label );
			appendNode$1( input, label );

			input.checked = state.center;

			insertNode$1( text_2, target, anchor );
			insertNode$1( label_1, target, anchor );
			appendNode$1( text_3, label_1 );
			appendNode$1( input_1, label_1 );

			input_1.value = state.transitionDuration;

			insertNode$1( text_5, target, anchor );
			insertNode$1( button, target, anchor );
			appendNode$1( text_6, button );
			insertNode$1( text_7, target, anchor );
			insertNode$1( p, target, anchor );
			appendNode$1( strong, p );
			appendNode$1( text_8, strong );
			appendNode$1( text_9, p );
			appendNode$1( text_10, p );
			insertNode$1( text_11, target, anchor );
			if ( if_block ) if_block.mount( target, anchor );
			insertNode$1( if_block_anchor, target, anchor );
		},

		update: function ( changed, state ) {
			if ( !input_updating ) {
				input.checked = state.center;
			}

			if ( !input_1_updating ) {
				input_1.value = state.transitionDuration;
			}

			if ( ( changed.modalResult ) && text_10_value !== ( text_10_value = state.modalResult || '' ) ) {
				text_10.data = text_10_value;
			}

			if ( state.shouldShowModal ) {
				if ( if_block ) {
					if_block.update( changed, state );
				} else {
					if_block = create_if_block( state, component );
					if_block.create();
					if_block.mount( if_block_anchor.parentNode, if_block_anchor );
				}
			} else if ( if_block ) {
				if_block.unmount();
				if_block.destroy();
				if_block = null;
			}
		},

		unmount: function () {
			detachNode$1( label );
			detachNode$1( text_2 );
			detachNode$1( label_1 );
			detachNode$1( text_5 );
			detachNode$1( button );
			detachNode$1( text_7 );
			detachNode$1( p );
			detachNode$1( text_11 );
			if ( if_block ) if_block.unmount();
			detachNode$1( if_block_anchor );
		},

		destroy: function () {
			removeListener$1( input, 'change', input_change_handler );
			removeListener$1( input_1, 'input', input_1_input_handler );
			removeListener$1( button, 'click', click_handler );
			if ( if_block ) if_block.destroy();
		}
	};
}

function create_if_block ( state, component ) {
	var modal_updating = {}, text_1, p, strong, text_2, text_3, text_4, text_5, text_6, text_7;

	var modalcontent = new ModalContent({
		_root: component._root
	});

	modalcontent.on( 'modal.dismiss', function ( event ) {
		component.refs.modal.dismiss(event);
	});

	modalcontent.on( 'modal.close', function ( event ) {
		component.refs.modal.close(event);
	});

	component.refs.modalContent = modalcontent;

	var modal_initial_data = {
		center: state.center,
		transitionDuration: state.transitionDuration
	};
	if ( 'opening' in state ) {
		modal_initial_data.opening = state.opening
    ;
		modal_updating.opening = true;
	}
	if ( 'hiding' in state ) {
		modal_initial_data.hiding = state.hiding
    ;
		modal_updating.hiding = true;
	}
	var modal = new Modal({
		_root: component._root,
		slots: { default: createFragment() },
		data: modal_initial_data,
		_bind: function(changed, childState) {
			var state = component.get(), newState = {};
			if ( !modal_updating.opening && changed.opening ) {
				newState.opening = childState.opening;
			}

			if ( !modal_updating.hiding && changed.hiding ) {
				newState.hiding = childState.hiding;
			}
			modal_updating = changed;
			component._set(newState);
			modal_updating = {};
		}
	});

	component._root._beforecreate.push(function () {
		var state = component.get(), childState = modal.get(), newState = {};
		if (!childState) return;
		if ( !modal_updating.opening ) {
			newState.opening = childState.opening;
		}

		if ( !modal_updating.hiding ) {
			newState.hiding = childState.hiding;
		}
		modal_updating = { opening: true, hiding: true };
		component._set(newState);
		modal_updating = {};
	});

	modal.on( 'result', function ( event ) {
		component.set({ modalResult: event });
	});

	modal.on( 'hidden', function ( event ) {
		component.set({ shouldShowModal: false });
	});

	component.refs.modal = modal;

	return {
		create: function () {
			modalcontent._fragment.create();
			modal._fragment.create();
			text_1 = createText$1( "\n\n  " );
			p = createElement$1( 'p' );
			strong = createElement$1( 'strong' );
			text_2 = createText$1( "Modal state:" );
			text_3 = createText$1( "\n    { opening: " );
			text_4 = createText$1( state.opening );
			text_5 = createText$1( ", hiding: " );
			text_6 = createText$1( state.hiding );
			text_7 = createText$1( " }" );
		},

		mount: function ( target, anchor ) {
			modalcontent._fragment.mount( modal._slotted.default, null );
			modal._fragment.mount( target, anchor );
			insertNode$1( text_1, target, anchor );
			insertNode$1( p, target, anchor );
			appendNode$1( strong, p );
			appendNode$1( text_2, strong );
			appendNode$1( text_3, p );
			appendNode$1( text_4, p );
			appendNode$1( text_5, p );
			appendNode$1( text_6, p );
			appendNode$1( text_7, p );
		},

		update: function ( changed, state ) {
			var modal_changes = {};
			if ( changed.center ) modal_changes.center = state.center;
			if ( changed.transitionDuration ) modal_changes.transitionDuration = state.transitionDuration;
			if ( !modal_updating.opening && changed.opening ) {
				modal_changes.opening = state.opening
    ;
				modal_updating.opening = true;
			}
			if ( !modal_updating.hiding && changed.hiding ) {
				modal_changes.hiding = state.hiding
    ;
				modal_updating.hiding = true;
			}
			modal._set( modal_changes );
			modal_updating = {};

			if ( changed.opening ) {
				text_4.data = state.opening;
			}

			if ( changed.hiding ) {
				text_6.data = state.hiding;
			}
		},

		unmount: function () {
			modal._fragment.unmount();
			detachNode$1( text_1 );
			detachNode$1( p );
		},

		destroy: function () {
			modalcontent.destroy( false );
			if ( component.refs.modalContent === modalcontent ) component.refs.modalContent = null;
			modal.destroy( false );
			if ( component.refs.modal === modal ) component.refs.modal = null;
		}
	};
}

function Demo ( options ) {
	this.options = options;
	this.refs = {};
	this._state = assign$1( template.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !options._root ) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}

	if ( !options._root ) {
		this._lock = true;
		callAll$1(this._beforecreate);
		callAll$1(this._oncreate);
		callAll$1(this._aftercreate);
		this._lock = false;
	}
}

assign$1( Demo.prototype, proto$1 );

window.app = new Demo({ target: document.getElementById('app') });

}());
