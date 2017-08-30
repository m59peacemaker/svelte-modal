(function () {
'use strict';

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

function createFragment() {
	return document.createDocumentFragment();
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

function toNumber(value) {
	return value === '' ? undefined : +value;
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

var template$2 = (function () {
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

function encapsulateStyles$2 ( node ) {
	setAttribute( node, 'svelte-4157681185', '' );
}

function add_css$2 () {
	var style = createElement( 'style' );
	style.id = 'svelte-4157681185-style';
	style.textContent = ".scrim[svelte-4157681185]{position:fixed;top:0;right:0;left:0;height:100vh;-webkit-tap-highlight-color:rgba(0, 0, 0, 0)}";
	appendNode( style, document.head );
}

function create_main_fragment$2 ( state, component ) {
	var div, div_style_value;

	return {
		create: function () {
			div = createElement( 'div' );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles$2( div );
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
	this._state = assign( template$2.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !document.getElementById( 'svelte-4157681185-style' ) ) add_css$2();

	this._fragment = create_main_fragment$2( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}
}

assign( Scrim.prototype, proto );

template$2.setup( Scrim );

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
function linear$1(x) {
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
        ease: options.easing || linear$1,
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

var template$1 = (function () {
/* TODO: be fancy and take a touch/click/element position to transition in from */
/* TODO: maybe make a way to accept custom transition styles and easings */
const STYLE = {
  modal:   { open: { opacity: 1 }, hidden: { opacity: 0 } },
  content: { open: { scale: 1 },   hidden: { scale: 0.9 } }
};
const STATES = {
  open: 'open',
  hidden: 'hidden'
};
const DEFAULTS = {
  initialState: STATES.open,
  center: false,
  zIndexBase: 1,
  transitionDuration: 225,
  pressScrimToDismiss: true,
  escapeToDismiss: true,
  //backButtonToDismiss: true, // TODO: implement this
};
Object.freeze(DEFAULTS);
Object.freeze(STATES);
Object.freeze(STYLE);

return {
  setup (Modal) {
    Modal.DEFAULTS = DEFAULTS;
    Modal.STATES = STATES;
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
    open: (hidden, transitioning) => !hidden && !transitioning
  },

  oncreate () {
    if (this.get('initialState') === STATES.open) {
      this.open();
    }
  },

  methods: {
    tween,

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
      this.fire('opening');

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
          this.fire('opened');
        });

      return this
    },

    hide (reason, result) {
      if (this.get('hidden') || this.get('hiding')) { return }

      this.set({ opening: false, hiding: true });

      this.fire('result', result);
      this.fire(reason, result);

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
          this.fire('hidden');
        });

      return this
    },

    close (result) {
      return this.hide('closed', result)
    },

    dismiss (result) {
      return this.hide('dismissed', result)
    }
  }
}
}());

function encapsulateStyles$1 ( node ) {
	setAttribute( node, 'svelte-820181151', '' );
}

function add_css$1 () {
	var style = createElement( 'style' );
	style.id = 'svelte-820181151-style';
	style.textContent = ".svelte-modal[svelte-820181151]{position:fixed;top:0;left:0;right:0;height:100%;display:flex;align-items:flex-start;justify-content:center}[data-center=\"true\"][svelte-820181151]{align-items:center}[data-hidden=\"true\"][svelte-820181151]{visibility:hidden}.content[svelte-820181151]{max-width:100vw;max-height:100vh;overflow:visible;z-index:1}";
	appendNode( style, document.head );
}

function create_main_fragment$1 ( state, component ) {
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
			encapsulateStyles$1( div );
			div.className = "svelte-modal";
			setAttribute( div, 'data-center', state.center );
			setAttribute( div, 'data-hidden', state.hidden );
			div.style.cssText = div_style_value = "z-index: " + ( state.zIndexBase ) + "; opacity: " + ( state.modalStyle.opacity ) + ";";
			encapsulateStyles$1( div_1 );
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
	this._state = assign( template$1.data(), options.data );
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

	if ( !document.getElementById( 'svelte-820181151-style' ) ) add_css$1();

	var oncreate = template$1.oncreate.bind( this );

	if ( !options._root ) {
		this._oncreate = [oncreate];
		this._beforecreate = [];
		this._aftercreate = [];
	} else {
	 	this._root._oncreate.push(oncreate);
	 }

	this.slots = {};

	this._fragment = create_main_fragment$1( this._state, this );

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

assign( Modal.prototype, template$1.methods, proto );

Modal.prototype._recompute = function _recompute ( changed, state, oldState, isInitial ) {
	if ( isInitial || changed.hiding || changed.opening ) {
		if ( differs( ( state.transitioning = template$1.computed.transitioning( state.hiding, state.opening ) ), oldState.transitioning ) ) changed.transitioning = true;
	}

	if ( isInitial || changed.hidden || changed.transitioning ) {
		if ( differs( ( state.open = template$1.computed.open( state.hidden, state.transitioning ) ), oldState.open ) ) changed.open = true;
	}
};

template$1.setup( Modal );

var template$3 = (function () {
return {
  methods: {
    closeModal (method, message) {
      this.fire(`modal.${method}`, message);
    }
  }
}
}());

function encapsulateStyles$3 ( node ) {
	setAttribute( node, 'svelte-3741696046', '' );
}

function add_css$3 () {
	var style = createElement( 'style' );
	style.id = 'svelte-3741696046-style';
	style.textContent = ".content[svelte-3741696046]{background:white;padding:30px;margin:50px 10px;border-radius:4px}";
	appendNode( style, document.head );
}

function create_main_fragment$3 ( state, component ) {
	var div, p, text, text_1, button, text_2, text_3, button_1, text_4;

	function click_handler ( event ) {
		component.closeModal('dismiss', 'It got dismissed.');
	}

	function click_handler_1 ( event ) {
		component.closeModal('close', `It's come to a close.`);
	}

	return {
		create: function () {
			div = createElement( 'div' );
			p = createElement( 'p' );
			text = createText( "Here is some modal content." );
			text_1 = createText( "\n  " );
			button = createElement( 'button' );
			text_2 = createText( "Dismiss Modal" );
			text_3 = createText( "\n  " );
			button_1 = createElement( 'button' );
			text_4 = createText( "Close Modal" );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles$3( div );
			div.className = "content";
			addListener( button, 'click', click_handler );
			addListener( button_1, 'click', click_handler_1 );
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( p, div );
			appendNode( text, p );
			appendNode( text_1, div );
			appendNode( button, div );
			appendNode( text_2, button );
			appendNode( text_3, div );
			appendNode( button_1, div );
			appendNode( text_4, button_1 );
		},

		update: noop,

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			removeListener( button, 'click', click_handler );
			removeListener( button_1, 'click', click_handler_1 );
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

	if ( !document.getElementById( 'svelte-3741696046-style' ) ) add_css$3();

	this._fragment = create_main_fragment$3( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, options.anchor || null );
	}
}

assign( ModalContent.prototype, template$3.methods, proto );

const getPrototypeKeys = object => Object.getOwnPropertyNames(Object.getPrototypeOf(object));
const uncontextify = object => {
  getPrototypeKeys(object).forEach(key => object[key] = object[key].bind(object));
  return object
};

const Modal$1 = function (options = {}) {
  options = Object.assign(
    { persist: false },
    options,
    { initialState: Modal.STATES.hidden }
  );

  const contentElement = document.createElement('div');
  const modal = new Modal({
    data: options,
    target: document.body,
    slots: {
      default: contentElement
    }
  });

  const { on, open, close, dismiss, destroy }  = uncontextify(modal);
  const publicModal = { on, open, close, dismiss, destroy };

  options.content(contentElement, publicModal);

  if (!options.persist) {
    // TODO: this is bugged...
    modal.on('hidden', publicModal.destroy);
  }

  return publicModal
};

var template = (function () {
return {
  data () {
    return Object.assign({}, Modal.DEFAULTS, {
      shouldShowModal: false,
      modalResult: 'None thus far.',
      showModalResult: false
    })
  },

  methods: {
    openApiModal () {
      const modal = Modal$1({
        content: (slot, modal) => {
          const modalContent = new ModalContent({ target: slot });
          modalContent.on('modal.dismiss', modal.dismiss);
          modalContent.on('modal.close', modal.close);
          modal.on('result', result => this.set({ modalResult: result || '' }));
        },
        center: this.get('center'),
        transitionDuration: this.get('transitionDuration')
      });
      this.set({ modalResult: '' });
      modal.open();
    }
  }
}
}());

function encapsulateStyles ( node ) {
	setAttribute( node, 'svelte-408883272', '' );
}

function add_css () {
	var style = createElement( 'style' );
	style.id = 'svelte-408883272-style';
	style.textContent = "label[svelte-408883272]{display:block;margin:30px 0}";
	appendNode( style, document.head );
}

function create_main_fragment ( state, component ) {
	var label, text, input, input_updating = false, text_2, label_1, text_3, input_1, input_1_updating = false, text_5, button, text_6, text_7, button_1, text_8, text_9, p, strong, text_10, text_11, text_12_value = state.modalResult || '', text_12, text_13, if_block_anchor;

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

	function click_handler_1 ( event ) {
		component.openApiModal();
	}

	var if_block = (state.shouldShowModal) && create_if_block( state, component );

	return {
		create: function () {
			label = createElement( 'label' );
			text = createText( "Center modal\n  " );
			input = createElement( 'input' );
			text_2 = createText( "\n" );
			label_1 = createElement( 'label' );
			text_3 = createText( "Transition duration in ms (0 to disable transition)\n  " );
			input_1 = createElement( 'input' );
			text_5 = createText( "\n\n" );
			button = createElement( 'button' );
			text_6 = createText( "Open Component Modal" );
			text_7 = createText( "\n" );
			button_1 = createElement( 'button' );
			text_8 = createText( "Open API Modal" );
			text_9 = createText( "\n\n" );
			p = createElement( 'p' );
			strong = createElement( 'strong' );
			text_10 = createText( "Modal result:" );
			text_11 = createText( " " );
			text_12 = createText( text_12_value );
			text_13 = createText( "\n\n" );
			if ( if_block ) if_block.create();
			if_block_anchor = createComment();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles( label );
			input.type = "checkbox";
			addListener( input, 'change', input_change_handler );
			encapsulateStyles( label_1 );
			input_1.type = "number";
			addListener( input_1, 'input', input_1_input_handler );
			addListener( button, 'click', click_handler );
			addListener( button_1, 'click', click_handler_1 );
		},

		mount: function ( target, anchor ) {
			insertNode( label, target, anchor );
			appendNode( text, label );
			appendNode( input, label );

			input.checked = state.center;

			insertNode( text_2, target, anchor );
			insertNode( label_1, target, anchor );
			appendNode( text_3, label_1 );
			appendNode( input_1, label_1 );

			input_1.value = state.transitionDuration;

			insertNode( text_5, target, anchor );
			insertNode( button, target, anchor );
			appendNode( text_6, button );
			insertNode( text_7, target, anchor );
			insertNode( button_1, target, anchor );
			appendNode( text_8, button_1 );
			insertNode( text_9, target, anchor );
			insertNode( p, target, anchor );
			appendNode( strong, p );
			appendNode( text_10, strong );
			appendNode( text_11, p );
			appendNode( text_12, p );
			insertNode( text_13, target, anchor );
			if ( if_block ) if_block.mount( target, anchor );
			insertNode( if_block_anchor, target, anchor );
		},

		update: function ( changed, state ) {
			if ( !input_updating ) {
				input.checked = state.center;
			}

			if ( !input_1_updating ) {
				input_1.value = state.transitionDuration;
			}

			if ( ( changed.modalResult ) && text_12_value !== ( text_12_value = state.modalResult || '' ) ) {
				text_12.data = text_12_value;
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
			detachNode( label );
			detachNode( text_2 );
			detachNode( label_1 );
			detachNode( text_5 );
			detachNode( button );
			detachNode( text_7 );
			detachNode( button_1 );
			detachNode( text_9 );
			detachNode( p );
			detachNode( text_13 );
			if ( if_block ) if_block.unmount();
			detachNode( if_block_anchor );
		},

		destroy: function () {
			removeListener( input, 'change', input_change_handler );
			removeListener( input_1, 'input', input_1_input_handler );
			removeListener( button, 'click', click_handler );
			removeListener( button_1, 'click', click_handler_1 );
			if ( if_block ) if_block.destroy();
		}
	};
}

function create_if_block ( state, component ) {
	var modalcomponent_updating = {}, text_1, p, strong, text_2, text_3, text_4, text_5, text_6, text_7;

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

	var modalcomponent_initial_data = {
		center: state.center,
		transitionDuration: state.transitionDuration
	};
	if ( 'opening' in state ) {
		modalcomponent_initial_data.opening = state.opening
    ;
		modalcomponent_updating.opening = true;
	}
	if ( 'hiding' in state ) {
		modalcomponent_initial_data.hiding = state.hiding
    ;
		modalcomponent_updating.hiding = true;
	}
	var modalcomponent = new Modal({
		_root: component._root,
		slots: { default: createFragment() },
		data: modalcomponent_initial_data,
		_bind: function(changed, childState) {
			var state = component.get(), newState = {};
			if ( !modalcomponent_updating.opening && changed.opening ) {
				newState.opening = childState.opening;
			}

			if ( !modalcomponent_updating.hiding && changed.hiding ) {
				newState.hiding = childState.hiding;
			}
			modalcomponent_updating = changed;
			component._set(newState);
			modalcomponent_updating = {};
		}
	});

	component._root._beforecreate.push(function () {
		var state = component.get(), childState = modalcomponent.get(), newState = {};
		if (!childState) return;
		if ( !modalcomponent_updating.opening ) {
			newState.opening = childState.opening;
		}

		if ( !modalcomponent_updating.hiding ) {
			newState.hiding = childState.hiding;
		}
		modalcomponent_updating = { opening: true, hiding: true };
		component._set(newState);
		modalcomponent_updating = {};
	});

	modalcomponent.on( 'result', function ( event ) {
		component.set({ modalResult: event });
	});

	modalcomponent.on( 'hidden', function ( event ) {
		component.set({ shouldShowModal: false });
	});

	component.refs.modal = modalcomponent;

	return {
		create: function () {
			modalcontent._fragment.create();
			modalcomponent._fragment.create();
			text_1 = createText( "\n\n  " );
			p = createElement( 'p' );
			strong = createElement( 'strong' );
			text_2 = createText( "Modal state:" );
			text_3 = createText( "\n    { opening: " );
			text_4 = createText( state.opening );
			text_5 = createText( ", hiding: " );
			text_6 = createText( state.hiding );
			text_7 = createText( " }" );
		},

		mount: function ( target, anchor ) {
			modalcontent._fragment.mount( modalcomponent._slotted.default, null );
			modalcomponent._fragment.mount( target, anchor );
			insertNode( text_1, target, anchor );
			insertNode( p, target, anchor );
			appendNode( strong, p );
			appendNode( text_2, strong );
			appendNode( text_3, p );
			appendNode( text_4, p );
			appendNode( text_5, p );
			appendNode( text_6, p );
			appendNode( text_7, p );
		},

		update: function ( changed, state ) {
			var modalcomponent_changes = {};
			if ( changed.center ) modalcomponent_changes.center = state.center;
			if ( changed.transitionDuration ) modalcomponent_changes.transitionDuration = state.transitionDuration;
			if ( !modalcomponent_updating.opening && changed.opening ) {
				modalcomponent_changes.opening = state.opening
    ;
				modalcomponent_updating.opening = true;
			}
			if ( !modalcomponent_updating.hiding && changed.hiding ) {
				modalcomponent_changes.hiding = state.hiding
    ;
				modalcomponent_updating.hiding = true;
			}
			modalcomponent._set( modalcomponent_changes );
			modalcomponent_updating = {};

			if ( changed.opening ) {
				text_4.data = state.opening;
			}

			if ( changed.hiding ) {
				text_6.data = state.hiding;
			}
		},

		unmount: function () {
			modalcomponent._fragment.unmount();
			detachNode( text_1 );
			detachNode( p );
		},

		destroy: function () {
			modalcontent.destroy( false );
			if ( component.refs.modalContent === modalcontent ) component.refs.modalContent = null;
			modalcomponent.destroy( false );
			if ( component.refs.modal === modalcomponent ) component.refs.modal = null;
		}
	};
}

function Demo ( options ) {
	this.options = options;
	this.refs = {};
	this._state = assign( template.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !document.getElementById( 'svelte-408883272-style' ) ) add_css();

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
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign( Demo.prototype, template.methods, proto );

window.app = new Demo({ target: document.body });

}());
