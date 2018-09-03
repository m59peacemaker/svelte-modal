function noop() {}

function assign(tar, src) {
	for (var k in src) tar[k] = src[k];
	return tar;
}

function assignTrue(tar, src) {
	for (var k in src) tar[k] = 1;
	return tar;
}

function append(target, node) {
	target.appendChild(node);
}

function insert(target, node, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function reinsertChildren(parent, target) {
	while (parent.firstChild) target.appendChild(parent.firstChild);
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
}

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = noop;

	this._fragment.d(detach !== false);
	this._fragment = null;
	this._state = {};
}

function _differs(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		var handler = handlers[i];

		if (!handler.__calling) {
			try {
				handler.__calling = true;
				handler.call(this, data);
			} finally {
				handler.__calling = false;
			}
		}
	}
}

function flush(component) {
	component._lock = true;
	callAll(component._beforecreate);
	callAll(component._oncreate);
	callAll(component._aftercreate);
	component._lock = false;
}

function get() {
	return this._state;
}

function init(component, options) {
	component._handlers = blankObject();
	component._slots = blankObject();
	component._bind = options._bind;
	component._staged = {};

	component.options = options;
	component.root = options.root || component;
	component.store = options.store || component.root.store;

	if (!options.root) {
		component._beforecreate = [];
		component._oncreate = [];
		component._aftercreate = [];
	}
}

