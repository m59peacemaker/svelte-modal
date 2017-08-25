(function () {
'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var supportsCaptureOption_1 = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var supportsCaptureOption = false;
try {
  var opts = Object.defineProperty({}, 'capture', {
    get: function get() {
      supportsCaptureOption = true;
    }
  });
  window.addEventListener('test', null, opts);
} catch (e) {
  //ignore
}

exports.default = supportsCaptureOption;
module.exports = exports['default'];

});

var js = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;



var _supportsCaptureOption2 = _interopRequireDefault(supportsCaptureOption_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addEventListener(target, type, handler, options, wantsUntrusted) {
  var optionsOrCapture = _supportsCaptureOption2.default || !options || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' ? options : !!options.capture;
  target.addEventListener(type, handler, optionsOrCapture, wantsUntrusted);
}

function removeEventListener(target, type, handler, options) {
  var optionsOrCapture = _supportsCaptureOption2.default || !options || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' ? options : !!options.capture;
  target.removeEventListener(type, handler, optionsOrCapture);
}

});

var js_1 = js.addEventListener;
var js_2 = js.removeEventListener;

const addEventListener$1 = (element, name, listener, options) => {
  js_1(element, name, listener, options);
  return () => js_2(element, name, listener, options)
};

const once = (element, name, listener, options) => {
  const off = addEventListener$1(element, name, (...args) => {
    off();
    return listener(...args)
  }, options);
  return off
};

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
/* TODO: when svelte has named slots, accept a label slot and description slot, use them to add aria attributes
  <div class="content" role="dialog" aria-labelledby="modal-content-label-{{ instanceId }}" aria-describedby="modal-content-description-{{ instanceId }}">
    <slot name="label" id="modal-content-label-{{ instanceId }}"></slot>
    <slot name="description" id="modal-content-description-{{ instanceId }}"></slot>
*/

/* TODO: take content in a slot when svelte gets them */

/* TODO: maybe use a scrim slot with a default scrim */

const registerEscapeToDismiss = component => {
  const keyup = e => {
    const pressedKey = e.key.toLowerCase();
    if (pressedKey === 'escape') {
      component.dismiss();
    }
  };

  const unlisten = () => window.removeEventListener('keyup', keyup);

  component.observe('open', open => {
    open
      ? window.addEventListener('keyup', keyup)
      : unlisten();
  });

  component.on('destroy', unlisten);
};

return {
  data () {
    return {
      open: false,
      center: false,
      zIndexBase: 1,
      transitionDuration: 200,
      clickToDismiss: true,
      escapeToDismiss: true,
      //backButtonToDismiss: true,
    }
  },

  oncreate () {
    if (this.get('escapeToDismiss')) {
      registerEscapeToDismiss(this);
    }
  },

  methods: {
    onScrimClick () {
      this.get('clickToDismiss') && this.dismiss();
    },
    open () {
      this.set({ open: true });
      this.fire('open');
      return this
    },
    close (data) {
      if (this.get('open')) {
        once(this.refs.modal, 'transitionend', () => {
          this.fire('closed', data);
        });
        this.set({ open: false });
      }
      return this
    },
    dismiss (data) {
      if (this.get('open')) {
        once(this.refs.modal, 'transitionend', () => {
          this.fire('dismissed', data);
        });
        this.set({ open: false });
      }
      return this
    }
  }
}
}());

function encapsulateStyles$1 ( node ) {
	setAttribute( node, 'svelte-4080081678', '' );
}

function add_css$1 () {
	var style = createElement( 'style' );
	style.id = 'svelte-4080081678-style';
	style.textContent = "[svelte-4080081678].svelte-modal,[svelte-4080081678] .svelte-modal{position:fixed;top:0;left:0;right:0;height:100%;display:flex;align-items:flex-start;justify-content:center;visibility:hidden;opacity:0;transition:all}[svelte-4080081678].svelte-modal.open,[svelte-4080081678] .svelte-modal.open{visibility:visible;opacity:1}[svelte-4080081678].svelte-modal.center,[svelte-4080081678] .svelte-modal.center{align-items:center}[svelte-4080081678].svelte-modal > .content,[svelte-4080081678] .svelte-modal > .content{max-width:100vw;max-height:100vh;overflow:auto;z-index:1;transform:scale(0.9);transition:all}[svelte-4080081678].svelte-modal.open > .content,[svelte-4080081678] .svelte-modal.open > .content{transform:scale(1)}[svelte-4080081678].scrim,[svelte-4080081678] .scrim{position:fixed;top:0;right:0;left:0;height:100vh;background:#000000;opacity:0.3;-webkit-tap-highlight-color:rgba(0,0,0,0)}";
	appendNode( style, document.head );
}

