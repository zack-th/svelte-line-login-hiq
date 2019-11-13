
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const storeUserHIQ = writable(0);
    const activeProgress = writable(0);
    const passAdmin = writable(0);

    /* src\Loading.svelte generated by Svelte v3.12.1 */

    const file = "src\\Loading.svelte";

    // (13:0) {#if active}
    function create_if_block(ctx) {
    	var t0, t1, if_block2_anchor;

    	var if_block0 = (ctx.temp === 'circle1') && create_if_block_3(ctx);

    	var if_block1 = (ctx.temp === 'dots5') && create_if_block_2(ctx);

    	var if_block2 = (ctx.temp === 'circle_square') && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.temp === 'circle1') {
    				if (!if_block0) {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.temp === 'dots5') {
    				if (!if_block1) {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (ctx.temp === 'circle_square') {
    				if (!if_block2) {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			if (if_block2) if_block2.d(detaching);

    			if (detaching) {
    				detach_dev(if_block2_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(13:0) {#if active}", ctx });
    	return block;
    }

    // (14:2) {#if temp === 'circle1'}
    function create_if_block_3(ctx) {
    	var div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			set_style(div, "z-index", "99");
    			set_style(div, "position", "fixed");
    			attr_dev(div, "id", "circle1");
    			add_location(div, file, 14, 4, 324);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_3.name, type: "if", source: "(14:2) {#if temp === 'circle1'}", ctx });
    	return block;
    }

    // (18:2) {#if temp === 'dots5'}
    function create_if_block_2(ctx) {
    	var div, span0, t0, span1, t1, span2, t2, span3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			t2 = space();
    			span3 = element("span");
    			add_location(span0, file, 19, 6, 481);
    			add_location(span1, file, 20, 6, 497);
    			add_location(span2, file, 21, 6, 513);
    			add_location(span3, file, 22, 6, 529);
    			set_style(div, "z-index", "99");
    			set_style(div, "position", "fixed");
    			attr_dev(div, "id", "dots5");
    			add_location(div, file, 18, 4, 422);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(div, t1);
    			append_dev(div, span2);
    			append_dev(div, t2);
    			append_dev(div, span3);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(18:2) {#if temp === 'dots5'}", ctx });
    	return block;
    }

    // (27:2) {#if temp === 'circle_square'}
    function create_if_block_1(ctx) {
    	var div, span0, t0, span1, t1, span2, t2, span3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			t2 = space();
    			span3 = element("span");
    			add_location(span0, file, 28, 6, 667);
    			add_location(span1, file, 29, 6, 683);
    			add_location(span2, file, 30, 6, 699);
    			add_location(span3, file, 31, 6, 715);
    			set_style(div, "z-index", "99");
    			set_style(div, "position", "fixed");
    			attr_dev(div, "id", "circle_square");
    			add_location(div, file, 27, 4, 600);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(div, t1);
    			append_dev(div, span2);
    			append_dev(div, t2);
    			append_dev(div, span3);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(27:2) {#if temp === 'circle_square'}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.active) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.active) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let active = false;
      let { temp = "circle1" } = $$props;
      activeProgress.subscribe(val => ($$invalidate('active', active = val)));
      // #Ref Loading https://codepen.io/mrsahar/pen/pMxyrE

    	const writable_props = ['temp'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Loading> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('temp' in $$props) $$invalidate('temp', temp = $$props.temp);
    	};

    	$$self.$capture_state = () => {
    		return { active, temp };
    	};

    	$$self.$inject_state = $$props => {
    		if ('active' in $$props) $$invalidate('active', active = $$props.active);
    		if ('temp' in $$props) $$invalidate('temp', temp = $$props.temp);
    	};

    	return { active, temp };
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["temp"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Loading", options, id: create_fragment.name });
    	}

    	get temp() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set temp(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Profile.svelte generated by Svelte v3.12.1 */

    const file$1 = "src\\components\\Profile.svelte";

    function create_fragment$1(ctx) {
    	var section, div0, t0, div8, div7, div6, div5, div4, div1, img, t1, div2, t2, t3, p, t4, t5, t6, div3, a, i, t7, span, t8, dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			t0 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			div2 = element("div");
    			t2 = text(ctx.displayName);
    			t3 = space();
    			p = element("p");
    			t4 = text("สถานะ : ");
    			t5 = text(ctx.statusMessage);
    			t6 = space();
    			div3 = element("div");
    			a = element("a");
    			i = element("i");
    			t7 = space();
    			span = element("span");
    			t8 = text("\r\n                ลงทะเบียน");
    			attr_dev(div0, "class", "mbr-overlay");
    			set_style(div0, "opacity", "0.8");
    			set_style(div0, "background-color", "rgb(193, 193, 193)");
    			add_location(div0, file$1, 65, 2, 1618);
    			attr_dev(img, "src", ctx.pictureUrl);
    			add_location(img, file$1, 86, 14, 2379);
    			attr_dev(div1, "class", "testimonial-photo");
    			add_location(div1, file$1, 85, 12, 2332);
    			set_style(div2, "color", "#727272");
    			attr_dev(div2, "class", "mbr-author-name mbr-bold mbr-fonts-style mbr-white\r\n              display-2");
    			add_location(div2, file$1, 88, 12, 2437);
    			set_style(p, "color", "#f30105");
    			add_location(p, file$1, 94, 12, 2642);
    			attr_dev(i, "class", "mbri-edit");
    			add_location(i, file$1, 100, 16, 2965);
    			attr_dev(span, "class", "btn-icon mbr-iconfont mbr-iconfont-btn");
    			add_location(span, file$1, 101, 16, 3008);
    			set_style(a, "cursor", "pointer");
    			attr_dev(a, "class", "btn btn-sm btn-danger display-7");
    			add_location(a, file$1, 96, 14, 2795);
    			set_style(div3, "margin-top", "20px");
    			attr_dev(div3, "class", "navbar-buttons mbr-section-btn");
    			add_location(div3, file$1, 95, 12, 2710);
    			attr_dev(div4, "class", "card-block");
    			add_location(div4, file$1, 84, 10, 2294);
    			attr_dev(div5, "class", "panel-item svelte-10fsal2");
    			add_location(div5, file$1, 83, 8, 2258);
    			attr_dev(div6, "class", "mbr-testimonial align-center col-12 col-md-10");
    			add_location(div6, file$1, 82, 6, 2189);
    			attr_dev(div7, "class", "media-container-column");
    			set_style(div7, "border-radius", "25px");
    			add_location(div7, file$1, 81, 4, 2116);
    			attr_dev(div8, "class", "container");
    			add_location(div8, file$1, 80, 2, 2087);
    			attr_dev(section, "class", "testimonials5 cid-rHflUuqZcU mbr-parallax-background");
    			attr_dev(section, "id", "testimonials5-3");
    			add_location(section, file$1, 61, 0, 1515);
    			dispose = listen_dev(a, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(section, t0);
    			append_dev(section, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, img);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, t2);
    			append_dev(div4, t3);
    			append_dev(div4, p);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, a);
    			append_dev(a, i);
    			append_dev(a, t7);
    			append_dev(a, span);
    			append_dev(a, t8);
    		},

    		p: function update(changed, ctx) {
    			if (changed.pictureUrl) {
    				attr_dev(img, "src", ctx.pictureUrl);
    			}

    			if (changed.displayName) {
    				set_data_dev(t2, ctx.displayName);
    			}

    			if (changed.statusMessage) {
    				set_data_dev(t5, ctx.statusMessage);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function scrollingDiv(ev) {
      const element = ev.target || ev.srcElement;
      window.scrollTo(0, document.getElementById("register").offsetTop + 550);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	
      let userId,
        statusMessage = "Loading...";
      let displayName = "Loading...";
      let pictureUrl = "assets/images/nopicture.jpg";
      let userHIQ = [];

      onMount(() => {
        activeProgress.set(true);
        initLineLiff();
        storeUserHIQ.subscribe(resp => {
          userHIQ = resp;
        });
      });

      function initLineLiff() {
        liff
          .init({
            liffId: "1653429034-dOYJLjmb"
          })
          .then(() => {
            // start to use LIFF's api
            initGetUserProfile();
          })
          .catch(err => {
            activeProgress.set(false);
            window.alert("Error getting profile: " + error);
          });
      }

      function initGetUserProfile() {
        liff
          .getProfile()
          .then(function(profile) {
            activeProgress.set(false);
            userId = profile.userId;
            $$invalidate('displayName', displayName = profile.displayName || "Loading...");
            $$invalidate('pictureUrl', pictureUrl = profile.pictureUrl);
            $$invalidate('statusMessage', statusMessage = profile.statusMessage);
            // toggleProfileData();
          })
          .catch(function(error) {
            activeProgress.set(false);
            // window.alert('Error getting profile: ' + error);
          });
      }

    	const click_handler = (ev) => scrollingDiv(ev);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('userId' in $$props) userId = $$props.userId;
    		if ('statusMessage' in $$props) $$invalidate('statusMessage', statusMessage = $$props.statusMessage);
    		if ('displayName' in $$props) $$invalidate('displayName', displayName = $$props.displayName);
    		if ('pictureUrl' in $$props) $$invalidate('pictureUrl', pictureUrl = $$props.pictureUrl);
    		if ('userHIQ' in $$props) userHIQ = $$props.userHIQ;
    	};

    	return {
    		statusMessage,
    		displayName,
    		pictureUrl,
    		click_handler
    	};
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Profile", options, id: create_fragment$1.name });
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.12.1 */

    const file$2 = "src\\components\\Footer.svelte";

    function create_fragment$2(ctx) {
    	var section, div0, t0, div10, div9, div2, div1, a, img, t1, div3, h50, t3, p0, t4, br0, t5, br1, t6, t7, div4, h51, t9, p1, t10, br2, t11, t12, div8, h52, t14, div7, div6, div5, p2, t15, br3, t16, input, dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			t0 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			a = element("a");
    			img = element("img");
    			t1 = space();
    			div3 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Address";
    			t3 = space();
    			p0 = element("p");
    			t4 = text("16/17 หมู่7 ซอยวัดสลุด\r\n          ");
    			br0 = element("br");
    			t5 = text("\r\n          ถนนบางนา-ตราด กม.9 ตำบลบางแก้ว\r\n          ");
    			br1 = element("br");
    			t6 = text("\r\n          อำเภอบางพลี สมุทรปราการ 10540");
    			t7 = space();
    			div4 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Contacts";
    			t9 = space();
    			p1 = element("p");
    			t10 = text("Email: marketing@hiqfood.com\r\n          ");
    			br2 = element("br");
    			t11 = text("\r\n          Phone: 02 750 0505");
    			t12 = space();
    			div8 = element("div");
    			h52 = element("h5");
    			h52.textContent = "Admin";
    			t14 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			p2 = element("p");
    			t15 = text("Password\r\n              ");
    			br3 = element("br");
    			t16 = space();
    			input = element("input");
    			attr_dev(div0, "class", "mbr-overlay");
    			set_style(div0, "background-color", "rgb(60, 60, 60)");
    			set_style(div0, "opacity", "0.5");
    			add_location(div0, file$2, 17, 2, 320);
    			attr_dev(img, "src", "assets/images/hiq-logo.png");
    			attr_dev(img, "alt", "Mobirise");
    			attr_dev(img, "title", "");
    			add_location(img, file$2, 26, 12, 610);
    			attr_dev(a, "href", "#");
    			add_location(a, file$2, 25, 10, 584);
    			attr_dev(div1, "class", "media-wrap");
    			add_location(div1, file$2, 24, 8, 548);
    			attr_dev(div2, "class", "col-12 col-md-3");
    			add_location(div2, file$2, 23, 6, 509);
    			attr_dev(h50, "class", "pb-3");
    			add_location(h50, file$2, 34, 8, 838);
    			add_location(br0, file$2, 37, 10, 943);
    			add_location(br1, file$2, 39, 10, 1003);
    			attr_dev(p0, "class", "mbr-text");
    			add_location(p0, file$2, 35, 8, 877);
    			attr_dev(div3, "class", "col-12 col-md-3 mbr-fonts-style display-7");
    			add_location(div3, file$2, 33, 6, 773);
    			attr_dev(h51, "class", "pb-3");
    			add_location(h51, file$2, 44, 8, 1151);
    			add_location(br2, file$2, 47, 10, 1263);
    			attr_dev(p1, "class", "mbr-text");
    			add_location(p1, file$2, 45, 8, 1191);
    			attr_dev(div4, "class", "col-12 col-md-3 mbr-fonts-style display-7");
    			add_location(div4, file$2, 43, 6, 1086);
    			attr_dev(h52, "class", "pb-3");
    			add_location(h52, file$2, 52, 8, 1400);
    			add_location(br3, file$2, 58, 14, 1594);
    			attr_dev(input, "class", "input-sm svelte-1xpodqw");
    			attr_dev(input, "type", "password");
    			add_location(input, file$2, 59, 14, 1616);
    			attr_dev(p2, "class", "mbr-text");
    			add_location(p2, file$2, 56, 10, 1534);
    			attr_dev(div5, "class", "media-wrap");
    			add_location(div5, file$2, 55, 10, 1498);
    			attr_dev(div6, "class", "col-12");
    			add_location(div6, file$2, 54, 10, 1466);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$2, 53, 8, 1437);
    			attr_dev(div8, "class", "col-12 col-md-3 mbr-fonts-style display-7");
    			add_location(div8, file$2, 51, 6, 1335);
    			attr_dev(div9, "class", "media-container-row content text-white");
    			add_location(div9, file$2, 22, 4, 449);
    			attr_dev(div10, "class", "container");
    			add_location(div10, file$2, 21, 2, 420);
    			attr_dev(section, "class", "cid-qTkAaeaxX5 mbr-reveal");
    			attr_dev(section, "id", "footer1-2");
    			add_location(section, file$2, 15, 0, 256);
    			dispose = listen_dev(input, "input", ctx.input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(section, t0);
    			append_dev(section, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div2);
    			append_dev(div2, div1);
    			append_dev(div1, a);
    			append_dev(a, img);
    			append_dev(div9, t1);
    			append_dev(div9, div3);
    			append_dev(div3, h50);
    			append_dev(div3, t3);
    			append_dev(div3, p0);
    			append_dev(p0, t4);
    			append_dev(p0, br0);
    			append_dev(p0, t5);
    			append_dev(p0, br1);
    			append_dev(p0, t6);
    			append_dev(div9, t7);
    			append_dev(div9, div4);
    			append_dev(div4, h51);
    			append_dev(div4, t9);
    			append_dev(div4, p1);
    			append_dev(p1, t10);
    			append_dev(p1, br2);
    			append_dev(p1, t11);
    			append_dev(div9, t12);
    			append_dev(div9, div8);
    			append_dev(div8, h52);
    			append_dev(div8, t14);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, p2);
    			append_dev(p2, t15);
    			append_dev(p2, br3);
    			append_dev(p2, t16);
    			append_dev(p2, input);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function adminSetPass(ev) {
      const passVal = ev.target.value;
      passAdmin.set(passVal);
    }

    function instance$2($$self) {
    	const input_handler = (ev) => adminSetPass(ev);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return { input_handler };
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Footer", options, id: create_fragment$2.name });
    	}
    }

    /* src\components\Navbar.svelte generated by Svelte v3.12.1 */

    const file$3 = "src\\components\\Navbar.svelte";

    function create_fragment$3(ctx) {
    	var section, nav, button, div0, span0, t0, span1, t1, span2, t2, span3, t3, div2, div1, span4, img, t4, span5, a0, t6, div5, ul, li0, a1, t8, li1, a2, t10, div3, a3, t12, div4, a4, span6, t13;

    	const block = {
    		c: function create() {
    			section = element("section");
    			nav = element("nav");
    			button = element("button");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			t2 = space();
    			span3 = element("span");
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			span4 = element("span");
    			img = element("img");
    			t4 = space();
    			span5 = element("span");
    			a0 = element("a");
    			a0.textContent = "Roza Family Food";
    			t6 = space();
    			div5 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Services";
    			t8 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "About Us";
    			t10 = space();
    			div3 = element("div");
    			a3 = element("a");
    			a3.textContent = "New Item";
    			t12 = space();
    			div4 = element("div");
    			a4 = element("a");
    			span6 = element("span");
    			t13 = text("\r\n          ติดต่อสอบถาม");
    			add_location(span0, file$3, 19, 8, 568);
    			add_location(span1, file$3, 20, 8, 586);
    			add_location(span2, file$3, 21, 8, 604);
    			add_location(span3, file$3, 22, 8, 622);
    			attr_dev(div0, "class", "hamburger");
    			add_location(div0, file$3, 18, 6, 535);
    			attr_dev(button, "class", "navbar-toggler navbar-toggler-right");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarSupportedContent");
    			attr_dev(button, "aria-controls", "navbarSupportedContent");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$3, 10, 4, 259);
    			attr_dev(img, "src", "assets/images/hiq-logo.png");
    			attr_dev(img, "alt", "Mobirise");
    			attr_dev(img, "title", "");
    			set_style(img, "height", "3.8rem");
    			add_location(img, file$3, 28, 10, 770);
    			attr_dev(span4, "class", "navbar-logo");
    			add_location(span4, file$3, 27, 8, 732);
    			attr_dev(a0, "class", "navbar-caption text-secondary display-5");
    			attr_dev(a0, "href", "https://mobirise.co");
    			add_location(a0, file$3, 35, 10, 983);
    			attr_dev(span5, "class", "navbar-caption-wrap");
    			add_location(span5, file$3, 34, 8, 937);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file$3, 26, 6, 696);
    			attr_dev(div2, "class", "menu-logo");
    			add_location(div2, file$3, 25, 4, 665);
    			attr_dev(a1, "class", "nav-link link text-primary display-4");
    			attr_dev(a1, "href", "https://mobirise.co");
    			add_location(a1, file$3, 46, 10, 1363);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$3, 45, 8, 1330);
    			attr_dev(a2, "class", "nav-link link dropdown-toggle text-primary display-4");
    			attr_dev(a2, "href", "https://mobirise.co");
    			attr_dev(a2, "data-toggle", "dropdown-submenu");
    			attr_dev(a2, "aria-expanded", "true");
    			add_location(a2, file$3, 53, 10, 1569);
    			attr_dev(a3, "class", "dropdown-item text-success display-4");
    			attr_dev(a3, "href", "https://mobirise.co");
    			add_location(a3, file$3, 61, 12, 1855);
    			attr_dev(div3, "class", "dropdown-menu");
    			add_location(div3, file$3, 60, 10, 1814);
    			attr_dev(li1, "class", "nav-item dropdown");
    			add_location(li1, file$3, 52, 8, 1527);
    			attr_dev(ul, "class", "navbar-nav nav-dropdown");
    			attr_dev(ul, "data-app-modern-menu", "true");
    			add_location(ul, file$3, 44, 6, 1256);
    			attr_dev(span6, "class", "btn-icon mbri-mobile mbr-iconfont mbr-iconfont-btn");
    			add_location(span6, file$3, 71, 10, 2186);
    			attr_dev(a4, "class", "btn btn-sm btn-success display-4");
    			attr_dev(a4, "href", "ติดต่อสอบถาม");
    			add_location(a4, file$3, 70, 8, 2110);
    			attr_dev(div4, "class", "navbar-buttons mbr-section-btn");
    			add_location(div4, file$3, 69, 6, 2056);
    			attr_dev(div5, "class", "collapse navbar-collapse");
    			attr_dev(div5, "id", "navbarSupportedContent");
    			add_location(div5, file$3, 43, 4, 1182);
    			attr_dev(nav, "class", "navbar navbar-expand beta-menu navbar-dropdown align-items-center\r\n    navbar-fixed-top navbar-toggleable-sm");
    			add_location(nav, file$3, 7, 2, 126);
    			attr_dev(section, "class", "menu cid-rHgb1EBBy7");
    			attr_dev(section, "once", "menu");
    			attr_dev(section, "id", "menu2-6");
    			add_location(section, file$3, 5, 0, 58);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, nav);
    			append_dev(nav, button);
    			append_dev(button, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t0);
    			append_dev(div0, span1);
    			append_dev(div0, t1);
    			append_dev(div0, span2);
    			append_dev(div0, t2);
    			append_dev(div0, span3);
    			append_dev(nav, t3);
    			append_dev(nav, div2);
    			append_dev(div2, div1);
    			append_dev(div1, span4);
    			append_dev(span4, img);
    			append_dev(div1, t4);
    			append_dev(div1, span5);
    			append_dev(span5, a0);
    			append_dev(nav, t6);
    			append_dev(nav, div5);
    			append_dev(div5, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t8);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(li1, t10);
    			append_dev(li1, div3);
    			append_dev(div3, a3);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, a4);
    			append_dev(a4, span6);
    			append_dev(a4, t13);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Navbar", options, id: create_fragment$3.name });
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var picker = createCommonjsModule(function (module, exports) {
    /*!
     * Picker.js v1.2.1
     * https://fengyuanchen.github.io/pickerjs
     *
     * Copyright 2016-present Chen Fengyuan
     * Released under the MIT license
     *
     * Date: 2019-02-18T13:08:12.801Z
     */

    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, function () {
      function _typeof(obj) {
        if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
          _typeof = function (obj) {
            return typeof obj;
          };
        } else {
          _typeof = function (obj) {
            return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          };
        }

        return _typeof(obj);
      }

      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }

      function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
      }

      function _toConsumableArray(arr) {
        return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
      }

      function _arrayWithoutHoles(arr) {
        if (Array.isArray(arr)) {
          for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

          return arr2;
        }
      }

      function _iterableToArray(iter) {
        if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
      }

      function _nonIterableSpread() {
        throw new TypeError("Invalid attempt to spread non-iterable instance");
      }

      var DEFAULTS = {
        // Define the container for putting the picker.
        container: null,
        // Indicate whether show the prev and next arrow controls on each column.
        controls: false,
        // The initial date. If not present, use the current date.
        date: null,
        // The date string format, also as the sorting order for columns.
        format: 'YYYY-MM-DD HH:mm',
        // Indicate whether show the column headers.
        headers: false,
        // Define the increment for each date / time part.
        increment: 1,
        // Enable inline mode.
        inline: false,
        // Define the language. (An ISO language code).
        language: '',
        // Months' name.
        months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฏาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พศจิกายน', 'ธันวาคม'],
        // Shorter months' name.
        monthsShort: ['ม.ค', 'ก.พ', 'ม.ค', 'เม.ย', 'พ.ค', 'มิ.ย', 'ก.ค', 'ส.ค', 'ก.ย', 'ต.ค', 'พ.ย', 'ธ.ค'],
        // Define the number of rows for showing.
        rows: 5,
        // Define the text of the picker.
        text: {
          title: 'Pick a date and time',
          cancel: 'Cancel',
          confirm: 'OK',
          year: 'Year',
          month: 'Month',
          day: 'Day',
          hour: 'Hour',
          minute: 'Minute',
          second: 'Second',
          millisecond: 'Millisecond'
        },
        // Translate date / time text.
        translate: function translate(type, text) {
          return text;
        },
        // Shortcuts of custom events.
        show: null,
        shown: null,
        hide: null,
        hidden: null,
        pick: null
      };

      var TEMPLATE = '<div class="picker" data-picker-action="hide" touch-action="none" tabindex="-1" role="dialog">' + '<div class="picker-dialog" role="document">' + '<div class="picker-header">' + '<h4 class="picker-title">{{ title }}</h4>' + '<button type="button" class="picker-close" data-picker-action="hide" aria-label="Close">&times;</button>' + '</div>' + '<div class="picker-body">' + '<div class="picker-grid"></div>' + '</div>' + '<div class="picker-footer">' + '<button type="button" class="picker-cancel" data-picker-action="hide">{{ cancel }}</button>' + '<button type="button" class="picker-confirm" data-picker-action="pick">{{ confirm }}</button>' + '</div>' + '</div>' + '</div>';

      var IS_BROWSER = typeof window !== 'undefined';
      var WINDOW = IS_BROWSER ? window : {};
      var IS_TOUCH_DEVICE = IS_BROWSER ? 'ontouchstart' in WINDOW.document.documentElement : false;
      var HAS_POINTER_EVENT = IS_BROWSER ? 'PointerEvent' in WINDOW : false;
      var NAMESPACE = 'picker';
      var LANGUAGES = {}; // Actions

      var ACTION_HIDE = 'hide';
      var ACTION_NEXT = 'next';
      var ACTION_PICK = 'pick';
      var ACTION_PREV = 'prev'; // Classes

      var CLASS_OPEN = "".concat(NAMESPACE, "-open");
      var CLASS_OPENED = "".concat(NAMESPACE, "-opened");
      var CLASS_PICKED = "".concat(NAMESPACE, "-picked"); // Data keys
      // Add namespace to avoid to conflict to some other libraries.

      var DATA_ACTION = "".concat(NAMESPACE, "Action");
      var DATA_TOKEN = 'token';
      var DATA_TYPE = 'type';
      var DATA_NAME = 'name';
      var DATA_VALUE = 'value'; // Events

      var EVENT_CLICK = 'click';
      var EVENT_FOCUS = 'focus';
      var EVENT_HIDDEN = 'hidden';
      var EVENT_HIDE = 'hide';
      var EVENT_KEY_DOWN = 'keydown';
      var EVENT_PICK = 'pick';
      var EVENT_TOUCH_START = IS_TOUCH_DEVICE ? 'touchstart' : 'mousedown';
      var EVENT_TOUCH_MOVE = IS_TOUCH_DEVICE ? 'touchmove' : 'mousemove';
      var EVENT_TOUCH_END = IS_TOUCH_DEVICE ? 'touchend touchcancel' : 'mouseup';
      var EVENT_POINTER_DOWN = HAS_POINTER_EVENT ? 'pointerdown' : EVENT_TOUCH_START;
      var EVENT_POINTER_MOVE = HAS_POINTER_EVENT ? 'pointermove' : EVENT_TOUCH_MOVE;
      var EVENT_POINTER_UP = HAS_POINTER_EVENT ? 'pointerup pointercancel' : EVENT_TOUCH_END;
      var EVENT_SHOW = 'show';
      var EVENT_SHOWN = 'shown';
      var EVENT_WHEEL = 'wheel mousewheel DOMMouseScroll';

      var _Object$prototype = Object.prototype,
          hasOwnProperty = _Object$prototype.hasOwnProperty,
          toString = _Object$prototype.toString;
      /**
       * Detect the type of the given value.
       * @param {*} value - The value to detect.
       * @returns {string} Returns the type.
       */

      function typeOf(value) {
        return toString.call(value).slice(8, -1).toLowerCase();
      }
      /**
       * Check if the given value is a string.
       * @param {*} value - The value to check.
       * @returns {boolean} Returns `true` if the given value is a string, else `false`.
       */

      function isString(value) {
        return typeof value === 'string';
      }
      /**
       * Check if the given value is finite.
       */

      var isFinite = Number.isFinite || WINDOW.isFinite;
      /**
       * Check if the given value is not a number.
       */

      var isNaN = Number.isNaN || WINDOW.isNaN;
      /**
       * Check if the given value is a number.
       * @param {*} value - The value to check.
       * @returns {boolean} Returns `true` if the given value is a number, else `false`.
       */

      function isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
      }
      /**
       * Check if the given value is an object.
       * @param {*} value - The value to check.
       * @returns {boolean} Returns `true` if the given value is an object, else `false`.
       */

      function isObject(value) {
        return _typeof(value) === 'object' && value !== null;
      }
      /**
       * Check if the given value is a plain object.
       * @param {*} value - The value to check.
       * @returns {boolean} Returns `true` if the given value is a plain object, else `false`.
       */

      function isPlainObject(value) {
        if (!isObject(value)) {
          return false;
        }

        try {
          var _constructor = value.constructor;
          var prototype = _constructor.prototype;
          return _constructor && prototype && hasOwnProperty.call(prototype, 'isPrototypeOf');
        } catch (error) {
          return false;
        }
      }
      /**
       * Check if the given value is a function.
       * @param {*} value - The value to check.
       * @returns {boolean} Returns `true` if the given value is a function, else `false`.
       */

      function isFunction(value) {
        return typeof value === 'function';
      }
      /**
       * Check if the given value is a date.
       * @param {*} value - The value to check.
       * @returns {boolean} Returns `true` if the given value is a date, else `false`.
       */

      function isDate(value) {
        return typeOf(value) === 'date';
      }
      /**
       * Check if the given value is a valid date.
       * @param {*} value - The value to check.
       * @returns {boolean} Returns `true` if the given value is a valid date, else `false`.
       */

      function isValidDate(value) {
        return isDate(value) && value.toString() !== 'Invalid Date';
      }
      /**
       * Iterate the given data.
       * @param {*} data - The data to iterate.
       * @param {Function} callback - The process function for each element.
       * @returns {*} The original data.
       */

      function forEach(data, callback) {
        if (data && isFunction(callback)) {
          if (Array.isArray(data) || isNumber(data.length)
          /* array-like */
          ) {
              var length = data.length;
              var i;

              for (i = 0; i < length; i += 1) {
                if (callback.call(data, data[i], i, data) === false) {
                  break;
                }
              }
            } else if (isObject(data)) {
            Object.keys(data).forEach(function (key) {
              callback.call(data, data[key], key, data);
            });
          }
        }

        return data;
      }
      /**
       * Recursively assigns own enumerable properties of source objects to the target object.
       * @param {Object} target - The target object.
       * @param {Object[]} sources - The source objects.
       * @returns {Object} The target object.
       */

      function deepAssign(target) {
        for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          sources[_key - 1] = arguments[_key];
        }

        if (isObject(target) && sources.length > 0) {
          sources.forEach(function (source) {
            if (isObject(source)) {
              Object.keys(source).forEach(function (key) {
                if (isPlainObject(target[key]) && isPlainObject(source[key])) {
                  target[key] = deepAssign({}, target[key], source[key]);
                } else {
                  target[key] = source[key];
                }
              });
            }
          });
        }

        return target;
      }
      /**
       * Add classes to the given element.
       * @param {Element} element - The target element.
       * @param {string} value - The classes to be added.
       */

      function addClass(element, value) {
        if (!value) {
          return;
        }

        if (isNumber(element.length)) {
          forEach(element, function (elem) {
            addClass(elem, value);
          });
          return;
        }

        if (element.classList) {
          element.classList.add(value);
          return;
        }

        var className = element.className.trim();

        if (!className) {
          element.className = value;
        } else if (className.indexOf(value) < 0) {
          element.className = "".concat(className, " ").concat(value);
        }
      }
      /**
       * Remove classes from the given element.
       * @param {Element} element - The target element.
       * @param {string} value - The classes to be removed.
       */

      function removeClass(element, value) {
        if (!value) {
          return;
        }

        if (isNumber(element.length)) {
          forEach(element, function (elem) {
            removeClass(elem, value);
          });
          return;
        }

        if (element.classList) {
          element.classList.remove(value);
          return;
        }

        if (element.className.indexOf(value) >= 0) {
          element.className = element.className.replace(value, '');
        }
      }
      var REGEXP_HYPHENATE = /([a-z\d])([A-Z])/g;
      /**
       * Transform the given string from camelCase to kebab-case
       * @param {string} value - The value to transform.
       * @returns {string} The transformed value.
       */

      function hyphenate(value) {
        return value.replace(REGEXP_HYPHENATE, '$1-$2').toLowerCase();
      }
      /**
       * Get data from the given element.
       * @param {Element} element - The target element.
       * @param {string} name - The data key to get.
       * @returns {string} The data value.
       */

      function getData(element, name) {
        if (isObject(element[name])) {
          return element[name];
        }

        if (element.dataset) {
          return element.dataset[name];
        }

        return element.getAttribute("data-".concat(hyphenate(name)));
      }
      /**
       * Set data to the given element.
       * @param {Element} element - The target element.
       * @param {string} name - The data key to set.
       * @param {string} data - The data value.
       */

      function setData(element, name, data) {
        if (isObject(data)) {
          element[name] = data;
        } else if (element.dataset) {
          element.dataset[name] = data;
        } else {
          element.setAttribute("data-".concat(hyphenate(name)), data);
        }
      }
      /**
       * Remove data from the given element.
       * @param {Element} element - The target element.
       * @param {string} name - The data key to remove.
       */

      function removeData(element, name) {
        if (isObject(element[name])) {
          try {
            delete element[name];
          } catch (error) {
            element[name] = undefined;
          }
        } else if (element.dataset) {
          // #128 Safari not allows to delete dataset property
          try {
            delete element.dataset[name];
          } catch (error) {
            element.dataset[name] = undefined;
          }
        } else {
          element.removeAttribute("data-".concat(hyphenate(name)));
        }
      }
      var REGEXP_SPACES = /\s\s*/;

      var onceSupported = function () {
        var supported = false;

        if (IS_BROWSER) {
          var once = false;

          var listener = function listener() {};

          var options = Object.defineProperty({}, 'once', {
            get: function get() {
              supported = true;
              return once;
            },

            /**
             * This setter can fix a `TypeError` in strict mode
             * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Getter_only}
             * @param {boolean} value - The value to set
             */
            set: function set(value) {
              once = value;
            }
          });
          WINDOW.addEventListener('test', listener, options);
          WINDOW.removeEventListener('test', listener, options);
        }

        return supported;
      }();
      /**
       * Remove event listener from the target element.
       * @param {Element} element - The event target.
       * @param {string} type - The event type(s).
       * @param {Function} listener - The event listener.
       * @param {Object} options - The event options.
       */


      function removeListener(element, type, listener) {
        var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var handler = listener;
        type.trim().split(REGEXP_SPACES).forEach(function (event) {
          if (!onceSupported) {
            var listeners = element.listeners;

            if (listeners && listeners[event] && listeners[event][listener]) {
              handler = listeners[event][listener];
              delete listeners[event][listener];

              if (Object.keys(listeners[event]).length === 0) {
                delete listeners[event];
              }

              if (Object.keys(listeners).length === 0) {
                delete element.listeners;
              }
            }
          }

          element.removeEventListener(event, handler, options);
        });
      }
      /**
       * Add event listener to the target element.
       * @param {Element} element - The event target.
       * @param {string} type - The event type(s).
       * @param {Function} listener - The event listener.
       * @param {Object} options - The event options.
       */

      function addListener(element, type, listener) {
        var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        var _handler = listener;
        type.trim().split(REGEXP_SPACES).forEach(function (event) {
          if (options.once && !onceSupported) {
            var _element$listeners = element.listeners,
                listeners = _element$listeners === void 0 ? {} : _element$listeners;

            _handler = function handler() {
              delete listeners[event][listener];
              element.removeEventListener(event, _handler, options);

              for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
              }

              listener.apply(element, args);
            };

            if (!listeners[event]) {
              listeners[event] = {};
            }

            if (listeners[event][listener]) {
              element.removeEventListener(event, listeners[event][listener], options);
            }

            listeners[event][listener] = _handler;
            element.listeners = listeners;
          }

          element.addEventListener(event, _handler, options);
        });
      }
      /**
       * Dispatch event on the target element.
       * @param {Element} element - The event target.
       * @param {string} type - The event type(s).
       * @param {Object} data - The additional event data.
       * @returns {boolean} Indicate if the event is default prevented or not.
       */

      function dispatchEvent(element, type, data) {
        var event; // Event and CustomEvent on IE9-11 are global objects, not constructors

        if (isFunction(Event) && isFunction(CustomEvent)) {
          event = new CustomEvent(type, {
            detail: data,
            bubbles: true,
            cancelable: true
          });
        } else {
          event = document.createEvent('CustomEvent');
          event.initCustomEvent(type, true, true, data);
        }

        return element.dispatchEvent(event);
      }
      /**
       * Check if the given year is a leap year.
       * @param {number} year - The year to check.
       * @returns {boolean} Returns `true` if the given year is a leap year, else `false`.
       */

      function isLeapYear(year) {
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
      }
      /**
       * Get days number of the given month.
       * @param {number} year - The target year.
       * @param {number} month - The target month.
       * @returns {number} Returns days number.
       */

      function getDaysInMonth(year, month) {
        return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
      }
      /**
       * Add leading zeroes to the given value
       * @param {number} value - The value to add.
       * @param {number} [length=1] - The number of the leading zeroes.
       * @returns {string} Returns converted value.
       */

      function addLeadingZero(value) {
        var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
        var str = String(Math.abs(value));
        var i = str.length;
        var result = '';

        if (value < 0) {
          result += '-';
        }

        while (i < length) {
          i += 1;
          result += '0';
        }

        return result + str;
      }
      /**
       * Map token to type name
       * @param {string} token - The token to map.
       * @returns {string} Returns mapped type name.
       */

      function tokenToType(token) {
        return {
          Y: 'year',
          M: 'month',
          D: 'day',
          H: 'hour',
          m: 'minute',
          s: 'second',
          S: 'millisecond'
        }[token.charAt(0)];
      }
      var REGEXP_TOKENS = /(Y|M|D|H|m|s|S)\1*/g;
      /**
       * Parse date format.
       * @param {string} format - The format to parse.
       * @returns {Object} Returns parsed format data.
       */

      function parseFormat(format) {
        var tokens = format.match(REGEXP_TOKENS);

        if (!tokens) {
          throw new Error('Invalid format.');
        } // Remove duplicate tokens (#22)


        tokens = tokens.filter(function (token, index) {
          return tokens.indexOf(token) === index;
        });
        var result = {
          tokens: tokens
        };
        tokens.forEach(function (token) {
          result[tokenToType(token)] = token;
        });
        return result;
      }

      var events = {
        bind: function bind() {
          var element = this.element,
              options = this.options,
              grid = this.grid;

          if (isFunction(options.show)) {
            addListener(element, EVENT_SHOW, options.show);
          }

          if (isFunction(options.shown)) {
            addListener(element, EVENT_SHOWN, options.shown);
          }

          if (isFunction(options.hide)) {
            addListener(element, EVENT_HIDE, options.hide);
          }

          if (isFunction(options.hidden)) {
            addListener(element, EVENT_HIDDEN, options.hidden);
          }

          if (isFunction(options.pick)) {
            addListener(element, EVENT_PICK, options.pick);
          }

          addListener(element, EVENT_FOCUS, this.onFocus = this.focus.bind(this));
          addListener(element, EVENT_CLICK, this.onFocus);
          addListener(this.picker, EVENT_CLICK, this.onClick = this.click.bind(this));
          addListener(grid, EVENT_WHEEL, this.onWheel = this.wheel.bind(this));
          addListener(grid, EVENT_POINTER_DOWN, this.onPointerDown = this.pointerdown.bind(this));
          addListener(document, EVENT_POINTER_MOVE, this.onPointerMove = this.pointermove.bind(this));
          addListener(document, EVENT_POINTER_UP, this.onPointerUp = this.pointerup.bind(this));
          addListener(document, EVENT_KEY_DOWN, this.onKeyDown = this.keydown.bind(this));
        },
        unbind: function unbind() {
          var element = this.element,
              options = this.options,
              grid = this.grid;

          if (isFunction(options.show)) {
            removeListener(element, EVENT_SHOW, options.show);
          }

          if (isFunction(options.shown)) {
            removeListener(element, EVENT_SHOWN, options.shown);
          }

          if (isFunction(options.hide)) {
            removeListener(element, EVENT_HIDE, options.hide);
          }

          if (isFunction(options.hidden)) {
            removeListener(element, EVENT_HIDDEN, options.hidden);
          }

          if (isFunction(options.pick)) {
            removeListener(element, EVENT_PICK, options.pick);
          }

          removeListener(element, EVENT_FOCUS, this.onFocus);
          removeListener(element, EVENT_CLICK, this.onFocus);
          removeListener(this.picker, EVENT_CLICK, this.onClick);
          removeListener(grid, EVENT_WHEEL, this.onWheel);
          removeListener(grid, EVENT_POINTER_DOWN, this.onPointerDown);
          removeListener(document, EVENT_POINTER_MOVE, this.onPointerMove);
          removeListener(document, EVENT_POINTER_UP, this.onPointerUp);
          removeListener(document, EVENT_KEY_DOWN, this.onKeyDown);
        }
      };

      var handlers = {
        focus: function focus(event) {
          event.target.blur();
          this.show();
        },
        click: function click(event) {
          var target = event.target;
          var action = getData(target, DATA_ACTION);

          switch (action) {
            case ACTION_HIDE:
              this.hide();
              break;

            case ACTION_PICK:
              this.pick();
              break;

            case ACTION_PREV:
            case ACTION_NEXT:
              this[action](getData(target.parentElement, DATA_TYPE));
              break;
          }
        },
        wheel: function wheel(event) {
          var target = event.target;

          if (target === this.grid) {
            return;
          }

          event.preventDefault();

          while (target.parentElement && target.parentElement !== this.grid) {
            target = target.parentElement;
          }

          var type = getData(target, DATA_TYPE);

          if (event.deltaY < 0) {
            this.prev(type);
          } else {
            this.next(type);
          }
        },
        pointerdown: function pointerdown(event) {
          var target = event.target;

          if (target === this.grid || getData(target, DATA_ACTION)) {
            return;
          } // This line is required for preventing page scrolling in iOS browsers


          event.preventDefault();

          while (target.parentElement && target.parentElement !== this.grid) {
            target = target.parentElement;
          }

          var list = target.querySelector(".".concat(NAMESPACE, "-list"));
          var itemHeight = list.firstElementChild.offsetHeight;
          this.cell = {
            elem: target,
            list: list,
            moveY: 0,
            maxMoveY: itemHeight,
            minMoveY: itemHeight / 2,
            startY: event.changedTouches ? event.changedTouches[0].pageY : event.pageY,
            type: getData(target, DATA_TYPE)
          };
        },
        pointermove: function pointermove(event) {
          var cell = this.cell;

          if (!cell) {
            return;
          }

          event.preventDefault();
          var endY = event.changedTouches ? event.changedTouches[0].pageY : event.pageY;
          var moveY = cell.moveY + (endY - cell.startY);
          cell.startY = endY;
          cell.moveY = moveY;

          if (Math.abs(moveY) < cell.maxMoveY) {
            cell.list.style.top = "".concat(moveY, "px");
            return;
          }

          cell.list.style.top = 0;
          cell.moveY = 0;

          if (moveY >= cell.maxMoveY) {
            this.prev(cell.type);
          } else if (moveY <= -cell.maxMoveY) {
            this.next(cell.type);
          }
        },
        pointerup: function pointerup(event) {
          var cell = this.cell;

          if (!cell) {
            return;
          }

          event.preventDefault();
          cell.list.style.top = 0;

          if (cell.moveY >= cell.minMoveY) {
            this.prev(cell.type);
          } else if (cell.moveY <= -cell.minMoveY) {
            this.next(cell.type);
          }

          this.cell = null;
        },
        keydown: function keydown(event) {
          if (this.shown && (event.key === 'Escape' || event.keyCode === 27)) {
            this.hide();
          }
        }
      };

      var helpers = {
        render: function render(type) {
          var _this = this;

          if (!type) {
            this.format.tokens.forEach(function (token) {
              return _this.render(tokenToType(token));
            });
            return;
          }

          var options = this.options;
          var data = this.data[type];
          var current = this.current(type);
          var max = isFunction(data.max) ? data.max() : data.max;
          var min = isFunction(data.min) ? data.min() : data.min;
          var base = 0;

          if (isFinite(max)) {
            base = min > 0 ? max : max + 1;
          }

          data.list.innerHTML = '';
          data.current = current;

          for (var i = 0; i < options.rows + 2; i += 1) {
            var item = document.createElement('li');
            var position = i - data.index;
            var newValue = current + position * data.increment;

            if (base) {
              newValue %= base;

              if (newValue < min) {
                newValue += base;
              }
            }

            item.textContent = options.translate(type, data.aliases ? data.aliases[newValue] : addLeadingZero(newValue + data.offset, data.digit));
            setData(item, DATA_NAME, type);
            setData(item, DATA_VALUE, newValue);
            addClass(item, "".concat(NAMESPACE, "-item"));

            if (position === 0) {
              addClass(item, CLASS_PICKED);
              data.item = item;
            }

            data.list.appendChild(item);
          }
        },
        current: function current(type, value) {
          var date = this.date;
          var format = this.format;
          var token = format[type];

          switch (token.charAt(0)) {
            case 'Y':
              if (isNumber(value)) {
                date.setFullYear(token.length === 2 ? 2000 + value : value);

                if (format.month) {
                  this.render(tokenToType(format.month));
                }

                if (format.day) {
                  this.render(tokenToType(format.day));
                }
              }

              return date.getFullYear();

            case 'M':
              if (isNumber(value)) {
                date.setMonth(value, // The current day should not exceed its maximum day in current month
                Math.min(date.getDate(), getDaysInMonth(date.getFullYear(), value)));

                if (format.day) {
                  this.render(tokenToType(format.day));
                }
              }

              return date.getMonth();

            case 'D':
              if (isNumber(value)) {
                date.setDate(value);
              }

              return date.getDate();

            case 'H':
              if (isNumber(value)) {
                date.setHours(value);
              }

              return date.getHours();

            case 'm':
              if (isNumber(value)) {
                date.setMinutes(value);
              }

              return date.getMinutes();

            case 's':
              if (isNumber(value)) {
                date.setSeconds(value);
              }

              return date.getSeconds();

            case 'S':
              if (isNumber(value)) {
                date.setMilliseconds(value);
              }

              return date.getMilliseconds();
          }
        },
        getValue: function getValue() {
          var element = this.element;
          return this.isInput ? element.value : element.textContent;
        },
        setValue: function setValue(value) {
          var element = this.element;

          if (this.isInput) {
            element.value = value;
          } else if (this.options.container) {
            element.textContent = value;
          }
        },
        open: function open() {
          var body = this.body;
          body.style.overflow = 'hidden';
          body.style.paddingRight = "".concat(this.scrollBarWidth + (parseFloat(this.initialBodyPaddingRight) || 0), "px");
        },
        close: function close() {
          var body = this.body;
          body.style.overflow = '';
          body.style.paddingRight = this.initialBodyPaddingRight;
        }
      };

      var methods = {
        /**
         * Show the picker.
         * @param {boolean} [immediate=false] - Indicate if show the picker immediately or not.
         * @returns {Picker} this
         */
        show: function show() {
          var immediate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
          var element = this.element,
              picker = this.picker;

          if (this.inline || this.shown) {
            return this;
          }

          if (dispatchEvent(element, EVENT_SHOW) === false) {
            return this;
          }

          this.shown = true;
          this.open();
          addClass(picker, CLASS_OPEN);

          var done = function done() {
            dispatchEvent(element, EVENT_SHOWN);
          };

          if (!immediate) {
            // Reflow to enable transition
            // eslint-disable-next-line
            picker.offsetWidth;
          }

          addClass(picker, CLASS_OPENED);

          if (immediate) {
            done();
          } else {
            setTimeout(done, 300);
          }

          return this;
        },

        /**
         * Hide the picker.
         * @param {boolean} [immediate=false] - Indicate if hide the picker immediately or not.
         * @returns {Picker} this
         */
        hide: function hide() {
          var _this = this;

          var immediate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
          var element = this.element,
              picker = this.picker;

          if (this.inline || !this.shown) {
            return this;
          }

          if (dispatchEvent(element, EVENT_HIDE) === false) {
            return this;
          }

          this.shown = false;
          removeClass(picker, CLASS_OPENED);

          var done = function done() {
            _this.close();

            removeClass(picker, CLASS_OPEN);
            dispatchEvent(element, EVENT_HIDDEN);
          };

          if (immediate) {
            done();
          } else {
            setTimeout(done, 300);
          }

          return this;
        },

        /**
         * Pick to the previous item.
         * @param {string} type - The column type.
         * @returns {Picker} this
         */
        prev: function prev(type) {
          var options = this.options;
          var token = this.format[type];
          var data = this.data[type];
          var list = data.list;
          var item = list.lastElementChild;
          var max = isFunction(data.max) ? data.max() : data.max;
          var min = isFunction(data.min) ? data.min() : data.min;
          var prev = data.item.previousElementSibling;
          var value = Number(getData(list.firstElementChild, DATA_VALUE)) - data.increment;

          if (value < min) {
            value += max - min + 1;
          }

          item.textContent = options.translate(type, data.aliases ? data.aliases[value] : addLeadingZero(value + data.offset, token.length));
          setData(item, DATA_VALUE, value);

          if (prev) {
            removeClass(data.item, CLASS_PICKED);
            addClass(prev, CLASS_PICKED);
            data.item = prev;
          }

          list.insertBefore(item, list.firstElementChild);
          data.current = Number(getData(data.item, DATA_VALUE));
          this.current(type, data.current);

          if (this.inline && options.container) {
            this.pick();
          }

          return this;
        },

        /**
         * Pick to the next item.
         * @param {String} type - The column type.
         * @returns {Picker} this
         */
        next: function next(type) {
          var options = this.options;
          var token = this.format[type];
          var data = this.data[type];
          var list = data.list;
          var item = list.firstElementChild;
          var max = isFunction(data.max) ? data.max() : data.max;
          var min = isFunction(data.min) ? data.min() : data.min;
          var next = data.item.nextElementSibling;
          var value = Number(getData(list.lastElementChild, DATA_VALUE)) + data.increment;

          if (value > max) {
            value -= max - min + 1;
          }

          item.textContent = options.translate(type, data.aliases ? data.aliases[value] : addLeadingZero(value + data.offset, token.length));
          setData(item, DATA_VALUE, value);
          list.appendChild(item);

          if (next) {
            removeClass(data.item, CLASS_PICKED);
            addClass(next, CLASS_PICKED);
            data.item = next;
          }

          data.current = Number(getData(data.item, DATA_VALUE));
          this.current(type, data.current);

          if (this.inline && options.container) {
            this.pick();
          }

          return this;
        },
        // Pick the current date to the target element.
        pick: function pick() {
          var element = this.element;

          if (dispatchEvent(element, EVENT_PICK) === false) {
            return this;
          }

          var value = this.formatDate(this.date);
          this.setValue(value);

          if (this.isInput && dispatchEvent(element, 'change') === false) {
            this.reset();
          }

          this.hide();
          return this;
        },

        /**
         * Get the current date.
         * @param {boolean} [formatted=false] - Indicate if format the date or not.
         * @return {Date|string} The output date.
         */
        getDate: function getDate() {
          var formatted = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
          var date = this.date;
          return formatted ? this.formatDate(date) : new Date(date);
        },

        /**
         * Override the current date with a new date.
         * @param {Date|string} date - The date to set.
         * @returns {Picker} this
         */
        setDate: function setDate(date) {
          if (date) {
            this.date = this.parseDate(date);
            this.render();
          }

          return this;
        },
        // Update the picker with the current element value / text.
        update: function update() {
          this.date = this.parseDate(this.getValue());
          this.render();
          return this;
        },
        // Reset the picker and element value / text.
        reset: function reset() {
          this.setValue(this.initialValue);
          this.date = new Date(this.initialDate);
          this.render();
          return this;
        },

        /**
         * Parse a date with the set date format.
         * @param {Date|string} date - The date to parse.
         * @returns {Date} The parsed date object.
         */
        parseDate: function parseDate(date) {
          var options = this.options,
              format = this.format;
          var digits = [];

          if (isDate(date)) {
            return new Date(date);
          }

          if (isString(date)) {
            var groups = [].concat(_toConsumableArray(options.months), _toConsumableArray(options.monthsShort), ['\\d+']);
            digits = date.match(new RegExp("(".concat(groups.join('|'), ")"), 'g')); // Parse `11111111` (YYYYMMDD) to ['1111', '11', '11']

            if (digits && date.length === options.format.length && digits.length !== format.tokens.length) {
              digits = format.tokens.map(function (token) {
                return date.substr(options.format.indexOf(token), token.length);
              });
            }

            if (!digits || digits.length !== format.tokens.length) {
              return new Date();
            }
          }

          var parsedDate = new Date();
          digits.forEach(function (digit, i) {
            var token = format.tokens[i];
            var n = Number(digit);

            switch (token) {
              case 'YYYY':
              case 'YYY':
              case 'Y':
                {
                  var index = date.indexOf(digit);
                  var isHyphen = date.substr(index - 1, 1) === '-';
                  var isBC = index > 1 && isHyphen && /\S/.test(date.substr(index - 2, 1)) || index === 1 && isHyphen;
                  parsedDate.setFullYear(isBC ? -n : n);
                  break;
                }

              case 'YY':
                parsedDate.setFullYear(2000 + n);
                break;

              case 'MMMM':
                parsedDate.setMonth(options.months.indexOf(digit));
                break;

              case 'MMM':
                parsedDate.setMonth(options.monthsShort.indexOf(digit));
                break;

              case 'MM':
              case 'M':
                parsedDate.setMonth(n - 1);
                break;

              case 'DD':
              case 'D':
                parsedDate.setDate(n);
                break;

              case 'HH':
              case 'H':
                parsedDate.setHours(n);
                break;

              case 'mm':
              case 'm':
                parsedDate.setMinutes(n);
                break;

              case 'ss':
              case 's':
                parsedDate.setSeconds(n);
                break;

              case 'SSS':
              case 'SS':
              case 'S':
                parsedDate.setMilliseconds(n);
                break;
            }
          });
          return parsedDate;
        },

        /**
         * Format a date object to a string with the set date format.
         * @param {Date} date - The date to format.
         * @return {string} THe formatted date.
         */
        formatDate: function formatDate(date) {
          var options = this.options,
              format = this.format;
          var formatted = '';

          if (isValidDate(date)) {
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var milliseconds = date.getMilliseconds();
            formatted = options.format;
            format.tokens.forEach(function (token) {
              var replacement = '';

              switch (token) {
                case 'YYYY':
                case 'YYY':
                case 'Y':
                  replacement = addLeadingZero(year, token.length);
                  break;

                case 'YY':
                  replacement = addLeadingZero(year % 100, 2);
                  break;

                case 'MMMM':
                  replacement = options.months[month];
                  break;

                case 'MMM':
                  replacement = options.monthsShort[month];
                  break;

                case 'MM':
                case 'M':
                  replacement = addLeadingZero(month + 1, token.length);
                  break;

                case 'DD':
                case 'D':
                  replacement = addLeadingZero(day, token.length);
                  break;

                case 'HH':
                case 'H':
                  replacement = addLeadingZero(hours, token.length);
                  break;

                case 'mm':
                case 'm':
                  replacement = addLeadingZero(minutes, token.length);
                  break;

                case 'ss':
                case 's':
                  replacement = addLeadingZero(seconds, token.length);
                  break;

                case 'SSS':
                case 'SS':
                case 'S':
                  replacement = addLeadingZero(milliseconds, token.length);
                  break;
              }

              formatted = formatted.replace(token, replacement);
            });
          }

          return formatted;
        },
        // Destroy the picker and remove the instance from the target element.
        destroy: function destroy() {
          var element = this.element,
              picker = this.picker;

          if (!getData(element, NAMESPACE)) {
            return this;
          }

          this.hide(true);
          this.unbind();
          removeData(element, NAMESPACE);
          picker.parentNode.removeChild(picker);
          return this;
        }
      };

      var REGEXP_DELIMITER = /\{\{\s*(\w+)\s*\}\}/g;
      var REGEXP_INPUTS = /input|textarea/i;
      var AnotherPicker = WINDOW.Picker;

      var Picker =
      /*#__PURE__*/
      function () {
        /**
         * Create a new Picker.
         * @param {Element} element - The target element for picking.
         * @param {Object} [options={}] - The configuration options.
         */
        function Picker(element) {
          var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

          _classCallCheck(this, Picker);

          if (!element || element.nodeType !== 1) {
            throw new Error('The first argument is required and must be an element.');
          }

          this.element = element;
          this.options = deepAssign({}, DEFAULTS, LANGUAGES[options.language], isPlainObject(options) && options);
          this.shown = false;
          this.init();
        }

        _createClass(Picker, [{
          key: "init",
          value: function init() {
            var _this = this;

            var element = this.element;

            if (getData(element, NAMESPACE)) {
              return;
            }

            setData(element, NAMESPACE, this);
            var options = this.options;
            var isInput = REGEXP_INPUTS.test(element.tagName);
            var inline = options.inline && (options.container || !isInput);
            var template = document.createElement('div');
            template.insertAdjacentHTML('afterbegin', TEMPLATE.replace(REGEXP_DELIMITER, function () {
              for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
              }

              return options.text[args[1]];
            }));
            var picker = template.getElementsByClassName(NAMESPACE)[0];
            var grid = picker.getElementsByClassName("".concat(NAMESPACE, "-grid"))[0];
            var container = options.container;

            if (isString(container)) {
              container = document.querySelector(container);
            }

            if (inline) {
              addClass(picker, CLASS_OPEN);
              addClass(picker, CLASS_OPENED);

              if (!container) {
                container = element;
              }
            } else {
              var ownerDocument = element.ownerDocument;
              var body = ownerDocument.body || ownerDocument.documentElement;
              this.body = body;
              this.scrollBarWidth = WINDOW.innerWidth - ownerDocument.documentElement.clientWidth;
              this.initialBodyPaddingRight = WINDOW.getComputedStyle(body).paddingRight;
              addClass(picker, "".concat(NAMESPACE, "-fixed"));

              if (!container) {
                container = document.body;
              }
            }

            this.isInput = isInput;
            this.inline = inline;
            this.container = container;
            this.picker = picker;
            this.grid = grid;
            this.cell = null;
            this.format = parseFormat(options.format);
            var initialValue = this.getValue();
            var date = this.parseDate(options.date || initialValue);
            this.date = date;
            this.initialDate = new Date(date);
            this.initialValue = initialValue;
            this.data = {};
            var rows = Number(options.rows);

            if (!(rows % 2)) {
              rows += 1;
            }

            options.rows = rows || 5;
            addClass(grid, "".concat(NAMESPACE, "-").concat(options.rows > 1 ? 'multiple' : 'single'));

            if (options.controls) {
              addClass(grid, "".concat(NAMESPACE, "-controls"));
            }

            var headers = options.headers,
                increment = options.increment;

            if (headers) {
              addClass(grid, "".concat(NAMESPACE, "-headers")); // TODO: Drop the `headers` option's object support in v2.

              headers = isPlainObject(headers) ? headers : options.text;
            }

            if (!isPlainObject(increment)) {
              increment = {
                year: increment,
                month: increment,
                day: increment,
                hour: increment,
                minute: increment,
                second: increment,
                millisecond: increment
              };
            }

            this.format.tokens.forEach(function (token) {
              var type = tokenToType(token);
              var cell = document.createElement('div');
              var cellBody = document.createElement('div');
              var list = document.createElement('ul');
              var data = {
                digit: token.length,
                increment: Math.abs(Number(increment[type])) || 1,
                list: list,
                max: Infinity,
                min: -Infinity,
                index: Math.floor((options.rows + 2) / 2),
                offset: 0
              };

              switch (token.charAt(0)) {
                case 'Y':
                  if (data.digit === 2) {
                    data.max = 99;
                    data.min = 0;
                  }

                  break;

                case 'M':
                  data.max = 11;
                  data.min = 0;
                  data.offset = 1;

                  if (data.digit === 3) {
                    data.aliases = options.monthsShort;
                  } else if (data.digit === 4) {
                    data.aliases = options.months;
                  }

                  break;

                case 'D':
                  // XXX: Use the latest date to calculate the max day (#23)
                  data.max = function () {
                    return getDaysInMonth(_this.date.getFullYear(), _this.date.getMonth());
                  };

                  data.min = 1;
                  break;

                case 'H':
                  data.max = 23;
                  data.min = 0;
                  break;

                case 'm':
                  data.max = 59;
                  data.min = 0;
                  break;

                case 's':
                  data.max = 59;
                  data.min = 0;
                  break;

                case 'S':
                  data.max = 999;
                  data.min = 0;
                  break;
              }

              setData(cell, DATA_TYPE, type);
              setData(cell, DATA_TOKEN, token);

              if (headers) {
                var cellHeader = document.createElement('div');
                addClass(cellHeader, "".concat(NAMESPACE, "-cell__header"));
                cellHeader.textContent = headers[type] || type[0].toUpperCase() + type.substr(1);
                cell.appendChild(cellHeader);
              }

              if (options.controls) {
                var prev = document.createElement('div');
                addClass(prev, "".concat(NAMESPACE, "-cell__control"));
                addClass(prev, "".concat(NAMESPACE, "-cell__control--prev"));
                setData(prev, DATA_ACTION, ACTION_PREV);
                cell.appendChild(prev);
              }

              addClass(list, "".concat(NAMESPACE, "-list"));
              addClass(cellBody, "".concat(NAMESPACE, "-cell__body"));
              addClass(cell, "".concat(NAMESPACE, "-cell"));
              addClass(cell, "".concat(NAMESPACE, "-").concat(type, "s"));
              cellBody.appendChild(list);
              cell.appendChild(cellBody);

              if (options.controls) {
                var next = document.createElement('div');
                addClass(next, "".concat(NAMESPACE, "-cell__control"));
                addClass(next, "".concat(NAMESPACE, "-cell__control--next"));
                setData(next, DATA_ACTION, ACTION_NEXT);
                cell.appendChild(next);
              }

              grid.appendChild(cell);
              _this.data[type] = data;

              _this.render(type);
            });

            if (inline) {
              container.innerHTML = '';
            }

            container.appendChild(picker);
            this.bind();
          }
          /**
           * Get the no conflict picker class.
           * @returns {Picker} The picker class.
           */

        }], [{
          key: "noConflict",
          value: function noConflict() {
            WINDOW.Picker = AnotherPicker;
            return Picker;
          }
          /**
           * Change the default options.
           * @param {Object} options - The new default options.
           */

        }, {
          key: "setDefaults",
          value: function setDefaults(options) {
            deepAssign(DEFAULTS, LANGUAGES[options.language], isPlainObject(options) && options);
          }
        }]);

        return Picker;
      }();

      deepAssign(Picker.prototype, events, handlers, helpers, methods);
      Picker.languages = LANGUAGES;

      return Picker;

    }));
    });

    /* src\components\Search.svelte generated by Svelte v3.12.1 */

    const file$4 = "src\\components\\Search.svelte";

    // (157:8) {#if statusAdm === true}
    function create_if_block$1(ctx) {
    	var div, label, t_1, input, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			label.textContent = "ค้นหาจากชื่อ-สกุล:";
    			t_1 = space();
    			input = element("input");
    			attr_dev(label, "class", "searchInfo mbr-fonts-style display-7");
    			add_location(label, file$4, 158, 12, 3792);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "name");
    			attr_dev(input, "class", "form-control input-sm svelte-1u0sblm");
    			input.value = "";
    			attr_dev(input, "placeholder", "ใส่ ชื่อ/สกุล เพื่อค้นหา");
    			add_location(input, file$4, 161, 12, 3914);
    			attr_dev(div, "id", "dataTables_filter");
    			attr_dev(div, "class", "dataTables_filter");
    			add_location(div, file$4, 157, 10, 3724);
    			dispose = listen_dev(input, "input", ctx.input_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t_1);
    			append_dev(div, input);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(157:8) {#if statusAdm === true}", ctx });
    	return block;
    }

    function create_fragment$4(ctx) {
    	var div5, h2, t1, hr0, t2, div4, div3, div0, t3, div2, t4, div1, label, t6, input, t7, hr1, dispose;

    	var if_block = (ctx.statusAdm === true) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h2 = element("h2");
    			h2.textContent = "ค้นหารหัสพนักงาน";
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t4 = space();
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "ค้นหาจากวันเกิด:";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			hr1 = element("hr");
    			attr_dev(h2, "class", "mbr-section-title mbr-fonts-style align-center pb-3 display-2");
    			add_location(h2, file$4, 148, 2, 3444);
    			add_location(hr0, file$4, 151, 2, 3553);
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file$4, 154, 6, 3624);
    			attr_dev(label, "class", "searchInfo mbr-fonts-style display-7");
    			add_location(label, file$4, 171, 10, 4266);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "js-date-picker");
    			attr_dev(input, "class", "form-control input-sm js-date-picker svelte-1u0sblm");
    			input.value = "กรกฏาคม/18/2538";
    			add_location(input, file$4, 174, 10, 4380);
    			attr_dev(div1, "id", "dataTables_filter");
    			attr_dev(div1, "class", "dataTables_filter");
    			add_location(div1, file$4, 170, 8, 4200);
    			attr_dev(div2, "class", "col-md-6");
    			add_location(div2, file$4, 155, 6, 3656);
    			attr_dev(div3, "class", "row search");
    			add_location(div3, file$4, 153, 4, 3592);
    			add_location(hr1, file$4, 183, 4, 4650);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$4, 152, 2, 3563);
    			attr_dev(div5, "id", "register");
    			attr_dev(div5, "class", "table-wrapper");
    			add_location(div5, file$4, 147, 0, 3399);
    			dispose = listen_dev(input, "change", ctx.change_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h2);
    			append_dev(div5, t1);
    			append_dev(div5, hr0);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, label);
    			append_dev(div1, t6);
    			append_dev(div1, input);
    			append_dev(div4, t7);
    			append_dev(div4, hr1);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.statusAdm === true) {
    				if (!if_block) {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div2, t4);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div5);
    			}

    			if (if_block) if_block.d();
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      let statusAdm = false;
      let delayInput;
      const months = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฏาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พศจิกายน",
        "ธันวาคม"
      ];
      const monthsShort = [
        "ม.ค",
        "ก.พ",
        "ม.ค",
        "เม.ย",
        "พ.ค",
        "มิ.ย",
        "ก.ค",
        "ส.ค",
        "ก.ย",
        "ต.ค",
        "พ.ย",
        "ธ.ค"
      ];

      onMount(() => {
        var input = document.getElementById("js-date-picker");
        var picker$1 = new picker(input, {
          headers: true,
          format: "MMMM/D/YYYY",
          text: {
            title: "ระบุวันเกิดคุณ",
            cancel: "ยกเลิก",
            confirm: "ยืนยัน",
            month: "เดือน",
            year: "ปี",
            day: "วัน"
          }
        });
        if (window.localStorage.getItem("isdev") === "true") {
          getFirebaseDb("users");
        }

        passAdmin.subscribe(resp => {
          // alert(resp)
          if (resp === "p@ssw0rd") {
            $$invalidate('statusAdm', statusAdm = true);
          } else {
            $$invalidate('statusAdm', statusAdm = false);
          }
        });
      });

      function onInputDateChanged(event) {
        const dateVal = event.target.value;
        let date = dateVal.split("/")[1];
        let month = paseMonth(dateVal.split("/")[0]) + 1;
        const year = dateVal.split("/")[2];
        if (month < 10) {
          month = "0" + month;
        }
        if (date < 10) {
          date = "0" + date;
        }
        getFirebaseDb("birth", `${date}/${month}/${year}`);
      }

      function onInputNameChang(event) {
        if (delayInput) {
          clearInterval(delayInput);
        }
        delayInput = setTimeout(() => {
          const nameVal = event.target.value;
          if (nameVal === "") {
            storeUserHIQ.set([]);
            return;
          }
          getFirebaseDb("name", `${nameVal}`);
        }, 800);
      }

      let userHIQ = [];
      function getFirebaseDb(type, value) {
        userHIQ = [];
        if (type === "birth") {
          fetchFunc(
             `http://localhost:3000/getusers?birth=${value}`,
            "birth"
          );
        } else if (type === "name") {
          fetchFunc(
             `http://localhost:3000/getusers?name=${value}`,
            "name"
          );
        }
      }

      function fetchFunc(url, type) {
        activeProgress.set(true);
        fetch(url)
          .then(async resp => {
            console.log("then");
            activeProgress.set(false);
            userHIQ = await resp.json();
            const dtUser =
              type === "birth" && (userHIQ.data && userHIQ.data.id)
                ? [{ key: userHIQ.keys, data: userHIQ.data }]
                : userHIQ;
            storeUserHIQ.set(dtUser);
          })
          .catch(err => {
            console.log("catch", err);
            storeUserHIQ.set([]);
            activeProgress.set(false);
            userHIQ = [];
          });
      }

      function paseMonth(month) {
        return months.findIndex(dt => dt === month) !== -1
          ? months.findIndex(dt => dt === month)
          : monthsShort.findIndex(dt => dt === month);
      }

    	const input_handler = (event) => onInputNameChang(event);

    	const change_handler = (event) => onInputDateChanged(event);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('statusAdm' in $$props) $$invalidate('statusAdm', statusAdm = $$props.statusAdm);
    		if ('delayInput' in $$props) delayInput = $$props.delayInput;
    		if ('userHIQ' in $$props) userHIQ = $$props.userHIQ;
    	};

    	return {
    		statusAdm,
    		onInputDateChanged,
    		onInputNameChang,
    		input_handler,
    		change_handler
    	};
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$4.name });
    	}
    }

    /* src\components\Table.svelte generated by Svelte v3.12.1 */

    const file$5 = "src\\components\\Table.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.user = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (90:6) {#if userFileter.length > 0 && showRegisForm === false}
    function create_if_block_1$1(ctx) {
    	var p, t1, table, thead, tr0, th0, t3, th1, t5, th2, t7, th3, t9, tbody, t10, tfoot, tr1, th4;

    	let each_value = ctx.userFileter;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "ผลลัพธ์การค้นหา";
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "รหัส";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "ชื่อ";
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = "วันเกิด";
    			t7 = space();
    			th3 = element("th");
    			th3.textContent = "ลงทะเบียน";
    			t9 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			tfoot = element("tfoot");
    			tr1 = element("tr");
    			th4 = element("th");
    			attr_dev(p, "class", "searchInfo mbr-fonts-style display-7 svelte-wap21j");
    			add_location(p, file$5, 90, 8, 1779);
    			attr_dev(th0, "class", "head-item mbr-fonts-style display-5");
    			add_location(th0, file$5, 94, 14, 1976);
    			attr_dev(th1, "class", "head-item mbr-fonts-style display-5");
    			add_location(th1, file$5, 95, 14, 2049);
    			attr_dev(th2, "class", "head-item mbr-fonts-style display-5");
    			add_location(th2, file$5, 96, 14, 2122);
    			attr_dev(th3, "class", "head-item mbr-fonts-style display-5");
    			add_location(th3, file$5, 97, 14, 2198);
    			attr_dev(tr0, "class", "table-heads ");
    			add_location(tr0, file$5, 93, 12, 1935);
    			add_location(thead, file$5, 92, 10, 1914);
    			add_location(tbody, file$5, 100, 10, 2311);
    			add_location(th4, file$5, 123, 14, 3282);
    			attr_dev(tr1, "class", "table-foot ");
    			add_location(tr1, file$5, 122, 12, 3242);
    			add_location(tfoot, file$5, 121, 10, 3221);
    			attr_dev(table, "class", "table isSearch svelte-wap21j");
    			attr_dev(table, "cellspacing", "0");
    			add_location(table, file$5, 91, 8, 1856);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t3);
    			append_dev(tr0, th1);
    			append_dev(tr0, t5);
    			append_dev(tr0, th2);
    			append_dev(tr0, t7);
    			append_dev(tr0, th3);
    			append_dev(table, t9);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(table, t10);
    			append_dev(table, tfoot);
    			append_dev(tfoot, tr1);
    			append_dev(tr1, th4);
    		},

    		p: function update(changed, ctx) {
    			if (changed.userFileter) {
    				each_value = ctx.userFileter;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    				detach_dev(t1);
    				detach_dev(table);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$1.name, type: "if", source: "(90:6) {#if userFileter.length > 0 && showRegisForm === false}", ctx });
    	return block;
    }

    // (102:12) {#each userFileter as user, i}
    function create_each_block(ctx) {
    	var tr, td0, t0_value = ctx.user.data.id + "", t0, t1, td1, t2_value = `${ctx.user.data.title} ${ctx.user.data.fname} ${ctx.user.data.lname}` + "", t2, t3, td2, t4_value = `${ctx.user.data.birth}` + "", t4, t5, td3, span, t6, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			span = element("span");
    			t6 = space();
    			attr_dev(td0, "class", "body-item mbr-fonts-style display-7 svelte-wap21j");
    			add_location(td0, file$5, 104, 16, 2485);
    			attr_dev(td1, "class", "body-item mbr-fonts-style display-7 svelte-wap21j");
    			add_location(td1, file$5, 107, 16, 2608);
    			attr_dev(td2, "class", "body-item mbr-fonts-style display-7 svelte-wap21j");
    			add_location(td2, file$5, 110, 16, 2777);
    			attr_dev(span, "class", "btn-icon mbri-edit mbr-iconfont mbr-iconfont-btn svelte-wap21j");
    			add_location(span, file$5, 114, 18, 2976);
    			attr_dev(td3, "class", "body-item mbr-fonts-style display-7 svelte-wap21j");
    			add_location(td3, file$5, 113, 16, 2908);
    			attr_dev(tr, "style", ctx.i % 2 === 0 ? 'background:#e3e3e3;' : 'background:#cdcdcd;');
    			add_location(tr, file$5, 102, 14, 2378);
    			dispose = listen_dev(span, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, span);
    			append_dev(tr, t6);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.userFileter) && t0_value !== (t0_value = ctx.user.data.id + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.userFileter) && t2_value !== (t2_value = `${ctx.user.data.title} ${ctx.user.data.fname} ${ctx.user.data.lname}` + "")) {
    				set_data_dev(t2, t2_value);
    			}

    			if ((changed.userFileter) && t4_value !== (t4_value = `${ctx.user.data.birth}` + "")) {
    				set_data_dev(t4, t4_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(tr);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(102:12) {#each userFileter as user, i}", ctx });
    	return block;
    }

    // (135:0) {#if showRegisForm && userFileter.length > 0}
    function create_if_block$2(ctx) {
    	var section, div0, img, t0, h2, t1, br, t2, t3, div10, div9, div3, div1, label0, t5, input0, input0_value_value, t6, hr0, t7, div2, label1, t9, input1, input1_value_value, t10, hr1, t11, div6, div4, label2, t13, input2, input2_value_value, t14, hr2, t15, div5, label3, t17, input3, input3_value_value, t18, hr3, t19, div8, div7, a, i, span;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text("โปรดตรวจสอบ\r\n      ");
    			br = element("br");
    			t2 = text("\r\n      ข้อมูลของคุณก่อนบันทึก");
    			t3 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "รหัส :";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			hr0 = element("hr");
    			t7 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "ชื่อ :";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			hr1 = element("hr");
    			t11 = space();
    			div6 = element("div");
    			div4 = element("div");
    			label2 = element("label");
    			label2.textContent = "สกุล :";
    			t13 = space();
    			input2 = element("input");
    			t14 = space();
    			hr2 = element("hr");
    			t15 = space();
    			div5 = element("div");
    			label3 = element("label");
    			label3.textContent = "วันเกิด :";
    			t17 = space();
    			input3 = element("input");
    			t18 = space();
    			hr3 = element("hr");
    			t19 = space();
    			div8 = element("div");
    			div7 = element("div");
    			a = element("a");
    			i = element("i");
    			span = element("span");
    			span.textContent = "  บึนทึกข้อมูล";
    			attr_dev(img, "class", "line-ico svelte-wap21j");
    			attr_dev(img, "src", "./assets/images/line-icon.png");
    			add_location(img, file$5, 137, 6, 3545);
    			attr_dev(div0, "class", "block-line svelte-wap21j");
    			add_location(div0, file$5, 136, 4, 3513);
    			add_location(br, file$5, 143, 6, 3770);
    			set_style(h2, "color", "white", 1);
    			attr_dev(h2, "class", "mbr-section-title mbr-fonts-style align-center pb-3 display-2");
    			add_location(h2, file$5, 139, 4, 3623);
    			attr_dev(label0, "class", "searchInfo mbr-fonts-style display-5");
    			add_location(label0, file$5, 150, 12, 3967);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "id");
    			attr_dev(input0, "class", "form-control input-sm svelte-wap21j");
    			input0.value = input0_value_value = ctx.dataRegister.id;
    			input0.disabled = true;
    			attr_dev(input0, "placeholder", "ใส่ ชื่อ/สกุล เพื่อค้นหา");
    			add_location(input0, file$5, 151, 12, 4047);
    			attr_dev(div1, "class", "dataTables_filter svelte-wap21j");
    			add_location(div1, file$5, 149, 10, 3922);
    			add_location(hr0, file$5, 159, 10, 4305);
    			attr_dev(label1, "class", "searchInfo mbr-fonts-style display-5");
    			add_location(label1, file$5, 161, 12, 4368);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "fname");
    			attr_dev(input1, "class", "form-control input-sm svelte-wap21j");
    			input1.value = input1_value_value = ctx.dataRegister.fname;
    			attr_dev(input1, "placeholder", "ใส่ ชื่อ/สกุล เพื่อค้นหา");
    			add_location(input1, file$5, 162, 12, 4448);
    			attr_dev(div2, "class", "dataTables_filter svelte-wap21j");
    			add_location(div2, file$5, 160, 10, 4323);
    			add_location(hr1, file$5, 169, 10, 4681);
    			attr_dev(div3, "class", "col-md-6");
    			add_location(div3, file$5, 148, 8, 3888);
    			attr_dev(label2, "class", "searchInfo mbr-fonts-style display-5");
    			add_location(label2, file$5, 173, 12, 4792);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "lname");
    			attr_dev(input2, "class", "form-control input-sm js-date-picker svelte-wap21j");
    			input2.value = input2_value_value = ctx.dataRegister.lname;
    			add_location(input2, file$5, 174, 12, 4872);
    			attr_dev(div4, "class", "dataTables_filter svelte-wap21j");
    			add_location(div4, file$5, 172, 10, 4747);
    			add_location(hr2, file$5, 180, 10, 5066);
    			attr_dev(label3, "class", "searchInfo mbr-fonts-style display-5");
    			add_location(label3, file$5, 182, 12, 5129);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "id", "birth");
    			attr_dev(input3, "class", "form-control input-sm svelte-wap21j");
    			input3.value = input3_value_value = ctx.dataRegister.birth;
    			attr_dev(input3, "placeholder", "ใส่ ชื่อ/สกุล เพื่อค้นหา");
    			add_location(input3, file$5, 185, 12, 5242);
    			attr_dev(div5, "class", "dataTables_filter svelte-wap21j");
    			add_location(div5, file$5, 181, 10, 5084);
    			add_location(hr3, file$5, 192, 10, 5475);
    			attr_dev(div6, "class", "col-md-6");
    			add_location(div6, file$5, 171, 8, 4713);
    			attr_dev(span, "class", "btn-icon mbr-iconfont-btn display-7 svelte-wap21j");
    			add_location(span, file$5, 197, 35, 5747);
    			attr_dev(i, "class", "mbri-save");
    			add_location(i, file$5, 197, 14, 5726);
    			set_style(a, "cursor", "pointer");
    			attr_dev(a, "class", "btn btn-xl btn-primary svelte-wap21j");
    			add_location(a, file$5, 196, 12, 5652);
    			set_style(div7, "margin-top", "20px");
    			attr_dev(div7, "class", "navbar-buttons mbr-section-btn");
    			add_location(div7, file$5, 195, 10, 5569);
    			set_style(div8, "text-align", "center");
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$5, 194, 8, 5507);
    			attr_dev(div9, "class", "row search");
    			add_location(div9, file$5, 147, 6, 3854);
    			attr_dev(div10, "class", "container");
    			add_location(div10, file$5, 146, 4, 3823);
    			attr_dev(section, "class", "section-table register-form svelte-wap21j");
    			attr_dev(section, "id", "table1-4");
    			add_location(section, file$5, 135, 2, 3448);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, img);
    			append_dev(section, t0);
    			append_dev(section, h2);
    			append_dev(h2, t1);
    			append_dev(h2, br);
    			append_dev(h2, t2);
    			append_dev(section, t3);
    			append_dev(section, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, input0);
    			append_dev(div3, t6);
    			append_dev(div3, hr0);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t9);
    			append_dev(div2, input1);
    			append_dev(div3, t10);
    			append_dev(div3, hr1);
    			append_dev(div9, t11);
    			append_dev(div9, div6);
    			append_dev(div6, div4);
    			append_dev(div4, label2);
    			append_dev(div4, t13);
    			append_dev(div4, input2);
    			append_dev(div6, t14);
    			append_dev(div6, hr2);
    			append_dev(div6, t15);
    			append_dev(div6, div5);
    			append_dev(div5, label3);
    			append_dev(div5, t17);
    			append_dev(div5, input3);
    			append_dev(div6, t18);
    			append_dev(div6, hr3);
    			append_dev(div9, t19);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, a);
    			append_dev(a, i);
    			append_dev(i, span);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.dataRegister) && input0_value_value !== (input0_value_value = ctx.dataRegister.id)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if ((changed.dataRegister) && input1_value_value !== (input1_value_value = ctx.dataRegister.fname)) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if ((changed.dataRegister) && input2_value_value !== (input2_value_value = ctx.dataRegister.lname)) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if ((changed.dataRegister) && input3_value_value !== (input3_value_value = ctx.dataRegister.birth)) {
    				prop_dev(input3, "value", input3_value_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$2.name, type: "if", source: "(135:0) {#if showRegisForm && userFileter.length > 0}", ctx });
    	return block;
    }

    function create_fragment$5(ctx) {
    	var section, div1, t0, div0, t1, if_block1_anchor, current;

    	var search = new Search({ $$inline: true });

    	var if_block0 = (ctx.userFileter.length > 0 && ctx.showRegisForm === false) && create_if_block_1$1(ctx);

    	var if_block1 = (ctx.showRegisForm && ctx.userFileter.length > 0) && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			search.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div0, "class", "container scroll");
    			add_location(div0, file$5, 88, 4, 1676);
    			attr_dev(div1, "class", "container container-table");
    			add_location(div1, file$5, 86, 2, 1615);
    			attr_dev(section, "class", "section-table cid-rHfxX4jQGN");
    			attr_dev(section, "id", "table1-4");
    			add_location(section, file$5, 85, 0, 1551);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			mount_component(search, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.userFileter.length > 0 && ctx.showRegisForm === false) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.showRegisForm && ctx.userFileter.length > 0) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}

    			destroy_component(search);

    			if (if_block0) if_block0.d();

    			if (detaching) {
    				detach_dev(t1);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach_dev(if_block1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	
      let { userFileter = [] } = $$props;
      let dataRegister = [];
      function registerUser(data) {
        $$invalidate('showRegisForm', showRegisForm = true);
        $$invalidate('dataRegister', dataRegister = data);
      }

    	const writable_props = ['userFileter'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ({ user }) => registerUser(user.data);

    	$$self.$set = $$props => {
    		if ('userFileter' in $$props) $$invalidate('userFileter', userFileter = $$props.userFileter);
    	};

    	$$self.$capture_state = () => {
    		return { userFileter, dataRegister, showRegisForm };
    	};

    	$$self.$inject_state = $$props => {
    		if ('userFileter' in $$props) $$invalidate('userFileter', userFileter = $$props.userFileter);
    		if ('dataRegister' in $$props) $$invalidate('dataRegister', dataRegister = $$props.dataRegister);
    		if ('showRegisForm' in $$props) $$invalidate('showRegisForm', showRegisForm = $$props.showRegisForm);
    	};

    	let showRegisForm;

    	$$self.$$.update = ($$dirty = { userFileter: 1 }) => {
    		if ($$dirty.userFileter) { $$invalidate('showRegisForm', showRegisForm = !(userFileter.length > 0)); }
    	};

    	return {
    		userFileter,
    		dataRegister,
    		registerUser,
    		showRegisForm,
    		click_handler
    	};
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, ["userFileter"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Table", options, id: create_fragment$5.name });
    	}

    	get userFileter() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userFileter(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Main.svelte generated by Svelte v3.12.1 */

    const file$6 = "src\\components\\Main.svelte";

    function create_fragment$6(ctx) {
    	var div, t0, t1, updating_userFileter, t2, current;

    	var navbar = new Navbar({ $$inline: true });

    	var profile = new Profile({ $$inline: true });

    	function table_userFileter_binding(value) {
    		ctx.table_userFileter_binding.call(null, value);
    		updating_userFileter = true;
    		add_flush_callback(() => updating_userFileter = false);
    	}

    	let table_props = {};
    	if (ctx.userFileter !== void 0) {
    		table_props.userFileter = ctx.userFileter;
    	}
    	var table = new Table({ props: table_props, $$inline: true });

    	binding_callbacks.push(() => bind(table, 'userFileter', table_userFileter_binding));

    	var footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			navbar.$$.fragment.c();
    			t0 = space();
    			profile.$$.fragment.c();
    			t1 = space();
    			table.$$.fragment.c();
    			t2 = space();
    			footer.$$.fragment.c();
    			attr_dev(div, "id", "nav_bar");
    			add_location(div, file$6, 105, 0, 4663);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navbar, div, null);
    			append_dev(div, t0);
    			mount_component(profile, div, null);
    			append_dev(div, t1);
    			mount_component(table, div, null);
    			append_dev(div, t2);
    			mount_component(footer, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var table_changes = {};
    			if (!updating_userFileter && changed.userFileter) {
    				table_changes.userFileter = ctx.userFileter;
    			}
    			table.$set(table_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);

    			transition_in(profile.$$.fragment, local);

    			transition_in(table.$$.fragment, local);

    			transition_in(footer.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(profile.$$.fragment, local);
    			transition_out(table.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(navbar);

    			destroy_component(profile);

    			destroy_component(table);

    			destroy_component(footer);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

      // import './assets/datatables/jquery.data-tables.min.js'
      // import DataTable from './assets/datatables/data-tables.bootstrap4.min.js'
      let userFileter = [];

      onMount(() => {
        storeUserHIQ.subscribe(resp => {
          if (typeof resp === "object" && resp.length > 0) {
            console.log('length > 1');
            $$invalidate('userFileter', userFileter = resp);
          } else {
            console.log('[]');
            $$invalidate('userFileter', userFileter = []);
          }
        });
      });

      //   function initializeApp() {
      //     // document.getElementById('browserLanguage').textContent = "browserLanguage : " + liff.getLanguage();
      //     // document.getElementById('sdkVersion').textContent = "sdkVersion : " + liff.getVersion();
      //     // document.getElementById('isInClient').textContent = "isInClient : " + liff.isInClient();
      //     // document.getElementById('isLoggedIn').textContent = "isLoggedIn : " + liff.isLoggedIn();
      //     // document.getElementById('deviceOS').textContent = "deviceOS : " + liff.getOS();

      //     document.getElementById('liffLogoutButton').addEventListener('click', function () {
      //         if (liff.isLoggedIn()) {
      //             liff.logout();
      //             alert('logout')
      //             window.location.reload();
      //         }
      //     });

      //     document.getElementById('liffLoginButton').addEventListener('click', function () {
      //         if (!liff.isLoggedIn()) {
      //             // set `redirectUri` to redirect the user to a URL other than the front page of your LIFF app.
      //             liff.login();
      //         }
      //     });

      //     document.getElementById('openWindowButton').addEventListener('click', function() {
      //         liff.openWindow({
      //             url: 'https://line.me',
      //             external: true
      //         });
      //     });

      //     document.getElementById('scanQrCodeButton').addEventListener('click', function() {
      //         if (!liff.isInClient()) {
      //             // sendAlertIfNotInClient();
      //         } else {
      //             liff.scanCode().then(result => {
      //                 // e.g. result = { value: "Hello LIFF app!" }
      //                 const stringifiedResult = JSON.stringify(result);
      //                 document.getElementById('scanQrField').textContent = "scanQrField : " + stringifiedResult;
      //                 // toggleQrCodeReader();
      //             }).catch(err => {
      //                 document.getElementById('scanQrField').textContent = "scanCode failed!";
      //             });
      //         }
      //     });

      //     document.getElementById('getAccessToken').addEventListener('click', function() {
      //         if (!liff.isLoggedIn() && !liff.isInClient()) {
      //             alert('To get an access token, you need to be logged in. Please tap the "login" button below and try again.');
      //         } else {
      //             const accessToken = liff.getAccessToken();
      //             document.getElementById('accessTokenField').textContent = accessToken;
      //             // toggleAccessToken();
      //         }
      //     });

      //     document.getElementById('getProfileButton').addEventListener('click', function() {
      //         liff.getProfile().then(function(profile) {
      //             document.getElementById('userIdProfileField').textContent = profile.userId;
      //             document.getElementById('displayNameField').textContent = profile.displayName;

      //             const profilePictureDiv = document.getElementById('profilePictureDiv');
      //             if (profilePictureDiv.firstElementChild) {
      //                 profilePictureDiv.removeChild(profilePictureDiv.firstElementChild);
      //             }
      //             const img = document.createElement('img');
      //             img.src = profile.pictureUrl;
      //             img.alt = 'Profile Picture';
      //             img.width = '100px';
      //             img.height = '100px';
      //             profilePictureDiv.appendChild(img);

      //             document.getElementById('statusMessageField').textContent = profile.statusMessage;
      //             // toggleProfileData();
      //         }).catch(function(error) {
      //             window.alert('Error getting profile: ' + error);
      //         });
      //     });
      // }

    	function table_userFileter_binding(value) {
    		userFileter = value;
    		$$invalidate('userFileter', userFileter);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('userFileter' in $$props) $$invalidate('userFileter', userFileter = $$props.userFileter);
    	};

    	return { userFileter, table_userFileter_binding };
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Main", options, id: create_fragment$6.name });
    	}
    }

    /* src\App.svelte generated by Svelte v3.12.1 */

    function create_fragment$7(ctx) {
    	var t, current;

    	var loading = new Loading({
    		props: {
    		active: true,
    		temp: "circle_square"
    	},
    		$$inline: true
    	});

    	var main = new Main({ $$inline: true });

    	const block = {
    		c: function create() {
    			loading.$$.fragment.c();
    			t = space();
    			main.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(loading, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(main, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);

    			transition_in(main.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			transition_out(main.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(loading, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(main, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$7.name });
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