function on(eventName, handler) {
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
	if (this.root._lock) return;
	flush(this.root);
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	newState = assign(this._staged, newState);
	this._staged = {};

	for (var key in newState) {
		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign(assign({}, oldState), newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);

	if (this._fragment) {
		this.fire("state", { changed: changed, current: this._state, previous: oldState });
		this._fragment.p(changed, this._state);
		this.fire("update", { changed: changed, current: this._state, previous: oldState });
	}
}

function _stage(newState) {
	assign(this._staged, newState);
}

function callAll(fns) {
	while (fns && fns.length) fns.shift()();
}

function _mount(target, anchor) {
	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
}

var proto = {
	destroy,
	get,
	fire,
	on,
	set,
	_recompute: noop,
	_set,
	_stage,
	_mount,
	_differs
};

function isDate(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
}

var scheduler$1 = {
    components: [],
    running: false,
    add: function (component) {
        if (~scheduler$1.components.indexOf(component))
            return;
        scheduler$1.components.push(component);
        if (!scheduler$1.running) {
            scheduler$1.running = true;
            requestAnimationFrame(scheduler$1.next);
        }
    },
    next: function () {
        var hasComponents = false;
        var i = scheduler$1.components.length;
        while (i--) {
            var component = scheduler$1.components[i];
            var data = {};
            var hasSprings = false;
            for (var key in component._springs) {
                var spring_1 = component._springs[key];
                if (spring_1.tick(data)) {
                    hasSprings = true;
                    hasComponents = true;
                }
                else {
                    component._springCallbacks[key]();
                    delete component._springs[key];
                    delete component._springCallbacks[key];
                }
            }
            component._springing = true;
            component.set(data);
            component._springing = false;
            if (!hasSprings)
                scheduler$1.components.splice(i, 1);
        }
        if (hasComponents) {
            requestAnimationFrame(scheduler$1.next);
        }
        else {
            scheduler$1.running = false;
        }
    }
};
function snap$1(key, a, b, options) {
    return {
        key: key,
        tick: function (object) {
            object[key] = b;
            return false;
        },
        update: function (object, options) {
            b = object;
        }
    };
}
function number(key, a, b, options) {
    var velocity = 0;
    var stiffness = options.stiffness, damping = options.damping;
    var valueThreshold = Math.abs(b - a) * 0.001;
    var velocityThreshold = valueThreshold; // TODO is this right?
    return {
        key: key,
        tick: function (object) {
            var d = b - a;
            var spring = stiffness * d;
            var damper = damping * velocity;
            var acceleration = spring - damper;
            velocity += acceleration;
            a += velocity;
            object[key] = a;
            if (velocity < velocityThreshold && Math.abs(b - a) < valueThreshold) {
                object[key] = b;
                return false;
            }
            object[key] = a;
            return true;
        },
        update: function (object, options) {
            checkCompatibility(object, b);
            b = object;
            stiffness = options.stiffness;
            damping = options.damping;
        }
    };
}
function date(key, a, b, options) {
    var dummy = {};
    var subspring = number(key, a.getTime(), b.getTime(), options);
    return {
        key: key,
        tick: function (object) {
            if (!subspring.tick(dummy)) {
                object[key] = b;
                return false;
            }
            object[key] = new Date(dummy[key]);
            return true;
        },
        update: function (object, options) {
            checkCompatibility(object, b);
            subspring.update(object.getTime(), options);
            b = object;
        }
    };
}
function array(key, a, b, options) {
    var value = [];
    var subsprings = [];
    for (var i = 0; i < a.length; i += 1) {
        subsprings.push(getSpring(i, a[i], b[i], options));
    }
    return {
        key: key,
        tick: function (object) {
            var active = false;
            for (var i = 0; i < subsprings.length; i += 1) {
                if (subsprings[i].tick(value))
                    active = true;
            }
            if (!active) {
                object[key] = b;
                return false;
            }
            object[key] = value;
            return true;
        },
        update: function (object, options) {
            checkCompatibility(object, b);
            for (var i = 0; i < object.length; i += 1) {
                subsprings[i].update(object[i], options);
            }
            b = object;
        }
    };
}
function object(key, a, b, options) {
    var value = {};
    var subsprings = [];
    for (var k in a) {
        subsprings.push(getSpring(k, a[k], b[k], options));
    }
    return {
        key: key,
        tick: function (object) {
            var active = false;
            for (var i = 0; i < subsprings.length; i += 1) {
                if (subsprings[i].tick(value))
                    active = true;
            }
            if (!active) {
                object[key] = b;
                return false;
            }
            object[key] = value;
            return true;
        },
        update: function (object, options) {
            checkCompatibility(object, b);
            for (var i = 0; i < subsprings.length; i += 1) {
                subsprings[i].update(object[subsprings[i].key], options);
            }
            b = object;
        }
    };
}
function checkCompatibility(a, b) {
    var type = typeof a;
    if (type !== typeof b ||
        Array.isArray(a) !== Array.isArray(b) ||
        isDate(a) !== isDate(b)) {
        throw new Error('Cannot interpolate values of different type');
    }
    if (type === 'object') {
        if (!a || !b)
            throw new Error('Object cannot be null');
        if (Array.isArray(a)) {
            if (a.length !== b.length) {
                throw new Error('Cannot interpolate arrays of different length');
            }
        }
        else {
            if (!keysMatch(a, b))
                throw new Error('Cannot interpolate differently-shaped objects');
        }
    }
    else if (type !== 'number') {
        throw new Error("Cannot interpolate " + type + " values");
    }
}
function getSpring(key, a, b, options) {
    if (a === b || a !== a)
        return snap$1(key, a, b, options);
    checkCompatibility(a, b);
    if (typeof a === 'object') {
        if (Array.isArray(a)) {
            return array(key, a, b, options);
        }
        if (isDate(a)) {
            return date(key, a, b, options);
        }
        return object(key, a, b, options);
    }
    return number(key, a, b, options);
}
function spring(key, to, options) {
    var _this = this;
    if (!this._springs) {
        this._springs = Object.create(null);
        this._springCallbacks = Object.create(null);
        this._springing = false;
        var set_1 = this.set;
        this.set = function (data) {
            if (!_this._springing) {
                for (var key_1 in data) {
                    delete _this._springs[key_1];
                }
            }
            set_1.call(_this, data);
        };
    }
    if (this._springs[key]) {
        this._springs[key].update(to, options);
    }
    else {
        var spring_2 = getSpring(key, this.get()[key], to, options);
        this._springs[key] = spring_2;
    }
    var promise = new Promise(function (fulfil) {
        _this._springCallbacks[key] = fulfil;
    });
    scheduler$1.add(this);
    return promise;
}
function keysMatch(a, b) {
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length)
        return false;
    for (var i = 0; i < aKeys.length; i += 1) {
        if (!(aKeys[i] in b))
            return false;
    }
    return true;
}