function create_main_fragment$1 ( state, component ) {
	var div, div_class_value, div_style_value, div_1, div_1_style_value, text_1, div_2;

	function click_handler ( event ) {
		component.onScrimClick();
	}

	return {
		create: function () {
			div = createElement( 'div' );
			div_1 = createElement( 'div' );
			text_1 = createText( "\n  " );
			div_2 = createElement( 'div' );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles$1( div );
			div.className = div_class_value = "svelte-modal " + ( state.open ? 'open' : 'closed' ) + " " + ( state.center ? 'center' : '' );
			div.style.cssText = div_style_value = "z-index: " + ( state.zIndexBase ) + "; transition-duration: " + ( state.transitionDuration ) + "ms;";
			div_1.className = "content";
			div_1.style.cssText = div_1_style_value = "transition-duration: " + ( state.transitionDuration ) + "ms;";
			div_2.className = "scrim";
			addListener( div_2, 'click', click_handler );
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			component.refs.modal = div;
			appendNode( div_1, div );
			component.refs.content = div_1;
			if ( component._yield ) component._yield.mount( div_1, null );
			appendNode( text_1, div );
			appendNode( div_2, div );
		},

		update: function ( changed, state ) {
			if ( ( changed.open || changed.center ) && div_class_value !== ( div_class_value = "svelte-modal " + ( state.open ? 'open' : 'closed' ) + " " + ( state.center ? 'center' : '' ) ) ) {
				div.className = div_class_value;
			}

			if ( ( changed.zIndexBase || changed.transitionDuration ) && div_style_value !== ( div_style_value = "z-index: " + ( state.zIndexBase ) + "; transition-duration: " + ( state.transitionDuration ) + "ms;" ) ) {
				div.style.cssText = div_style_value;
			}

			if ( ( changed.transitionDuration ) && div_1_style_value !== ( div_1_style_value = "transition-duration: " + ( state.transitionDuration ) + "ms;" ) ) {
				div_1.style.cssText = div_1_style_value;
			}
		},

		unmount: function () {
			detachNode( div );
			if ( component._yield ) component._yield.unmount();
		},

		destroy: function () {
			if ( component.refs.modal === div ) component.refs.modal = null;
			if ( component.refs.content === div_1 ) component.refs.content = null;
			removeListener( div_2, 'click', click_handler );
		}
	};
}

function Modal ( options ) {
	options = options || {};
	this.refs = {};
	this._state = assign( template$1.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !document.getElementById( 'svelte-4080081678-style' ) ) add_css$1();

	var oncreate = template$1.oncreate.bind( this );

	if ( !options._root ) {
		this._oncreate = [oncreate];
	} else {
	 	this._root._oncreate.push(oncreate);
	 }

	this._fragment = create_main_fragment$1( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}

	if ( !options._root ) {
		callAll(this._oncreate);
	}
}

assign( Modal.prototype, template$1.methods, proto );

function encapsulateStyles$2 ( node ) {
	setAttribute( node, 'svelte-399748276', '' );
}

function add_css$2 () {
	var style = createElement( 'style' );
	style.id = 'svelte-399748276-style';
	style.textContent = "[svelte-399748276].content,[svelte-399748276] .content{background:white;padding:30px;margin:50px 10px;border-radius:4px}";
	appendNode( style, document.head );
}

function create_main_fragment$2 ( state, component ) {
	var div, p, text, text_1, button, text_2, text_3, button_1, text_4;

	function click_handler ( event ) {
		component.fire('dismiss', 'It got dismissed.');
	}

	function click_handler_1 ( event ) {
		component.fire('close', `It's come to a close.`);
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
			encapsulateStyles$2( div );
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
	options = options || {};
	this._state = options.data || {};

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;
	this._bind = options._bind;

	if ( !document.getElementById( 'svelte-399748276-style' ) ) add_css$2();

	this._fragment = create_main_fragment$2( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}
}

assign( ModalContent.prototype, proto );

const Modal$1 = function (options = {}) {
  const modal = new Modal({
    data: options,
    target: document.body
  });
  const open = modal.open;
  modal.open = (...args) => { // hack so that the element transitions in as it should
    setTimeout(() => open.apply(modal, args));
    return modal
  };
  return modal
};

var template = (function () {
return {
  data () {
    return {
      center: false
    }
  },

  oncreate () {
    const { modal, modalContent } = this.refs;

    modal.on('closed', result => console.log('closed', result));
    modal.on('dismissed', result => console.log('dismissed', result));

    modalContent.on('dismiss', result => modal.dismiss(result));
    modalContent.on('close', result => modal.close(result));
  },

  methods: {
    openApiModal () {
      // TODO: figure out a way to make something like this work
      const modal = Modal$1({
        content: new ModalContent(),
        center: this.get('center')
      });
      const makeListener = name =>
        result => {
          console.log(result);
          modal.destroy();
        };
      modal.on('closed', makeListener('closed'));
      modal.on('dismissed', makeListener('dismissed'));
      modal.open();
    }
  }
}
}());

function encapsulateStyles ( node ) {
	setAttribute( node, 'svelte-1529528822', '' );
}

function add_css () {
	var style = createElement( 'style' );
	style.id = 'svelte-1529528822-style';
	style.textContent = "label[svelte-1529528822],[svelte-1529528822] label{display:block;margin:30px 0}";
	appendNode( style, document.head );
}

function create_main_fragment ( state, component ) {
	var label, text, input, input_updating = false, text_2, button, text_3, text_4, button_1, text_5, text_6;

	function input_change_handler () {
		input_updating = true;
		component.set({ center: input.checked });
		input_updating = false;
	}

	function click_handler ( event ) {
		component.refs.modal.open();
	}

	function click_handler_1 ( event ) {
		component.openApiModal();
	}

	var modalcomponent_1_yield_fragment = create_modalcomponent_yield_fragment( state, component );

	var modalcomponent_1 = new Modal({
		_root: component._root,
		_yield: modalcomponent_1_yield_fragment,
		data: { center: state.center }
	});

	component.refs.modal = modalcomponent_1;

	return {
		create: function () {
			label = createElement( 'label' );
			text = createText( "Center modal\n  " );
			input = createElement( 'input' );
			text_2 = createText( "\n" );
			button = createElement( 'button' );
			text_3 = createText( "Open Component Modal" );
			text_4 = createText( "\n" );
			button_1 = createElement( 'button' );
			text_5 = createText( "Open API Modal" );
			text_6 = createText( "\n\n" );
			modalcomponent_1_yield_fragment.create();
			modalcomponent_1._fragment.create();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			encapsulateStyles( label );
			input.type = "checkbox";
			addListener( input, 'change', input_change_handler );
			encapsulateStyles( button );
			addListener( button, 'click', click_handler );
			encapsulateStyles( button_1 );
			addListener( button_1, 'click', click_handler_1 );
		},

		mount: function ( target, anchor ) {
			insertNode( label, target, anchor );
			appendNode( text, label );
			appendNode( input, label );

			input.checked = state.center;

			insertNode( text_2, target, anchor );
			insertNode( button, target, anchor );
			appendNode( text_3, button );
			insertNode( text_4, target, anchor );
			insertNode( button_1, target, anchor );
			appendNode( text_5, button_1 );
			insertNode( text_6, target, anchor );
			modalcomponent_1._fragment.mount( target, anchor );
		},

		update: function ( changed, state ) {
			if ( !input_updating ) {
				input.checked = state.center;
			}

			var modalcomponent_1_changes = {};
			if ( changed.center ) modalcomponent_1_changes.center = state.center;
			modalcomponent_1._set( modalcomponent_1_changes );
		},

		unmount: function () {
			detachNode( label );
			detachNode( text_2 );
			detachNode( button );
			detachNode( text_4 );
			detachNode( button_1 );
			detachNode( text_6 );
			modalcomponent_1._fragment.unmount();
		},

		destroy: function () {
			removeListener( input, 'change', input_change_handler );
			removeListener( button, 'click', click_handler );
			removeListener( button_1, 'click', click_handler_1 );
			modalcomponent_1_yield_fragment.destroy();
			modalcomponent_1.destroy( false );
			if ( component.refs.modal === modalcomponent_1 ) component.refs.modal = null;
		}
	};
}

function create_modalcomponent_yield_fragment ( state, component ) {

	var modalcontent = new ModalContent({
		_root: component._root
	});

	component.refs.modalContent = modalcontent;

	return {
		create: function () {
			modalcontent._fragment.create();
		},

		mount: function ( target, anchor ) {
			modalcontent._fragment.mount( target, anchor );
		},

		unmount: function () {
			modalcontent._fragment.unmount();
		},

		destroy: function () {
			modalcontent.destroy( false );
			if ( component.refs.modalContent === modalcontent ) component.refs.modalContent = null;
		}
	};
}

function Demo ( options ) {
	options = options || {};
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

	if ( !document.getElementById( 'svelte-1529528822-style' ) ) add_css();

	var oncreate = template.oncreate.bind( this );

	if ( !options._root ) {
		this._oncreate = [oncreate];
		this._beforecreate = [];
		this._aftercreate = [];
	} else {
	 	this._root._oncreate.push(oncreate);
	 }

	this._fragment = create_main_fragment( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
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

new Demo({ target: document.body });

}());