var tabbable = function(el, options) {
  options = options || {};

  var elementDocument = el.ownerDocument || el;
  var basicTabbables = [];
  var orderedTabbables = [];

  // A node is "available" if
  // - it's computed style
  var isUnavailable = createIsUnavailable(elementDocument);

  var candidateSelectors = [
    'input',
    'select',
    'a[href]',
    'textarea',
    'button',
    '[tabindex]',
  ];

  var candidates = el.querySelectorAll(candidateSelectors.join(','));

  if (options.includeContainer) {
    var matches = Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;

    if (
      candidateSelectors.some(function(candidateSelector) {
        return matches.call(el, candidateSelector);
      })
    ) {
      candidates = Array.prototype.slice.apply(candidates);
      candidates.unshift(el);
    }
  }

  var candidate, candidateIndexAttr, candidateIndex;
  for (var i = 0, l = candidates.length; i < l; i++) {
    candidate = candidates[i];
    candidateIndexAttr = parseInt(candidate.getAttribute('tabindex'), 10);
    candidateIndex = isNaN(candidateIndexAttr) ? candidate.tabIndex : candidateIndexAttr;

    if (
      candidateIndex < 0
      || (candidate.tagName === 'INPUT' && candidate.type === 'hidden')
      || candidate.disabled
      || isUnavailable(candidate, elementDocument)
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

function createIsUnavailable(elementDocument) {
  // Node cache must be refreshed on every check, in case
  // the content of the element has changed
  var isOffCache = [];

  // "off" means `display: none;`, as opposed to "hidden",
  // which means `visibility: hidden;`. getComputedStyle
  // accurately reflects visiblity in context but not
  // "off" state, so we need to recursively check parents.

  function isOff(node, nodeComputedStyle) {
    if (node === elementDocument.documentElement) return false;

    // Find the cached node (Array.prototype.find not available in IE9)
    for (var i = 0, length = isOffCache.length; i < length; i++) {
      if (isOffCache[i][0] === node) return isOffCache[i][1];
    }

    nodeComputedStyle = nodeComputedStyle || elementDocument.defaultView.getComputedStyle(node);

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
    if (node === elementDocument.documentElement) return false;

    var computedStyle = elementDocument.defaultView.getComputedStyle(node);

    if (isOff(node, computedStyle)) return true;

    return computedStyle.visibility === 'hidden';
  }
}

var listeningFocusTrap = null;

function focusTrap(element, userOptions) {
  var tabbableNodes = [];
  var firstTabbableNode = null;
  var lastTabbableNode = null;
  var nodeFocusedBeforeActivation = null;
  var active = false;
  var paused = false;
  var tabEvent = null;

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
    // Ensure that the focused element doesn't capture the event that caused the focus trap activation
    setTimeout(function () {
      tryFocus(firstFocusNode());
    }, 0);
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

    if (tabEvent) {
      readjustFocus(tabEvent);
    }
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
    updateTabbableNodes();

    if (e.target.hasAttribute('tabindex') && Number(e.target.getAttribute('tabindex')) < 0) {
      return tabEvent = e;
    }

    e.preventDefault();
    var currentFocusIndex = tabbableNodes.indexOf(e.target);

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
    firstTabbableNode = tabbableNodes[0];
    lastTabbableNode = tabbableNodes[tabbableNodes.length - 1];
  }

  function readjustFocus(e) {
    if (e.shiftKey) return tryFocus(lastTabbableNode);

    tryFocus(firstTabbableNode);
  }
}

function isEscapeEvent(e) {
  return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
}

function tryFocus(node) {
  if (!node || !node.focus) return;
  if (node === document.activeElement)  return;

  node.focus();
  if (node.tagName.toLowerCase() === 'input') {
    node.select();
  }
}

var focusTrap_1$1 = focusTrap;

const activeModals = [];

const makeModalStackable = modal => {
  modal.on("opening", () => {
    activeModals.forEach(modal => modal.background());
    modal.foreground();
    activeModals.push(modal);
    const deactivate = () => {
      hiddenListener.cancel();
      destroyListener.cancel();
      activeModals.pop();
      const nextModal = activeModals[activeModals.length - 1];
      // without setTimeout, the esc key event that dismisses a modal will also dismiss the next one
      nextModal && setTimeout(() => nextModal.foreground());
    };
    const hiddenListener = modal.on("hiding", deactivate);
    const destroyListener = modal.on("destroy", deactivate);
  });
};

/* src/Modal.html generated by Svelte v2.13.2 */
// TODO: write a smaller, less "featured" focusTrap. It really just needs to trap focus
const makeFocusTrap = ({ rootElement }) => {
  return focusTrap_1$1(rootElement, {
    initialFocus: rootElement,
    fallbackFocus: rootElement,
    escapeDeactivates: false,
    returnFocusOnDeactivate: true,
    clickOutsideDeactivates: false
  });
};

/* TODO: maybe make a way to accept custom transitions */
// which might conflict with this todo:
/* TODO: be fancy and take a touch/click/element position to transition in from */
const STYLE = {
  modal: { open: { opacity: 1 }, hidden: { opacity: 0 } },
  content: { open: { scale: 1 }, hidden: { scale: 0.9 } }
};
const DEFAULTS = {
  initiallyHidden: false,
  initialFocusElement: false,
  center: true,
  zIndexBase: 1,
  pressScrimToDismiss: true,
  escToDismiss: true,
  trapFocus: true
};

[STYLE, DEFAULTS].forEach(Object.freeze);

function transitioning({ hiding, opening }) {
	return hiding || opening;
}

function open({ hidden, transitioning }) {
	return !hidden && !transitioning;
}

function zIndex({ zIndexBase, inForeground }) {
	return inForeground ? zIndexBase : zIndexBase - 1;
}

function data() {
  return Object.assign(
    {
      hidden: true,
      hiding: false,
      opening: false,
      inForeground: false, // to handle stacking of multiple modals open at once
      modalStyle: STYLE.modal.hidden,
      contentStyle: STYLE.content.hidden
    },
    DEFAULTS
  );
}

var methods = {
  spring(key, end, options) {
    options = options || { stiffness: 0.5, damping: 1 };
    return spring.call(this, key, end, options);
  },

  focusInitialFocusElement() {
    const initialFocusElement = this.get().initialFocusElement;
    initialFocusElement && initialFocusElement.focus();
  },

  onKeyup(event) {
    const shouldDismiss =
      event.key.toLowerCase() === "escape" &&
      this.get().escToDismiss &&
      this.get().inForeground;
    if (shouldDismiss) {
      this.dismiss();
    }
  },

  onScrimPress() {
    if (this.get("pressScrimToDismiss")) {
      this.dismiss();
    }
  },

  open() {
    if (this.get().open || this.get().opening) {
      return;
    }

    this.set({ opening: true, hiding: false, hidden: false });
    this.fire("opening");

    Promise.all([
      this.spring("modalStyle", STYLE.modal.open),
      this.spring("contentStyle", STYLE.content.open)
    ]).then(() => {
      this.set({ opening: false });
      this.fire("opened");
    });

    return this;
  },

  hide(reason, result) {
    if (this.get().hidden || this.get().hiding) {
      return;
    }

    this.set({ opening: false, hiding: true });

    this.fire("result", result);
    this.fire(reason, result);
    this.fire("hiding");

    Promise.all([
      this.spring("modalStyle", STYLE.modal.hidden),
      this.spring("contentStyle", STYLE.content.hidden)
    ]).then(() => {
      this.set({ hiding: false, hidden: true });
      this.fire("hidden");
    });

    return this;
  },

  close(result) {
    return this.hide("closed", result);
  },

  dismiss(result) {
    return this.hide("dismissed", result);
  },

  background() {
    this.focusTrap.pause();
    this.set({ inForeground: false });
  },

  foreground(modal) {
    this.focusTrap.unpause();
    this.focusInitialFocusElement();
    this.set({ inForeground: true });
  }
};

function oncreate() {
  this.on("open", () => this.open());
  this.on("dismiss", e => this.dismiss(e));
  this.on("close", e => this.close(e));

  const rootElement = this.refs.modal;

  this.focusTrap = makeFocusTrap({ rootElement });
  this.on("hiding", () => this.focusTrap.deactivate());
  this.on("destroy", () => this.focusTrap.deactivate());

  makeModalStackable(this);

  this.on("opening", () => {
    if (this.get().trapFocus) {
      this.focusTrap.activate();
    }
    setTimeout(() => {
      /* focusTrap seems unable to focus the element
       putting activate() in the setTimeout does not help
       Focusing it manually works just fine,
       and we need to manually focus anyway when trapFocus is false
       also, I don't think focusTrap needs to concern itself with focusing elements
    */
      this.focusInitialFocusElement();
    });
  });
  console.log("looking for initiallyHidden", this);
  if (!this.get().initiallyHidden) {
    this.open();
  }
}

function setup(Modal) {
  Object.assign(Modal, { DEFAULTS });
}

function add_css() {
	var style = createElement("style");
	style.id = 'svelte-1b0dvdd-style';
	style.textContent = ".svelte-modal.svelte-1b0dvdd{position:fixed;top:0;left:0;right:0;height:100%;display:flex;align-items:flex-start;justify-content:center}.svelte-modal-scrim.svelte-1b0dvdd{background:rgba(0, 0, 0, 0.5);position:fixed;top:0;bottom:0;right:0;left:0}[data-center=\"true\"].svelte-1b0dvdd{align-items:center}[data-hidden=\"true\"].svelte-1b0dvdd{visibility:hidden}.content.svelte-1b0dvdd{max-width:100vw;max-height:100vh;overflow:visible;z-index:1}";
	append(document.head, style);
}

function create_main_fragment(component, ctx) {
	var div, div_1, slot_content_default = component._slotted.default, text_1, div_2;

	function onwindowkeyup(event) {
		component.onKeyup(event);
	}
	window.addEventListener("keyup", onwindowkeyup);

	function click_handler(event) {
		component.onScrimPress();
	}

	return {
		c() {
			div = createElement("div");
			div_1 = createElement("div");
			text_1 = createText("\n  ");
			div_2 = createElement("div");
			div_1.className = "content svelte-1b0dvdd";
			setStyle(div_1, "transform", "scale(" + ctx.contentStyle.scale + ")");
			addListener(div_2, "click", click_handler);
			div_2.className = "svelte-modal-scrim svelte-1b0dvdd";
			setStyle(div_2, "z-index", (ctx.zIndex - 1));
			div.className = "svelte-modal svelte-1b0dvdd";
			div.tabIndex = "-1";
			div.dataset.center = ctx.center;
			div.dataset.hidden = ctx.hidden;
			setStyle(div, "z-index", ctx.zIndex);
			setStyle(div, "opacity", ctx.modalStyle.opacity);
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, div_1);

			if (slot_content_default) {
				append(div_1, slot_content_default);
			}

			component.refs.content = div_1;
			append(div, text_1);
			append(div, div_2);
			component.refs.scrim = div_2;
			component.refs.modal = div;
		},

		p(changed, ctx) {
			if (changed.contentStyle) {
				setStyle(div_1, "transform", "scale(" + ctx.contentStyle.scale + ")");
			}

			if (changed.zIndex) {
				setStyle(div_2, "z-index", (ctx.zIndex - 1));
			}

			if (changed.center) {
				div.dataset.center = ctx.center;
			}

			if (changed.hidden) {
				div.dataset.hidden = ctx.hidden;
			}

			if (changed.zIndex) {
				setStyle(div, "z-index", ctx.zIndex);
			}

			if (changed.modalStyle) {
				setStyle(div, "opacity", ctx.modalStyle.opacity);
			}
		},

		d(detach) {
			window.removeEventListener("keyup", onwindowkeyup);

			if (detach) {
				detachNode(div);
			}

			if (slot_content_default) {
				reinsertChildren(div_1, slot_content_default);
			}

			if (component.refs.content === div_1) component.refs.content = null;
			removeListener(div_2, "click", click_handler);
			if (component.refs.scrim === div_2) component.refs.scrim = null;
			if (component.refs.modal === div) component.refs.modal = null;
		}
	};
}

function Modal(options) {
	init(this, options);
	this.refs = {};
	this._state = assign(data(), options.data);
	this._recompute({ hiding: 1, opening: 1, hidden: 1, transitioning: 1, zIndexBase: 1, inForeground: 1 }, this._state);
	this._intro = true;

	this._slotted = options.slots || {};

	if (!document.getElementById("svelte-1b0dvdd-style")) add_css();

	this._fragment = create_main_fragment(this, this._state);

	this.root._oncreate.push(() => {
		oncreate.call(this);
		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
	});

	if (options.target) {
		this._fragment.c();
		this._mount(options.target, options.anchor);

		flush(this);
	}
}

assign(Modal.prototype, proto);
assign(Modal.prototype, methods);

Modal.prototype._recompute = function _recompute(changed, state) {
	if (changed.hiding || changed.opening) {
		if (this._differs(state.transitioning, (state.transitioning = transitioning(state)))) changed.transitioning = true;
	}

	if (changed.hidden || changed.transitioning) {
		if (this._differs(state.open, (state.open = open(state)))) changed.open = true;
	}

	if (changed.zIndexBase || changed.inForeground) {
		if (this._differs(state.zIndex, (state.zIndex = zIndex(state)))) changed.zIndex = true;
	}
};

setup(Modal);

export default Modal;
