// dom 1.2.0
//
// by @stephband
// http://stephen.band/dom

var dom = (function (exports) {
	'use strict';

	(function(window) {

		var assign         = Object.assign;
		var define         = Object.defineProperty;
		var isFrozen       = Object.isFrozen;

		var A              = Array.prototype;

		var $original      = Symbol('original');
		var $observable    = Symbol('observable');
		var $observers     = Symbol('observers');
		var $update        = Symbol('update');

		var DOMObject      = window.EventTarget || window.Node;
		var nothing        = Object.freeze([]);
		var rname          = /\[?([-\w]+)(?:=(['"])?([-\w]+)\2)?\]?\.?/g;


		// Utils

		function noop() {}

		function isArrayLike(object) {
			return object
			&& typeof object !== 'function'
			&& object.hasOwnProperty('length')
			&& typeof object.length === 'number' ;
		}

		function isObservable(object) {
			// Many built-in objects and DOM objects bork when calling their
			// methods via a proxy. They should be considered not observable.
			// I wish there were a way of whitelisting rather than
			// blacklisting, but it would seem not.

			return object
				// Reject primitives, null and other frozen objects
				&& !isFrozen(object)
				// Reject DOM nodes, Web Audio context and nodes, MIDI inputs,
				// XMLHttpRequests, which all inherit from EventTarget
				&& !DOMObject.prototype.isPrototypeOf(object)
				// Reject dates
				&& !(object instanceof Date)
				// Reject regex
				&& !(object instanceof RegExp)
				// Reject maps
				&& !(object instanceof Map)
				&& !(object instanceof WeakMap)
				// Reject sets
				&& !(object instanceof Set)
				&& !(window.WeakSet ? object instanceof WeakSet : false)
				// Reject TypedArrays and DataViews
				&& !ArrayBuffer.isView(object) ;
		}

		function getObservers(object, name) {
			return object[$observers][name]
				|| (object[$observers][name] = []);
		}

		function removeObserver(observers, fn) {
			var i = observers.indexOf(fn);
			observers.splice(i, 1);
		}

		function fire(observers, value, record) {
			if (!observers) { return; }

			// Todo: What happens if observers are removed during this operation?
			// Bad things, I'll wager.
			var n = -1;
			while (observers[++n]) {
				observers[n](value, record);
			}
		}


		// Proxy

		var createProxy = window.Proxy ? (function() {
			function trapGet(target, name, self) {
				var value = target[name];
	//console.log('TRAP GET', value);
				// Ignore symbols
				return typeof name === 'symbol' ? value :
	//				typeof value === 'function' ? MethodProxy(value) :
	//console.log('this', this);
	//console.log('target', target);
	//console.log('arguments', arguments);
	//					value.apply(this, arguments);
	//				} :
					Observable(value) || value ;
			}

			var arrayHandlers = {
				get: trapGet,

				set: function(target, name, value, receiver) {
					// We are setting a symbol
					if (typeof name === 'symbol') {
						target[name] = value;
						return true;
					}

					var old = target[name];
					var length = target.length;

					// If we are setting the same value, we're not really setting at all
					if (old === value) { return true; }

					var observers = target[$observers];
					var change;

					// We are setting length
					if (name === 'length') {
						if (value >= target.length) {
							// Don't allow array length to grow like this
							//target.length = value;
							return true;
						}

						change = {
							index:   value,
							removed: A.splice.call(target, value),
							added:   nothing,
						};

						while (--old >= value) {
							fire(observers[old], undefined);
						}
					}

					// We are setting an integer string or number
					else if (+name % 1 === 0) {
						name = +name;

						if (value === undefined) {
							if (name < target.length) {
								change = {
									index:   name,
									removed: A.splice.call(target, name, 1),
									added:   nothing
								};

								value = target[name];
							}
							else {
								return true;
							}
						}
						else {
							change = {
								index:   name,
								removed: A.splice.call(target, name, 1, value),
								added:   [value]
							};
						}
					}

					// We are setting some other key
					else {
						target[name] = value;
					}

					if (target.length !== length) {
						fire(observers.length, target.length);
					}

					fire(observers[name], Observable(value) || value);
					fire(observers[$update], receiver, change);

					// Return true to indicate success
					return true;
				}
			};

			var objectHandlers = {
				get: trapGet,

				set: function(target, name, value, receiver) {
					var old = target[name];

					// If we are setting the same value, we're not really setting at all
					if (old === value) { return true; }

					var observers = target[$observers];
					var change = {
						name:    name,
						removed: target[name],
						added:   value
					};

					target[name] = value;

					fire(observers[name], Observable(value) || value);
					fire(observers[$update], receiver, change);

					// Return true to indicate success
					return true;
				}

	//			apply: function(target, context, args) {
	//console.log('MethodProxy', target, context, args);
	//debugger;
	//				return Reflect.apply(target, context, args);
	//			}
			};

			return function createProxy(object) {
				var proxy = new Proxy(object, isArrayLike(object) ?
					arrayHandlers :
					objectHandlers
				);

				define(object, $observers, { value: {} });
				define(object, $observable, { value: proxy });

				return proxy;
			};
		})() : (function() {
			// Code for IE, whihc does not support Proxy

			function ArrayProxy(array) {
				this[$observable] = this;
				this[$original]   = array;
				this[$observers]  = array[$observers];

				assign(this, array);
				this.length = array.length;
			}

			define(ArrayProxy.prototype, 'length', {
				set: function(length) {
					var array = this[$original];

					if (length >= array.length) { return; }

					while (--array.length > length) {
						this[array.length] = undefined;
					}

					this[array.length] = undefined;

					//console.log('LENGTH', length, array.length, JSON.stringify(this))

					//array.length = length;
					notify(this, '');
				},

				get: function() {
					return this[$original].length;
				},

				configurable: true
			});

			assign(ArrayProxy.prototype, {
				filter:  function() { return A.filter.apply(this[$original], arguments); },
				find:    function() { return A.find.apply(this[$original], arguments); },
				map:     function() { return A.map.apply(this[$original], arguments); },
				reduce:  function() { return A.reduce.apply(this[$original], arguments); },
				concat:  function() { return A.concat.apply(this[$original], arguments); },
				slice:   function() { return A.slice.apply(this[$original], arguments); },
				some:    function() { return A.some.apply(this[$original], arguments); },
				indexOf: function() { return A.indexOf.apply(this[$original], arguments); },
				forEach: function() { return A.forEach.apply(this[$original], arguments); },
				toJSON:  function() { return this[$original]; },

				sort: function() {
					A.sort.apply(this[$original], arguments);
					assign(this, array);
					this.length = array.length;
					notify(this, '');
					return this;
				},

				push: function() {
					var array = this[$original];
					var value = A.push.apply(array, arguments);
					assign(this, array);
					this.length = array.length;
					console.log('PUSH', JSON.stringify(arguments));
					notify(this, '');
					return value;
				},

				pop: function() {
					var array = this[$original];
					var value = A.pop.apply(array, arguments);
					assign(this, array);
					this.length = array.length;
					notify(this, '');
					return value;
				},

				shift: function() {
					var array = this[$original];
					var value = A.shift.apply(array, arguments);
					assign(this, array);
					this.length = array.length;
					notify(this, '');
					return value;
				},

				splice: function() {
					var array = this[$original];
					var value = A.splice.apply(array, arguments);
					assign(this, array);
					this.length = array.length;
					notify(this, '');
					return value;
				}
			});

			return function createNoProxy(object) {
				var proxy;

				if (isArrayLike(object)) {
					define(object, $observers, { value: {} });
					proxy = isArrayLike(object) ? new ArrayProxy(object) : object ;
				}
				else {
					proxy = object;
				}

				define(object, $observable, { value: proxy });
				return proxy;
			};
		})() ;


		// observe

		function observePrimitive(object, fn) {
			if (object !== fn.value) {
				fn.value = object;
				fn(object);
			}

			return noop;
		}

		function observeObject(object, fn) {
			var observers = getObservers(object, $update);
			var old       = fn.value;

			observers.push(fn);

			if (object !== fn.value) {
				fn.value = object;
				fn(object, {
					index:   0,
					removed: old ? old : nothing,
					added:   object
				});
			}

			return function unobserveObject() {
				removeObserver(observers, fn);
			};
		}

		function observeItem(object, key, match, path, fn) {
			var unobserve = noop;

			function isMatch(item) {
				return item[key] === match;
			}

			function update(array) {
				var value = array && A.find.call(array, isMatch);
				unobserve();
				unobserve = observe(value, path, fn);
			}

			var unobserveObject = observeObject(object, update);

			return function unobserveItem() {
				unobserve();
				unobserveObject();
			};
		}

		var observeProperty = window.Proxy ? function observeProperty(object, name, path, fn) {
			var observers = getObservers(object, name);
			var unobserve = noop;

			function update(value) {
				unobserve();
				unobserve = observe(value, path, fn);
			}

			observers.push(update);
			update(object[name]);

			return function unobserveProperty() {
				unobserve();
				removeObserver(observers, update);
			};
		} : function observePropertyNoProxy(object, name, path, fn) {
			var unobserve = noop;

			function update(value) {
				unobserve();
				unobserve = observe(value, path, fn);
			}

			var _unobserve = window.observe(object[$observable] || object, name, update);
			update(object[name]);

			return function() {
				unobserve();
				_unobserve();
			};
		} ;

		function callbackItem(object, key, match, path, fn) {
			function isMatch(item) {
				return item[key] === match;
			}

			var value = object && A.find.call(object, isMatch);
			return observe(Observable(value) || value, path, fn);
		}

		function callbackProperty(object, name, path, fn) {
			return observe(Observable(object[name]) || object[name], path, fn);
		}

		function observe(object, path, fn) {
			if (!path.length) {
				// We can assume the full isObservable() check has been done, as
				// this function is only called internally or from Object.observe
				//
				// The object[$observers] check is for IE - it checks whether the
				// object is observable for muteability.
				return object && object[$observable] && object[$observers] ?
					observeObject(object, fn) :
					observePrimitive(object, fn) ;
			}

			if (!(object && typeof object === 'object')) {
				return observePrimitive(undefined, fn);
			}

			rname.lastIndex = 0;
			var tokens = rname.exec(path);

			if (!tokens) {
				throw new Error('Observable: invalid path "' + path + '"');
			}

			var name  = tokens[1];
			var match = tokens[3] && (
				tokens[2] ?
					tokens[3] :
					parseFloat(tokens[3])
			);

			path = path.slice(rname.lastIndex);

			return object[$observable] ?
				match ?
					observeItem(object, name, match, path, fn) :
					observeProperty(object, name, path, fn) :
				match ?
					callbackItem(object, name, match, path, fn) :
					callbackProperty(object, name, path, fn) ;
		}


		// Observable

		function Observable(object) {
			return !object ? undefined :
				object[$observable] ? object[$observable] :
				!isObservable(object) ? undefined :
			createProxy(object) ;
		}

		Observable.isObservable = isObservable;

		Observable.notify = function notify(object, path) {
			var observers = object[$observers];
			fire(observers[path], object[$observable]);
			fire(observers[$update], object);
		};

		Observable.observe = function(object, path, fn) {
			// Coerce path to string
			return observe(Observable(object) || object, path + '', fn);
		};

		// Experimental

		Observable.filter = function(fn, array) {
			var subset = Observable([]);

			Observable.observe(array, '', function() {
				var filtered = array.filter(fn);
				assign(subset, filtered);
				subset.length = filtered.length;
			});

			return subset;
		};

		Observable.map = function(fn, array) {
			var subset = Observable([]);

			Observable.observe(array, '', function(observable) {
				var filtered = array.map(fn);
				assign(subset, filtered);
				subset.length = filtered.length;
			});

			return subset;
		};


		// Export

		window.Observable = Observable;

	})(window);

	const DEBUG$1 = false;

	function cache(fn) {
	    var map = new Map();

	    return function cache(object) {
	        if (DEBUG$1 && arguments.length > 1) {
	            throw new Error('Fn: cache() called with ' + arguments.length + ' arguments. Accepts exactly 1.');
	        }

	        if (map.has(object)) {
	            return map.get(object);
	        }

	        var value = fn(object);
	        map.set(object, value);
	        return value;
	    };
	}

	const DEBUG$2 = true;
	const A     = Array.prototype;

	function applyFn(fn, args) {
	    return typeof fn === 'function' ? fn.apply(null, args) : fn ;
	}

	function curry(fn, muteable, arity) {
	    arity = arity || fn.length;

	    var memo = arity === 1 ?
	        // Don't cache if `muteable` flag is true
	        muteable ? fn : cache(fn) :

	        // It's ok to always cache intermediate memos, though
	        cache(function(object) {
	            return curry(function() {
	                var args = [object];
	                args.push.apply(args, arguments);
	                return fn.apply(null, args);
	            }, muteable, arity - 1) ;
	        }) ;

	    return function partial(object) {
	        return arguments.length === 0 ?
	            partial :
	        arguments.length === 1 ?
	            memo(object) :
	        arguments.length === arity ?
	            fn.apply(null, arguments) :
	        arguments.length > arity ?
	            applyFn(fn.apply(null, A.splice.call(arguments, 0, arity)), arguments) :
	        applyFn(memo(object), A.slice.call(arguments, 1)) ;
	    };
	}

	/*
	function curry(fn, muteable, arity) {
	    arity = arity || fn.length;
	    return function curried() {
	        return arguments.length >= arity ?
	            fn.apply(null, arguments) :
	            curried.bind(null, ...arguments) ;
	    };
	}
	*/

	if (DEBUG$2) {
	    const _curry = curry;

	    // Feature test
		const isFunctionLengthDefineable = (function() {
			var fn = function() {};

			try {
				// Can't do this on Safari - length non configurable :(
				Object.defineProperty(fn, 'length', { value: 2 });
			}
			catch(e) {
				return false;
			}

			return fn.length === 2;
		})();

	    const setFunctionProperties = function setFunctionProperties(text, parity, fn1, fn2) {
	        // Make the string representation of fn2 display parameters of fn1
	        fn2.toString = function() {
	            return /function\s*[\w\d]*\s*\([,\w\d\s]*\)/.exec(fn1.toString()) + ' { [' + text + '] }';
	        };

	        // Where possible, define length so that curried functions show how
	        // many arguments they are yet expecting
	        if (isFunctionLengthDefineable) {
	            Object.defineProperty(fn2, 'length', { value: parity });
	        }

	        return fn2;
	    };

	    // Make curried functions log a pretty version of their partials
	    curry = function curry(fn, muteable, arity) {
	        arity  = arity || fn.length;
	        return setFunctionProperties('curried', arity, fn, _curry(fn, muteable, arity));
	    };
	}


	var curry$1 = curry;

	// choke
	//
	// Returns a function that waits for `time` seconds without being invoked
	// before calling `fn` using the context and arguments from the latest
	// invocation

	function choke(fn, time) {
	    var timer, context, args;
	    var cue = function cue() {
	        if (timer) { clearTimeout(timer); }
	        timer = setTimeout(update, (time || 0) * 1000);
	    };

	    function update() {
	        timer = false;
	        fn.apply(context, args);
	    }

	    function cancel() {
	        // Don't permit further changes to be queued
	        cue = noop;

	        // If there is an update queued apply it now
	        if (timer) { clearTimeout(timer); }
	    }

	    function wait() {
	        // Store the latest context and arguments
	        context = this;
	        args = arguments;

	        // Cue the update
	        cue();
	    }

	    wait.cancel = cancel;
	    return wait;
	}

	// Choke or wait? A simpler implementation without cancel(), I leave this here for reference...
	//	function choke(seconds, fn) {
	//		var timeout;
	//
	//		function update(context, args) {
	//			fn.apply(context, args);
	//		}
	//
	//		return function choke() {
	//			clearTimeout(timeout);
	//			timeout = setTimeout(update, seconds * 1000, this, arguments);
	//		};
	//	}

	function rest(i, object) {
	    if (object.slice) { return object.slice(i); }
	    if (object.rest)  { return object.rest(i); }

	    var a = [];
	    var n = object.length - i;
	    while (n--) { a[n] = object[n + i]; }
	    return a;
	}

	function choose(map) {
	    return function choose(key) {
	        var fn = map[key] || map.default;
	        return fn && fn.apply(this, rest(1, arguments)) ;
	    };
	}

	function compose(fn2, fn1) {
	    return function compose() {
	        return fn2(fn1.apply(null, arguments));
	    };
	}

	function deprecate(fn, message) {
	    // Recall any function and log a depreciation warning
	    return function deprecate() {
	        console.warn('Deprecation warning: ' + message);
	        return fn.apply(this, arguments);
	    };
	}

	function id(object) { return object; }

	function isDefined(value) {
	    // !!value is a fast out for non-zero numbers, non-empty strings
	    // and other objects, the rest checks for 0, '', etc.
	    return !!value || (value !== undefined && value !== null && !Number.isNaN(value));
	}

	function latest(source) {
	    var value = source.shift();
	    return value === undefined ? arguments[1] : latest(source, value) ;
	}

	function noop$1() {}

	var nothing$1 = Object.freeze(Object.defineProperties([], {
	   shift: { value: noop$1 }
	}));

	function now() {
	    // Return time in seconds
	    return +new Date() / 1000;
	}

	function overload(fn, map) {
	    return typeof map.get === 'function' ?
	        function overload() {
	            var key = fn.apply(null, arguments);
	            return map.get(key).apply(this, arguments);
	        } :
	        function overload() {
	            const key     = fn.apply(null, arguments);
	            const handler = (map[key] || map.default);
	            if (!handler) { throw new Error('overload() no handler for "' + key + '"'); }
	            return handler.apply(this, arguments);
	        } ;
	}

	const A$1 = Array.prototype;

	function call(value, fn) {
	    return fn(value);
	}

	function pipe() {
	    const fns = arguments;
	    return function pipe(value) {
	        return A$1.reduce.call(fns, call, value);
	    };
	}

	const resolved = Promise.resolve();

	function requestTick(fn) {
	    resolved.then(fn);
	    return true;
	}

	// Throttle

	function toArray$1(object) {
	    if (object.toArray) { return object.toArray(); }

	    // Speed test for array conversion:
	    // https://jsperf.com/nodelist-to-array/27

	    var array = [];
	    var l = object.length;
	    var i;

	    if (typeof object.length !== 'number') { return array; }

	    array.length = l;

	    for (i = 0; i < l; i++) {
	        array[i] = object[i];
	    }

	    return array;
	}

	function toClass(object) {
	    return O.toString.apply(object).slice(8, -1);
	}

	function toType(object) {
	    return typeof object;
	}

	const assign = Object.assign;

	function isDone(source) {
	    return source.length === 0 || source.status === 'done' ;
	}

	function create(object, fn) {
	    var functor = Object.create(object);
	    functor.shift = fn;
	    return functor;
	}

	function arrayReducer(array, value) {
	    array.push(value);
	    return array;
	}

	function shiftTap(shift, fn) {
	    return function tap() {
	        var value = shift();
	        value !== undefined && fn(value);
	        return value;
	    };
	}

	function sortedSplice(array, fn, value) {
	    // Splices value into array at position determined by result of fn,
	    // where result is either in the range [-1, 0, 1] or [true, false]
	    var n = sortIndex(array, function(n) {
	        return fn(value, n);
	    });
	    array.splice(n, 0, value);
	}

	function sortIndex(array, fn) {
	    var l = array.length;
	    var n = l + l % 2;
	    var i = 0;

	    while ((n = Math.floor(n / 2)) && (i + n <= l)) {
	        if (fn(array[i + n - 1]) >= 0) {
	            i += n;
	            n += n % 2;
	        }
	    }

	    return i;
	}

	function Fn$1(fn) {
	    // Accept constructor without `new`
	    if (!this || !Fn$1.prototype.isPrototypeOf(this)) {
	        return new Fn$1(fn);
	    }

	    var source = this;

	    if (!fn) {
	        source.status = 'done';
	        return;
	    }

	    var value = fn();

	    if (value === undefined) {
	        source.status = 'done';
	        return;
	    }

	    this.shift = function shift() {
	        if (source.status === 'done') { return; }

	        var v = value;

	        // Where the next value is undefined mark the functor as done
	        value = fn();
	        if (value === undefined) {
	            source.status = 'done';
	        }

	        return v;
	    };
	}


	assign(Fn$1, {

	    // Constructors

	    of: function() { return Fn$1.from(arguments); },

	    from: function(object) {
	        var i;

	        // object is an array or array-like object. Iterate over it without
	        // mutating it.
	        if (typeof object.length === 'number') {
	            i = -1;

	            return new Fn$1(function shiftArray() {
	                // Ignore undefined holes in arrays
	                return ++i >= object.length ?
	                    undefined :
	                object[i] === undefined ?
	                    shiftArray() :
	                    object[i] ;
	            });
	        }

	        // object is an object with a shift function
	        if (typeof object.shift === "function" && object.length === undefined) {
	            return new Fn$1(function shiftObject() {
	                return object.shift();
	            });
	        }

	        // object is an iterator
	        if (typeof object.next === "function") {
	            return new Fn$1(function shiftIterator() {
	                var result = object.next();

	                // Ignore undefined holes in iterator results
	                return result.done ?
	                    result.value :
	                result.value === undefined ?
	                    shiftIterator() :
	                    result.value ;
	            });
	        }

	        throw new Error('Fn: from(object) object is not a list of a known kind (array, functor, stream, iterator).')
	    }
	});

	assign(Fn$1.prototype, {
	    shift: noop$1,

	    // Input

	    of: function() {
	        // Delegate to the constructor's .of()
	        return this.constructor.of.apply(this.constructor, arguments);
	    },

	    // Transform

	    ap: function(object) {
	        var shift = this.shift;

	        return create(this, function ap() {
	            var fn = shift();
	            return fn === undefined ?
	                undefined :
	                object.map(fn) ;
	        });
	    },

	    unshift: function() {
	        // Create an unshift buffer, such that objects can be inserted
	        // back into the stream at will with stream.unshift(object).
	        var source = this;
	        var buffer = toArray$1(arguments);

	        return create(this, function() {
	            return (buffer.length ? buffer : source).shift() ;
	        });
	    },

	    catch: function(fn) {
	        var source = this;

	        return create(this, function() {
	            try {
	                return source.shift();
	            }
	            catch(e) {
	                return fn(e);
	            }
	        });
	    },

	    chain: function(fn) {
	        return this.map(fn).join();
	    },

	    clone: function() {
	        var source  = this;
	        var shift   = this.shift;
	        var buffer1 = [];
	        var buffer2 = [];
	        var doneFlag = false;

	        // Messy. But it works. Just.

	        this.shift = function() {
	            var value;

	            if (buffer1.length) {
	                value = buffer1.shift();

	                if (!buffer1.length && doneFlag) {
	                    source.status = 'done';
	                }

	                return value;
	            }

	            if (!doneFlag) {
	                value = shift();

	                if (source.status === 'done') {
	                    doneFlag = true;
	                }

	                if (value !== undefined) {
	                    buffer2.push(value);
	                }

	                return value;
	            }
	        };

	        var clone = new Fn$1(function shiftClone() {
	            var value;

	            if (buffer2.length) {
	                return buffer2.shift();
	                //if (!buffer2.length && doneFlag) {
	                //	clone.status = 'done';
	                //}
	            }

	            if (!doneFlag) {
	                value = shift();

	                if (source.status === 'done') {
	                    doneFlag = true;
	                    source.status = undefined;
	                }

	                if (value !== undefined) {
	                    buffer1.push(value);
	                }

	                return value;
	            }
	        });

	        return clone;
	    },

	    concat: function() {
	        var sources = toArray$1(arguments);
	        var source  = this;

	        var stream  = create(this, function concat() {
	            if (source === undefined) {
	                stream.status = 'done';
	                return;
	            }

	            if (isDone(source)) {
	                source = sources.shift();
	                return concat();
	            }

	            var value = source.shift();

	            stream.status = sources.length === 0 && isDone(source) ?
	                'done' : undefined ;

	            return value;
	        });

	        return stream;
	    },

	    dedup: function() {
	        var v;
	        return this.filter(function(value) {
	            var old = v;
	            v = value;
	            return old !== value;
	        });
	    },

	    filter: function(fn) {
	        var source = this;

	        return create(this, function filter() {
	            var value;
	            while ((value = source.shift()) !== undefined && !fn(value));
	            return value;
	        });
	    },

	    first: function() {
	        var source = this;
	        return create(this, once(function first() {
	            source.status = 'done';
	            return source.shift();
	        }));
	    },

	    join: function() {
	        var source = this;
	        var buffer = nothing;

	        return create(this, function join() {
	            var value = buffer.shift();
	            if (value !== undefined) { return value; }
	            buffer = source.shift();
	            if (buffer !== undefined) { return join(); }
	            buffer = nothing;
	        });
	    },

	    latest: function() {
	        var source = this;
	        return create(this, function shiftLast() {
	            return latest(source);
	        });
	    },

	    map: function(fn) {
	        return create(this, compose(function map(object) {
	            return object === undefined ? undefined : fn(object) ;
	        }, this.shift));
	    },

	    chunk: function(n) {
	        var source = this;
	        var buffer = [];

	        return create(this, n ?
	            // If n is defined batch into arrays of length n.
	            function shiftChunk() {
	                var value, _buffer;

	                while (buffer.length < n) {
	                    value = source.shift();
	                    if (value === undefined) { return; }
	                    buffer.push(value);
	                }

	                if (buffer.length >= n) {
	                    _buffer = buffer;
	                    buffer = [];
	                    return Fn$1.of.apply(Fn$1, _buffer);
	                }
	            } :

	            // If n is undefined or 0, batch all values into an array.
	            function shiftChunk() {
	                buffer = source.toArray();
	                // An empty array is equivalent to undefined
	                return buffer.length ? buffer : undefined ;
	            }
	        );
	    },

	    fold: function(fn, seed) {
	        var i = 0;
	        return this
	        .map(function fold(value) {
	            seed = fn(seed, value, i++);
	            return seed;
	        })
	        .unshift(seed);
	    },

	    partition: function(fn) {
	        var source = this;
	        var buffer = [];
	        var streams = new Map();

	        fn = fn || Fn$1.id;

	        function createPart(key, value) {
	            var stream = Stream.of().on('pull', shiftPull);
	            stream.key = key;
	            streams.set(key, stream);
	            return stream;
	        }

	        function shiftPull(type, pullStream) {
	            var value  = source.shift();
	            if (value === undefined) { return; }

	            var key    = fn(value);
	            var stream = streams.get(key);

	            if (stream === pullStream) { return value; }

	            if (stream === undefined) {
	                stream = createPart(key, value);
	                buffer.push(stream);
	            }

	            stream.push(value);
	            return shiftPull(type, pullStream);
	        }

	        return create(this, function shiftStream() {
	            if (buffer.length) { return buffer.shift(); }

	            var value = source.shift();
	            if (value === undefined) { return; }

	            var key    = fn(value);
	            var stream = streams.get(key);

	            if (stream === undefined) {
	                stream = createPart(key, value);
	                stream.push(value);
	                return stream;
	            }

	            stream.push(value);
	            return shiftStream();
	        });
	    },

	    reduce: function reduce(fn, seed) {
	        return this.fold(fn, seed).latest().shift();
	    },

	    take: function(n) {
	        var source = this;
	        var i = 0;

	        return create(this, function take() {
	            var value;

	            if (i < n) {
	                value = source.shift();
	                // Only increment i where an actual value has been shifted
	                if (value === undefined) { return; }
	                if (++i === n) { source.status = 'done'; }
	                return value;
	            }
	        });
	    },

	    sort: function(fn) {
	        fn = fn || Fn$1.byGreater ;

	        var source = this;
	        var buffer = [];

	        return create(this, function sort() {
	            var value;

	            while((value = source.shift()) !== undefined) {
	                sortedSplice(buffer, fn, value);
	            }

	            return buffer.shift();
	        });
	    },

	    split: function(fn) {
	        var source = this;
	        var buffer = [];

	        return create(this, function split() {
	            var value = source.shift();
	            var temp;

	            if (value === undefined) {
	                if (buffer.length) {
	                    temp = buffer;
	                    buffer = [];
	                    return temp;
	                }

	                return;
	            }

	            if (fn(value)) {
	                temp = buffer;
	                buffer = [value];
	                return temp.length ? temp : split() ;
	            }

	            buffer.push(value);
	            return split();
	        });
	    },

	    syphon: function(fn) {
	        var shift   = this.shift;
	        var buffer1 = [];
	        var buffer2 = [];

	        this.shift = function() {
	            if (buffer1.length) { return buffer1.shift(); }

	            var value;

	            while ((value = shift()) !== undefined && fn(value)) {
	                buffer2.push(value);
	            }

	            return value;
	        };

	        return create(this, function filter() {
	            if (buffer2.length) { return buffer2.shift(); }

	            var value;

	            while ((value = shift()) !== undefined && !fn(value)) {
	                buffer1.push(value);
	            }

	            return value;
	        });
	    },

	    rest: function(i) {
	        var source = this;

	        return create(this, function rest() {
	            while (i-- > 0) { source.shift(); }
	            return source.shift();
	        });
	    },

	    unique: function() {
	        var source = this;
	        var values = [];

	        return create(this, function unique() {
	            var value = source.shift();

	            return value === undefined ? undefined :
	                values.indexOf(value) === -1 ? (values.push(value), value) :
	                unique() ;
	        });
	    },

	    // Consumers

	    each: function(fn) {
	        var value;

	        while ((value = this.shift()) !== undefined) {
	            fn.call(this, value);
	        }

	        return this;
	    },

	    find: function(fn) {
	        return this
	        .filter(fn)
	        .first()
	        .shift();
	    },

	    next: function() {
	        return {
	            value: this.shift(),
	            done:  this.status
	        };
	    },

	    pipe: function(stream) {
	        // Target must be evented
	        if (!stream || !stream.on) {
	            throw new Error('Fn: Fn.pipe(object) object must be a stream. (' + stream + ')');
	        }

	        return stream.on('pull', this.shift);
	    },

	    tap: function(fn) {
	        // Overwrite shift to copy values to tap fn
	        this.shift = shiftTap(this.shift, fn);
	        return this;
	    },

	    toJSON: function() {
	        return this.reduce(arrayReducer, []);
	    },

	    toString: function() {
	        return this.reduce(prepend, '');
	    },


	    // Deprecated

	    process: deprecate(function(fn) {
	        return fn(this);
	    }, '.process() is deprecated'),

	    last: deprecate(function() {
	        var source = this;
	        return create(this, function shiftLast() {
	            return latest(source);
	        });
	    }, '.last() is now .latest()'),
	});

	Fn$1.prototype.toArray = Fn$1.prototype.toJSON;

	// Todo: As of Nov 2016 fantasy land spec requires namespaced methods:
	//
	// equals: 'fantasy-land/equals',
	// lte: 'fantasy-land/lte',
	// concat: 'fantasy-land/concat',
	// empty: 'fantasy-land/empty',
	// map: 'fantasy-land/map',
	// contramap: 'fantasy-land/contramap',
	// ap: 'fantasy-land/ap',
	// of: 'fantasy-land/of',
	// alt: 'fantasy-land/alt',
	// zero: 'fantasy-land/zero',
	// reduce: 'fantasy-land/reduce',
	// traverse: 'fantasy-land/traverse',
	// chain: 'fantasy-land/chain',
	// chainRec: 'fantasy-land/chainRec',
	// extend: 'fantasy-land/extend',
	// extract: 'fantasy-land/extract',
	// bimap: 'fantasy-land/bimap',
	// promap: 'fantasy-land/promap'


	if (window.Symbol) {
	    // A functor is it's own iterator
	    Fn$1.prototype[Symbol.iterator] = function() {
	        return this;
	    };
	}

	const A$2 = Array.prototype;

	function by(fn, a, b) {
	    const fna = fn(a);
	    const fnb = fn(b);
	    return fnb === fna ? 0 : fna > fnb ? 1 : -1 ;
	}
	function byAlphabet(a, b) {
	    return S.localeCompare.call(a, b);
	}
	function each(fn, object) {
	    // A stricter version of .forEach, where the callback fn
	    // gets a single argument and no context.
	    var l, n;

	    if (typeof object.each === 'function') {
	        object.each(fn);
	    }
	    else {
	        l = object.length;
	        n = -1;
	        while (++n < l) { fn(object[n]); }
	    }

	    return object;
	}
	function map(fn, object) {
	    return object && object.map ? object.map(fn) : A$2.map.call(object, fn) ;
	}

	function filter(fn, object) {
	    return object.filter ?
	        object.filter(fn) :
	        A$2.filter.call(object, fn) ;
	}

	function reduce(fn, seed, object) {
	    return object.reduce ?
	        object.reduce(fn, seed) :
	        A$2.reduce.call(object, fn, seed);
	}

	function sort(fn, object) {
	    return object.sort ? object.sort(fn) : A$2.sort.call(object, fn);
	}

	function concat(array2, array1) {
	    // A.concat only works with arrays - it does not flatten array-like
	    // objects. We need a robust concat that will glue any old thing
	    // together.
	    return Array.isArray(array1) ?
	        // 1 is an array. Convert 2 to an array if necessary
	        array1.concat(Array.isArray(array2) ? array2 : toArray(array2)) :

	    array1.concat ?
	        // It has it's own concat method. Lets assume it's robust
	        array1.concat(array2) :
	    // 1 is not an array, but 2 is
	    toArray(array1).concat(Array.isArray(array2) ? array2 : toArray(array2)) ;
	}
	function contains(value, object) {
	    return object.includes ?
	        object.includes(value) :
	    object.contains ?
	        object.contains(value) :
	    A$2.includes ?
	        A$2.includes.call(object, value) :
	        A$2.indexOf.call(object, value) !== -1 ;
	}
	function find(fn, object) {
	    return A$2.find.call(object, fn);
	}

	function insert(fn, array, object) {
	    var n = -1;
	    var l = array.length;
	    var value = fn(object);
	    while(++n < l && fn(array[n]) <= value);
	    A$2.splice.call(array, n, 0, object);
	}

	function slice(n, m, object) {
	    return object.slice ?
	        object.slice(n, m) :
	        A$2.slice.call(object, n, m) ;
	}

	// Timer

	function Timer(duration, getTime) {
	    if (typeof duration !== 'number') { throw new Error('Timer(duration) requires a duration in seconds (' + duration + ')'); }

	    // Optional second argument is a function that returns
	    // current time (in seconds)
	    getTime = getTime || now;

	    var fns = [];
	    var id;
	    var t0  = -Infinity;

	    function frame() {
	        var n = fns.length;

	        id = undefined;
	        t0 = getTime();

	        while (n--) {
	            fns.shift()(t0);
	        }
	    }

	    return {
	        now: getTime,

	        request: function(fn) {
	            if (typeof fn !== 'function') { throw new Error('fn is not a function.'); }

	            // Add fn to queue
	            fns.push(fn);

	            // If the timer is cued do nothing
	            if (id) { return; }

	            var t1 = getTime();

	            // Set the timer and return something truthy
	            if (t0 + duration > t1) {
	                id = setTimeout(frame, (t0 + duration - t1) * 1000);
	            }
	            else {
	                requestTick(frame) ;
	            }

	            // Use the fn reference as the request id, because why not
	            return fn;
	        },

	        cancel: function(fn) {
	            var i = fns.indexOf(fn);
	            if (i === -1) { return; }

	            fns.splice(i, 1);

	            if (!fns.length) {
	                clearTimeout(id);
	                id = undefined;
	            }
	        }
	    };
	}

	var debug     = false;
	var A$3         = Array.prototype;
	var assign$1    = Object.assign;


	// Functions

	function call$1(value, fn) {
	    return fn(value);
	}

	function isValue(n) { return n !== undefined; }

	function isDone$1(stream) {
	    return stream.status === 'done';
	}

	function checkSource(source) {
	    // Check for .shift()
	    if (!source.shift) {
	        throw new Error('Stream: Source must create an object with .shift() ' + source);
	    }
	}


	// Events

	var $events = Symbol('events');

	function notify$1(type, object) {
	    var events = object[$events];

	    if (!events) { return; }
	    if (!events[type]) { return; }

	    var n = -1;
	    var l = events[type].length;
	    var value;

	    while (++n < l) {
	        value = events[type][n](type, object);
	        if (value !== undefined) {
	            return value;
	        }
	    }
	}

	function createNotify(stream) {
	    var _notify = notify$1;

	    return function trigger(type) {
	        // Prevent nested events, so a 'push' event triggered while
	        // the stream is 'pull'ing will do nothing. A bit of a fudge.
	        var notify = _notify;
	        _notify = noop$1;
	        var value = notify(type, stream);
	        _notify = notify;
	        return value;
	    };
	}


	// Sources
	//
	// Sources that represent stopping and stopped states of a stream

	var doneSource = {
	    shift: noop$1,
	    push:  noop$1,
	    start: noop$1,
	    stop:  noop$1
	};

	function StopSource(source, n, done) {
	    this.source = source;
	    this.n      = n;
	    this.done   = done;
	}

	assign$1(StopSource.prototype, doneSource, {
	    shift: function() {
	        if (--this.n < 1) { this.done(); }
	        return this.source.shift();
	    }
	});


	// Stream

	function Stream$1(Source, options) {
	    // Enable construction without the `new` keyword
	    if (!Stream$1.prototype.isPrototypeOf(this)) {
	        return new Stream$1(Source, options);
	    }

	    var stream  = this;
	    var getSource;

	    var promise = new Promise(function(resolve, reject) {
	        var source;

	        function done() {
	            stream.status = 'done';
	            source = doneSource;
	        }

	        function stop(n, value) {
	            // Neuter events and schedule shutdown of the stream
	            // after n values
	            delete stream[$events];

	            if (n) { source = new StopSource(source, n, done); }
	            else { done(); }

	            // Note that we cannot resolve with stream because Chrome sees
	            // it as a promise (resolving with promises is special)
	            resolve(value);
	        }

	        getSource = function() {
	            var notify = createNotify(stream);
	            source = new Source(notify, stop, options);

	            // Check for sanity
	            if (debug) { checkSource(source); }

	            // Gaurantee that source has a .stop() method
	            if (!source.stop) { source.stop = noop$1; }

	            getSource = function() { return source; };

	            return source;
	        };
	    });

	    // Properties and methods

	    this[$events] = {};

	    this.push = function push() {
	        var source = getSource();
	        source.push.apply(source, arguments);
	        return stream;
	    };

	    this.shift = function shift() {
	        return getSource().shift();
	    };

	    this.start = function start() {
	        var source = getSource();
	        source.start.apply(source, arguments);
	        return stream;
	    };

	    this.stop = function stop() {
	        var source = getSource();
	        source.stop.apply(source, arguments);
	        return stream;
	    };

	    this.then = promise.then.bind(promise);
	}


	// Stream Constructors

	function BufferSource(notify, stop, buffer) {
	    this._buffer = buffer;
	    this._notify = notify;
	    this._stop   = stop;
	}

	assign$1(BufferSource.prototype, {
	    shift: function() {
	        var buffer = this._buffer;
	        var notify = this._notify;
	        return buffer.length ? buffer.shift() : notify('pull') ;
	    },

	    push: function() {
	        var buffer = this._buffer;
	        var notify = this._notify;
	        buffer.push.apply(buffer, arguments);
	        notify('push');
	    },

	    stop: function() {
	        var buffer = this._buffer;
	        this._stop(buffer.length);
	    }
	});

	Stream$1.from = function(source) {
	    return new Stream$1(function setup(notify, stop) {
	        var buffer = source === undefined ? [] :
	            Fn$1.prototype.isPrototypeOf(source) ? source :
	            Array.from(source).filter(isValue) ;

	        return new BufferSource(notify, stop, buffer);
	    });
	};

	Stream$1.of = function() { return Stream$1.from(arguments); };


	// Stream.Combine

	function toValue(data) {
	    var source = data.source;
	    var value  = data.value;
	    return data.value = value === undefined ? latest(source) : value ;
	}

	function CombineSource(notify, stop, fn, sources) {
	    var object = this;

	    this._notify  = notify;
	    this._stop    = stop;
	    this._fn      = fn;
	    this._sources = sources;
	    this._hot     = true;

	    this._store = sources.map(function(source) {
	        var data = {
	            source: source,
	            listen: listen
	        };

	        // Listen for incoming values and flag as hot
	        function listen() {
	            data.value = undefined;
	            object._hot = true;
	        }

	        source.on('push', listen);
	        source.on('push', notify);
	        return data;
	    });
	}

	assign$1(CombineSource.prototype, {
	    shift: function combine() {
	        // Prevent duplicate values going out the door
	        if (!this._hot) { return; }
	        this._hot = false;

	        var sources = this._sources;
	        var values  = this._store.map(toValue);
	        if (sources.every(isDone$1)) { this._stop(0); }
	        return values.every(isValue) && this._fn.apply(null, values) ;
	    },

	    stop: function stop() {
	        var notify = this._notify;

	        // Remove listeners
	        each(function(data) {
	            var source = data.source;
	            var listen = data.listen;
	            source.off('push', listen);
	            source.off('push', notify);
	        }, this._store);

	        this._stop(this._hot ? 1 : 0);
	    }
	});

	Stream$1.Combine = function(fn) {
	    var sources = A$3.slice.call(arguments, 1);

	    if (sources.length < 2) {
	        throw new Error('Stream: Combine requires more than ' + sources.length + ' source streams')
	    }

	    return new Stream$1(function setup(notify, stop) {
	        return new CombineSource(notify, stop, fn, sources);
	    });
	};


	// Stream.Merge

	function MergeSource(notify, stop, sources) {
	    var values = [];
	    var buffer = [];

	    function update(type, source) {
	        buffer.push(source);
	    }

	    this._notify  = notify;
	    this._stop    = stop;
	    this._sources = sources;
	    this._values  = values;
	    this._buffer  = buffer;
	    this._i       = 0;
	    this._update  = update;

	    each(function(source) {
	        // Flush the source
	        values.push.apply(values, toArray$1(source));

	        // Listen for incoming values
	        source.on('push', update);
	        source.on('push', notify);
	    }, sources);
	}

	assign$1(MergeSource.prototype, {
	    shift: function() {
	        var sources = this._sources;
	        var values  = this._values;
	        var buffer  = this._buffer;
	        var stop    = this._stop;

	        if (values.length) { return values.shift(); }
	        var stream = buffer.shift();
	        if (!stream) { return; }
	        var value = stream.shift();
	        // When all the sources are empty, stop
	        if (stream.status === 'done' && ++this._i >= sources.length) { stop(0); }
	        return value;
	    },

	    stop: function() {
	        var notify  = this._notify;
	        var sources = this._sources;
	        var stop    = this._stop;
	        var update  = this._update;

	        // Remove listeners
	        each(function(source) {
	            source.off('push', update);
	            source.off('push', notify);
	        }, sources);

	        stop(values.length + buffer.length);
	    }
	});

	Stream$1.Merge = function(source1, source2) {
	    var args = arguments;

	    return new Stream$1(function setup(notify, stop) {
	        return new MergeSource(notify, stop, Array.from(args));
	    });
	};


	// Stream.Events

	Stream$1.Events = function(type, node) {
	    return new Stream$1(function setup(notify, stop) {
	        var buffer = [];

	        function update(value) {
	            buffer.push(value);
	            notify('push');
	        }

	        node.addEventListener(type, update);

	        return {
	            shift: function() {
	                return buffer.shift();
	            },

	            stop: function stop() {
	                node.removeEventListener(type, update);
	                stop(buffer.length);
	            }
	        };
	    });
	};


	// Stream Timers

	Stream$1.Choke = function(time) {
	    return new Stream$1(function setup(notify, done) {
	        var value;
	        var update = choke(function() {
	            // Get last value and stick it in buffer
	            value = arguments[arguments.length - 1];
	            notify('push');
	        }, time);

	        return {
	            shift: function() {
	                var v = value;
	                value = undefined;
	                return v;
	            },

	            push: update,

	            stop: function stop() {
	                update.cancel(false);
	                done();
	            }
	        };
	    });
	};



	// Frame timer

	var frameTimer = {
	    now:     now,
	    request: requestAnimationFrame.bind(window),
	    cancel:  cancelAnimationFrame.bind(window)
	};


	// Stream timer

	function StreamTimer(stream) {
	    var timer = this;
	    var fns0  = [];
	    var fns1  = [];
	    this.fns = fns0;

	    stream.each(function() {
	        timer.fns = fns1;
	        fns0.reduce(call$1, undefined);
	        fns0.length = 0;
	        fns1 = fns0;
	        fns0 = timer.fns;
	    });
	}

	assign$1(StreamTimer.prototype, {
	    request: function(fn) {
	        this.fns.push(fn);
	        return fn;
	    },

	    cancel: function(fn) {
	        remove(this.fns, fn);
	    }
	});


	// Stream.throttle

	function schedule() {
	    var timer   = this.timer;

	    this.queue = noop$1;
	    this.ref   = timer.request(this.update);
	}

	function ThrottleSource(notify, stop, timer) {
	    var source   = this;

	    this._stop   = stop;
	    this.timer   = timer;
	    this.queue   = schedule;
	    this.update  = function update() {
	        source.queue = schedule;
	        notify('push');
	    };
	}

	assign$1(ThrottleSource.prototype, {
	    shift: function shift() {
	        var value = this.value;
	        this.value = undefined;
	        return value;
	    },

	    stop: function stop(callLast) {
	        var timer = this.timer;

	        // An update is queued
	        if (this.queue === noop$1) {
	            timer.cancel && timer.cancel(this.ref);
	            this.ref = undefined;
	        }

	        // Don't permit further changes to be queued
	        this.queue = noop$1;

	        // If there is an update queued apply it now
	        // Hmmm. This is weird semantics. TODO: callLast should
	        // really be an 'immediate' flag, no?
	        this._stop(this.value !== undefined && callLast ? 1 : 0);
	    },

	    push: function throttle() {
	        // Store the latest value
	        this.value = arguments[arguments.length - 1];

	        // Queue the update
	        this.queue();
	    }
	});

	Stream$1.throttle = function(timer) {
	    if (typeof timer === 'function') {
	        throw new Error('Dont accept request and cancel functions anymore');
	    }

	    timer = typeof timer === 'number' ?
	        new Timer(timer) :
	    timer instanceof Stream$1 ?
	        new StreamTimer(timer) :
	    timer ? timer :
	        frameTimer ;

	    return new Stream$1(function(notify, stop) {
	        return new ThrottleSource(notify, stop, timer);
	    });
	};



	function ClockSource(notify, stop, options) {
	    // requestAnimationFrame/cancelAnimationFrame cannot be invoked
	    // with context, so need to be referenced.

	    var source  = this;
	    var request = options.request;

	    function frame(time) {
	        source.value = time;
	        notify('push');
	        source.value = undefined;
	        source.id    = request(frame);
	    }

	    this.cancel = options.cancel || noop$1;
	    this.end    = stop;

	    // Start clock
	    this.id = request(frame);
	}

	assign$1(ClockSource.prototype, {
	    shift: function shift() {
	        var value = this.value;
	        this.value = undefined;
	        return value;
	    },

	    stop: function stop() {
	        var cancel = this.cancel;
	        cancel(this.id);
	        this.end();
	    }
	});

	Stream$1.clock = function ClockStream(options) {
	    var timer = typeof options === 'number' ?
	        new Timer(options) :
	        options || frameTimer ;

	    return new Stream$1(ClockSource, timer);
	};


	// Stream Methods

	Stream$1.prototype = assign$1(Object.create(Fn$1.prototype), {
	    clone: function() {
	        var source  = this;
	        var shift   = this.shift;
	        var buffer1 = [];
	        var buffer2 = [];

	        var stream  = new Stream$1(function setup(notify, stop) {
	            var buffer = buffer2;

	            source.on('push', notify);

	            return {
	                shift: function() {
	                    if (buffer.length) { return buffer.shift(); }
	                    var value = shift();

	                    if (value !== undefined) { buffer1.push(value); }
	                    else if (source.status === 'done') {
	                        stop(0);
	                        source.off('push', notify);
	                    }

	                    return value;
	                },

	                stop: function() {
	                    var value;

	                    // Flush all available values into buffer
	                    while ((value = shift()) !== undefined) {
	                        buffer.push(value);
	                        buffer1.push(value);
	                    }

	                    stop(buffer.length);
	                    source.off('push', notify);
	                }
	            };
	        });

	        this.then(stream.stop);

	        this.shift = function() {
	            if (buffer1.length) { return buffer1.shift(); }
	            var value = shift();
	            if (value !== undefined && stream.status !== 'done') { buffer2.push(value); }
	            return value;
	        };

	        return stream;
	    },

	    combine: function(fn, source) {
	        return Stream$1.Combine(fn, this, source);
	    },

	    merge: function() {
	        var sources = toArray$1(arguments);
	        sources.unshift(this);
	        return Stream$1.Merge.apply(null, sources);
	    },

	    choke: function(time) {
	        return this.pipe(Stream$1.Choke(time));
	    },

	    throttle: function(timer) {
	        return this.pipe(Stream$1.throttle(timer));
	    },

	    clock: function(timer) {
	        return this.pipe(Stream$1.clock(timer));
	    },


	    // Consume

	    each: function(fn) {
	        var args   = arguments;
	        var source = this;

	        // Flush and observe
	        Fn$1.prototype.each.apply(source, args);

	        return this.on('push', function each$$1() {
	            // Delegate to Fn#each().
	            Fn$1.prototype.each.apply(source, args);
	        });
	    },

	    pipe: function(stream) {
	        this.each(stream.push);
	        return Fn$1.prototype.pipe.apply(this, arguments);
	    },


	    // Events

	    on: function(type, fn) {
	        var events = this[$events];
	        if (!events) { return this; }

	        var listeners = events[type] || (events[type] = []);
	        listeners.push(fn);
	        return this;
	    },

	    off: function off(type, fn) {
	        var events = this[$events];
	        if (!events) { return this; }

	        // Remove all handlers for all types
	        if (arguments.length === 0) {
	            Object.keys(events).forEach(off, this);
	            return this;
	        }

	        var listeners = events[type];
	        if (!listeners) { return; }

	        // Remove all handlers for type
	        if (!fn) {
	            delete events[type];
	            return this;
	        }

	        // Remove handler fn for type
	        var n = listeners.length;
	        while (n--) {
	            if (listeners[n] === fn) { listeners.splice(n, 1); }
	        }

	        return this;
	    }
	});

	function set(key, object, value) {
	    return typeof object.set === "function" ?
	        object.set(key, value) :
	        (object[key] = value) ;
	}

	var rpath  = /\[?([-\w]+)(?:=(['"])([^\2]+)\2|(true|false)|((?:\d*\.)?\d+))?\]?\.?/g;

	function findByProperty(key, value, array) {
	    var l = array.length;
	    var n = -1;

	    while (++n < l) {
	        if (array[n][key] === value) {
	            return array[n];
	        }
	    }
	}


	/* Get path */

	function getRegexPathThing(regex, path, object, fn) {
	    var tokens = regex.exec(path);

	    if (!tokens) {
	        throw new Error('Fn.getPath(path, object): invalid path "' + path + '"');
	    }

	    var key      = tokens[1];
	    var property = tokens[3] ?
	        findByProperty(key,
	            tokens[2] ? tokens[3] :
	            tokens[4] ? Boolean(tokens[4]) :
	            parseFloat(tokens[5]),
	        object) :
	        object[key] ;

	    return fn(regex, path, property);
	}

	function getRegexPath(regex, path, object) {
	    return regex.lastIndex === path.length ?
	        object :
	    !(object && typeof object === 'object') ?
	        undefined :
	    getRegexPathThing(regex, path, object, getRegexPath) ;
	}

	function getPath(path, object) {
	    rpath.lastIndex = 0;
	    return getRegexPath(rpath, path, object) ;
	}


	/* Set path */

	function setRegexPath(regex, path, object, thing) {
	    var tokens = regex.exec(path);

	    if (!tokens) {
	        throw new Error('Fn.getPath(path, object): invalid path "' + path + '"');
	    }

	    var key = tokens[1];

	    if (regex.lastIndex === path.length) {
	        // Cannot set to [prop=value] selector
	        if (tokens[3]) {
	            throw new Error('Fn.setPath(path, object): invalid path "' + path + '"');
	        }

	        return object[key] = thing;
	    }

	    var value = tokens[3] ?
	        findByProperty(key,
	            tokens[2] ? tokens[3] :
	            tokens[4] ? Boolean(tokens[4]) :
	            parseFloat(tokens[5])
	        ) :
	        object[key] ;

	    if (!(value && typeof value === 'object')) {
	        value = {};

	        if (tokens[3]) {
	            if (object.push) {
	                value[key] = tokens[2] ?
	                    tokens[3] :
	                    parseFloat(tokens[3]) ;

	                object.push(value);
	            }
	            else {
	                throw new Error('Not supported');
	            }
	        }

	        set(key, object, value);
	    }

	    return setRegexPath(regex, path, value, thing);
	}

	function setPath(path, object, value) {
	    rpath.lastIndex = 0;
	    return setRegexPath(rpath, path, object, value);
	}

	const Observable = window.Observable;

	function equals(a, b) {
	    // Fast out if references are for the same object
	    if (a === b) { return true; }

	    // Or if values are not objects
	    if (a === null ||
	        b === null ||
	        typeof a !== 'object' ||
	        typeof b !== 'object') {
	        return false;
	    }

	    var akeys = Object.keys(a);
	    var bkeys = Object.keys(b);

	    // Are their enumerable keys different?
	    if (akeys.length !== bkeys.length) { return false; }

	    var n = akeys.length;

	    while (n--) {
	        if (!equals(a[akeys[n]], b[akeys[n]])) {
	            return false;
	        }
	    }

	    return true;
	}

	function get(key, object) {
	    // Todo? Support WeakMaps and Maps and other map-like objects with a
	    // get method - but not by detecting the get method
	    const value = object[key];

	    // Why are we protecting against null again? To innoculate ourselves
	    // against DOM nodes?
	    return value === null ? undefined : value ;
	}

	var _is = Object.is || function is(a, b) { return a === b; };

	function invoke(name, values, object) {
	    return object[name].apply(object, values);
	}

	function distribute(fns, object, data) {
	    var n = -1;

	    while (++n < data.length) {
	        if (data[n] !== undefined && fns[n]) {
	            object = fns[n](object, data[n], data);
	        }
	    }

	    return object;
	}

	var _parse = curry$1(function parse(regex, fns, output, string) {
	    var data;

	    if (typeof string !== 'string') {
	        data   = string;
	        string = data.input.slice(data.index + data[0].length);
	    }

	    var result = regex.exec(string);

	    if (!result) {
	        throw new Error('Sparky: unable to parse "' + string + '" with ' + regex);
	    }

	    output = distribute(fns, output, result);

	    // Call the close fn
	    if (fns.close) {
	        output = fns.close(output, result);
	    }

	    // Update outer result's index
	    if (data) {
	        data.index += result.index + result[0].length;
	    }

	    return output;
	});

	const N     = Number.prototype;
	const isNaN = Number.isNaN;

	function toFixed(n, value) {
	    if (isNaN(value)) {
	        throw new Error('Fn.toFixed does not accept NaN.');
	    }

	    return N.toFixed.call(value, n);
	}

	function remove$1(array, value) {
	    if (array.remove) { array.remove(value); }
	    var i = array.indexOf(value);
	    if (i !== -1) { array.splice(i, 1); }
	}

	function take(i, object) {
	    if (object.slice) { return object.slice(0, i); }
	    if (object.take)  { return object.take(i); }

	    var a = [];
	    var n = i;
	    while (n--) { a[n] = object[n]; }
	    return a;
	}

	const assign$2 = Object.assign;

	function update(fn, target, array) {
	    return array.reduce(function(target, obj2) {
	        var obj1 = target.find(compose(is(fn(obj2)), fn));
	        if (obj1) {
	            assign$2(obj1, obj2);
	        }
	        else {
	            insert(fn, target, obj2);
	        }
	        return target;
	    }, target);
	}

	function diff(array, object) {
	    var values = toArray$1(array);

	    return filter(function(value) {
	        var i = values.indexOf(value);
	        if (i === -1) { return true; }
	        values.splice(i, 1);
	        return false;
	    }, object)
	    .concat(values);
	}

	function intersect(array, object) {
	    var values = toArray$1(array);

	    return filter(function(value) {
	        var i = values.indexOf(value);
	        if (i === -1) { return false; }
	        values.splice(i, 1);
	        return true;
	    }, object);
	}

	function unite(array, object) {
	    var values = toArray(array);

	    return map(function(value) {
	        var i = values.indexOf(value);
	        if (i > -1) { values.splice(i, 1); }
	        return value;
	    }, object)
	    .concat(values);
	}

	function append$1(string1, string2) {
	    return '' + string2 + string1;
	}

	function prepend$1(string1, string2) {
	    return '' + string1 + string2;
	}

	function prepad(chars, n, value) {
	    var string = value + '';
	    var i = -1;
	    var pre = '';

	    while (pre.length < n - string.length) {
	        pre += chars[++i % chars.length];
	    }

	    string = pre + string;
	    return string.slice(string.length - n);
	}

	function postpad(chars, n, value) {
	    var string = value + '';

	    while (string.length < n) {
	        string = string + chars;
	    }

	    return string.slice(0, n);
	}

	// Constant for converting radians to degrees
	const angleFactor = 180 / Math.PI;

	function add(a, b)  { return b + a; }function multiply(a, b) { return b * a; }function min(a, b)  { return a > b ? b : a ; }function max(a, b)  { return a < b ? b : a ; }function pow(n, x)  { return Math.pow(x, n); }function exp(n, x)  { return Math.pow(n, x); }function log(n, x)  { return Math.log(x) / Math.log(n); }function root(n, x) { return Math.pow(x, 1/n); }
	function mod(d, n) {
	    // JavaScript's modulu operator % uses Euclidean division, but for
	    // stuff that cycles through 0 the symmetrics of floored division
	    // are more useful.
	    // https://en.wikipedia.org/wiki/Modulo_operation
	    var value = n % d;
	    return value < 0 ? value + d : value ;
	}
	function limit(min, max, n) {
	    return n > max ? max : n < min ? min : n ;
	}
	function wrap(min, max, n) {
	    return (n < min ? max : min) + (n - min) % (max - min);
	}
	function gcd(a, b) {
	    // Greatest common divider
	    return b ? gcd(b, a % b) : a ;
	}
	function lcm(a, b) {
	    // Lowest common multiple.
	    return a * b / gcd(a, b);
	}
	function factorise(n, d) {
	    // Reduce a fraction by finding the Greatest Common Divisor and
	    // dividing by it.
	    var f = gcd(n, d);
	    return [n/f, d/f];
	}

	function normalise(min, max, n) {
	    return (n - min) / (max - min);
	}

	function denormalise(min, max, n) { return n * (max - min) + min; }

	// Exponential functions
	//
	// e - exponent
	// x - range 0-1
	//
	// eg.
	// var easeInQuad   = exponential(2);
	// var easeOutCubic = exponentialOut(3);
	// var easeOutQuart = exponentialOut(4);

	function exponentialOut(e, x) {
	    return 1 - Math.pow(1 - x, e);
	}

	// Cubic bezier function (originally translated from
	// webkit source by Christian Effenberger):
	// http://www.netzgesta.de/dev/cubic-bezier-timing-function.html


	function sampleCubicBezier(a, b, c, t) {
	    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
	    return ((a * t + b) * t + c) * t;
	}

	function sampleCubicBezierDerivative(a, b, c, t) {
	    return (3 * a * t + 2 * b) * t + c;
	}

	function solveCubicBezierX(a, b, c, x, epsilon) {
	    // Solve x for a cubic bezier
	    var x2, d2, i;
	    var t2 = x;

	    // First try a few iterations of Newton's method -- normally very fast.
	    for(i = 0; i < 8; i++) {
	        x2 = sampleCubicBezier(a, b, c, t2) - x;
	        if (Math.abs(x2) < epsilon) {
	            return t2;
	        }
	        d2 = sampleCubicBezierDerivative(a, b, c, t2);
	        if (Math.abs(d2) < 1e-6) {
	            break;
	        }
	        t2 = t2 - x2 / d2;
	    }

	    // Fall back to the bisection method for reliability.
	    var t0 = 0;
	    var t1 = 1;

	    t2 = x;

	    if(t2 < t0) { return t0; }
	    if(t2 > t1) { return t1; }

	    while(t0 < t1) {
	        x2 = sampleCubicBezier(a, b, c, t2);
	        if(Math.abs(x2 - x) < epsilon) {
	            return t2;
	        }
	        if (x > x2) { t0 = t2; }
	        else { t1 = t2; }
	        t2 = (t1 - t0) * 0.5 + t0;
	    }

	    // Failure.
	    return t2;
	}

	function cubicBezier(p1, p2, duration, x) {
	    // The epsilon value to pass given that the animation is going
	    // to run over duruation seconds. The longer the animation, the
	    // more precision is needed in the timing function result to
	    // avoid ugly discontinuities.
	    var epsilon = 1 / (200 * duration);

	    // Calculate the polynomial coefficients. Implicit first and last
	    // control points are (0,0) and (1,1).
	    var cx = 3 * p1[0];
	    var bx = 3 * (p2[0] - p1[0]) - cx;
	    var ax = 1 - cx - bx;
	    var cy = 3 * p1[1];
	    var by = 3 * (p2[1] - p1[1]) - cy;
	    var ay = 1 - cy - by;

	    var y = solveCubicBezierX(ax, bx, cx, x, epsilon);
	    return sampleCubicBezier(ay, by, cy, y);
	}

	function rangeLog(min, max, n) {
	    return denormalise(min, max, Math.log(n / min) / Math.log(max / min));
	}

	function rangeLogInv(min, max, n) {
	    return min * Math.pow(max / min, normalise(min, max, n));
	}

	function createOrdinals(ordinals) {
		var array = [], n = 0;

		while (n++ < 31) {
			array[n] = ordinals[n] || ordinals.n;
		}

		return array;
	}

	var langs = {
		'en': {
			days:     ('Sunday Monday Tuesday Wednesday Thursday Friday Saturday').split(' '),
			months:   ('January February March April May June July August September October November December').split(' '),
			ordinals: createOrdinals({ n: 'th', 1: 'st', 2: 'nd', 3: 'rd', 21: 'st', 22: 'nd', 23: 'rd', 31: 'st' })
		},

		'fr': {
			days:     ('dimanche lundi mardi mercredi jeudi vendredi samedi').split(' '),
			months:   ('janvier février mars avril mai juin juillet août septembre octobre novembre décembre').split(' '),
			ordinals: createOrdinals({ n: "ième", 1: "er" })
		},

		'de': {
			days:     ('Sonntag Montag Dienstag Mittwoch Donnerstag Freitag Samstag').split(' '),
			months:   ('Januar Februar März April Mai Juni Juli Oktober September Oktober November Dezember').split(' '),
			ordinals: createOrdinals({ n: "er" })
		},

		'it': {
			days:     ('domenica lunedì martedì mercoledì giovedì venerdì sabato').split(' '),
			months:   ('gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre').split(' '),
			ordinals: createOrdinals({ n: "o" })
		}
	};


	// Date string parsing
	//
	// Don't parse date strings with the JS Date object. It has variable
	// time zone behaviour. Set up our own parsing.
	//
	// Accept BC dates by including leading '-'.
	// (Year 0000 is 1BC, -0001 is 2BC.)
	// Limit months to 01-12
	// Limit dates to 01-31

	var rdate     = /^(-?\d{4})(?:-(0[1-9]|1[012])(?:-(0[1-9]|[12]\d|3[01])(?:T([01]\d|2[0-3])(?::([0-5]\d)(?::([0-5]\d)(?:.(\d+))?)?)?)?)?)?([+-]([01]\d|2[0-3]):?([0-5]\d)?|Z)?$/;
	//                sign   year        month       day               T or -
	var rdatediff = /^([+-])?(\d{2,})(?:-(\d{2,})(?:-(\d{2,}))?)?(?:([T-])|$)/;

	var parseDate = overload(toType, {
		number:  secondsToDate,
		string:  exec(rdate, createDate),
		object:  function(date) {
			return isValidDate(date) ? date : undefined ;
		},
		default: noop$1
	});

	var parseDateLocal = overload(toType, {
		number:  secondsToDate,
		string:  exec(rdate, createDateLocal),
		object:  function(date) {
			return date instanceof Date ? date : undefined ;
		},
		default: noop$1
	});

	function isValidDate(date) {
		return toClass(date) === "Date" && !Number.isNaN(date.getTime()) ;
	}

	function createDate(match, year, month, day, hour, minute, second, ms, zone, zoneHour, zoneMinute) {
		// Month must be 0-indexed for the Date constructor
		month = parseInt(month, 10) - 1;

		var date = new Date(
			ms ?     Date.UTC(year, month, day, hour, minute, second, ms) :
			second ? Date.UTC(year, month, day, hour, minute, second) :
			minute ? Date.UTC(year, month, day, hour, minute) :
			hour ?   Date.UTC(year, month, day, hour) :
			day ?    Date.UTC(year, month, day) :
			month ?  Date.UTC(year, month) :
			Date.UTC(year)
		);

		if (zone && (zoneHour !== '00' || (zoneMinute !== '00' && zoneMinute !== undefined))) {
			setTimeZoneOffset(zone[0], zoneHour, zoneMinute, date);
		}

		return date;
	}

	function createDateLocal(year, month, day, hour, minute, second, ms, zone) {
		if (zone) {
			throw new Error('Time.parseDateLocal() will not parse a string with a time zone "' + zone + '".');
		}

		// Month must be 0-indexed for the Date constructor
		month = parseInt(month, 10) - 1;

		return ms ?  new Date(year, month, day, hour, minute, second, ms) :
			second ? new Date(year, month, day, hour, minute, second) :
			minute ? new Date(year, month, day, hour, minute) :
			hour ?   new Date(year, month, day, hour) :
			day ?    new Date(year, month, day) :
			month ?  new Date(year, month) :
			new Date(year) ;
	}

	function exec(regex, fn, error) {
		return function exec(string) {
			var parts = regex.exec(string);
			if (!parts && error) { throw error; }
			return parts ?
				fn.apply(null, parts) :
				undefined ;
		};
	}

	function secondsToDate(n) {
		return new Date(secondsToMilliseconds(n));
	}

	function setTimeZoneOffset(sign, hour, minute, date) {
		if (sign === '+') {
			date.setUTCHours(date.getUTCHours() - parseInt(hour, 10));
			if (minute) {
				date.setUTCMinutes(date.getUTCMinutes() - parseInt(minute, 10));
			}
		}
		else if (sign === '-') {
			date.setUTCHours(date.getUTCHours() + parseInt(hour, 10));
			if (minute) {
				date.setUTCMinutes(date.getUTCMinutes() + parseInt(minute, 10));
			}
		}

		return date;
	}



	// Date object formatting
	//
	// Use the internationalisation methods for turning a date into a UTC or
	// locale string, the date object for turning them into a local string.

	var dateFormatters = {
		YYYY: function(date)       { return ('000' + date.getFullYear()).slice(-4); },
		YY:   function(date)       { return ('0' + date.getFullYear() % 100).slice(-2); },
		MM:   function(date)       { return ('0' + (date.getMonth() + 1)).slice(-2); },
		MMM:  function(date, lang) { return this.MMMM(date, lang).slice(0,3); },
		MMMM: function(date, lang) { return langs[lang || Time.lang].months[date.getMonth()]; },
		D:    function(date)       { return '' + date.getDate(); },
		DD:   function(date)       { return ('0' + date.getDate()).slice(-2); },
		ddd:  function(date, lang) { return this.dddd(date, lang).slice(0,3); },
		dddd: function(date, lang) { return langs[lang || Time.lang].days[date.getDay()]; },
		hh:   function(date)       { return ('0' + date.getHours()).slice(-2); },
		//hh:   function(date)       { return ('0' + date.getHours() % 12).slice(-2); },
		mm:   function(date)       { return ('0' + date.getMinutes()).slice(-2); },
		ss:   function(date)       { return ('0' + date.getSeconds()).slice(-2); },
		sss:  function(date)       { return (date.getSeconds() + date.getMilliseconds() / 1000 + '').replace(/^\d\.|^\d$/, function($0){ return '0' + $0; }); },
		ms:   function(date)       { return '' + date.getMilliseconds(); },

		// Experimental
		am:   function(date) { return date.getHours() < 12 ? 'am' : 'pm'; },
		zz:   function(date) {
			return (date.getTimezoneOffset() < 0 ? '+' : '-') +
				 ('0' + Math.round(100 * Math.abs(date.getTimezoneOffset()) / 60)).slice(-4) ;
		},
		th:   function(date, lang) { return langs[lang || Time.lang].ordinals[date.getDate()]; },
		n:    function(date) { return +date; },
		ZZ:   function(date) { return -date.getTimezoneOffset() * 60; }
	};

	var componentFormatters = {
		YYYY: function(data)       { return data.year; },
		YY:   function(data)       { return ('0' + data.year).slice(-2); },
		MM:   function(data)       { return data.month; },
		MMM:  function(data, lang) { return this.MMMM(data, lang).slice(0,3); },
		MMMM: function(data, lang) { return langs[lang].months[data.month - 1]; },
		D:    function(data)       { return parseInt(data.day, 10) + ''; },
		DD:   function(data)       { return data.day; },
		ddd:  function(data)       { return data.weekday.slice(0,3); },
		dddd: function(data, lang) { return data.weekday; },
		hh:   function(data)       { return data.hour; },
		//hh:   function(data)       { return ('0' + data.hour % 12).slice(-2); },
		mm:   function(data)       { return data.minute; },
		ss:   function(data)       { return data.second; },
		//sss:  function(data)       { return (date.second + date.getMilliseconds() / 1000 + '').replace(/^\d\.|^\d$/, function($0){ return '0' + $0; }); },
		//ms:   function(data)       { return '' + date.getMilliseconds(); },
	};

	var componentKeys = {
		// Components, in order of appearance in the locale string
		'en-US': ['weekday', 'month', 'day', 'year', 'hour', 'minute', 'second'],
		// fr: "lundi 12/02/2018 à 18:54:09" (different in IE/Edge, of course)
		// de: "Montag, 12.02.2018, 19:28:39" (different in IE/Edge, of course)
		default: ['weekday', 'day', 'month', 'year', 'hour', 'minute', 'second']
	};

	var options = {
		// Time zone
		timeZone:      'UTC',
		// Use specified locale matcher
		formatMatcher: 'basic',
		// Use 24 hour clock
		hour12:        false,
		// Format string components
		weekday:       'long',
		year:          'numeric',
		month:         '2-digit',
		day:           '2-digit',
		hour:          '2-digit',
		minute:        '2-digit',
		second:        '2-digit',
		//timeZoneName:  'short'
	};

	var rtoken    = /([YZMDdhmswz]{2,4}|\+-)/g;
	var rusdate   = /\w{3,}|\d+/g;
	var rdatejson = /^"(-?\d{4,}-\d\d-\d\d)/;

	function matchEach(regex, fn, text) {
		var match = regex.exec(text);

		return match ? (
			fn.apply(null, match),
			matchEach(regex, fn, text)
		) :
		undefined ;
	}

	function toLocaleString(timezone, locale, date) {
		options.timeZone = timezone || 'UTC';
		var string = date.toLocaleString(locale, options);
		return string;
	}

	function toLocaleComponents(timezone, locale, date) {
		var localedate = toLocaleString(timezone, locale, date);
		var components = {};
		var keys       = componentKeys[locale] || componentKeys.default;
		var i          = 0;

		matchEach(rusdate, function(value) {
			components[keys[i++]] = value;
		}, localedate);

		return components;
	}

	function _formatDate(string, timezone, locale, date) {
		// Derive lang from locale
		var lang = locale ? locale.slice(0,2) : document.documentElement.lang ;

		// Todo: only en-US and fr supported for the time being
		locale = locale === 'en' ? 'en-US' :
			locale ? locale :
			'en-US';

		var data    = toLocaleComponents(timezone, locale, date);
		var formats = componentFormatters;

		return string.replace(rtoken, function($0) {
			return formats[$0] ? formats[$0](data, lang) : $0 ;
		});
	}

	function formatDateLocal(string, locale, date) {
		var formatters = dateFormatters;
		var lang = locale.slice(0, 2);

		// Use date formatters to get time as current local time
		return string.replace(rtoken, function($0) {
			return formatters[$0] ? formatters[$0](date, lang) : $0 ;
		});
	}

	function formatDateISO(date) {
		return rdatejson.exec(JSON.stringify(parseDate(date)))[1];
	}


	// Time operations

	var days   = {
		mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0
	};

	var dayMap = [6,0,1,2,3,4,5];

	function toDay(date) {
		return dayMap[date.getDay()];
	}

	function cloneDate(date) {
		return new Date(+date);
	}

	function addDateComponents(sign, yy, mm, dd, date) {
		date.setUTCFullYear(date.getUTCFullYear() + sign * parseInt(yy, 10));

		if (!mm) { return; }

		// Adding and subtracting months can give weird results with the JS
		// date object. For example, taking a montha way from 2018-03-31 results
		// in 2018-03-03 (or the 31st of February), whereas adding a month on to
		// 2018-05-31 results in the 2018-07-01 (31st of June).
		//
		// To mitigate this weirdness track the target month and roll days back
		// until the month is correct, like Python's relativedelta utility:
		// https://dateutil.readthedocs.io/en/stable/relativedelta.html#examples
		var month       = date.getUTCMonth();
		var monthDiff   = sign * parseInt(mm, 10);
		var monthTarget = mod(12, month + monthDiff);

		date.setUTCMonth(month + monthDiff);

		// If the month is too far in the future scan backwards through
		// months until it fits. Setting date to 0 means setting to last
		// day of previous month.
		while (date.getUTCMonth() > monthTarget) { date.setUTCDate(0); }

		if (!dd) { return; }

		date.setUTCDate(date.getUTCDate() + sign * parseInt(dd, 10));
	}

	function _addDate(duration, date) {
		// Don't mutate the original date
		date = cloneDate(date);

		// First parse the date portion duration and add that to date
		var tokens = rdatediff.exec(duration) ;
		var sign = 1;

		if (tokens) {
			sign = tokens[1] === '-' ? -1 : 1 ;
			addDateComponents(sign, tokens[2], tokens[3], tokens[4], date);

			// If there is no 'T' separator go no further
			if (!tokens[5]) { return date; }

			// Prepare duration for time parsing
			duration = duration.slice(tokens[0].length);

			// Protect against parsing a stray sign before time
			if (duration[0] === '-') { return date; }
		}

		// Then parse the time portion and add that to date
		var time = parseTimeDiff(duration);
		if (time === undefined) { return; }

		date.setTime(date.getTime() + sign * time * 1000);
		return date;
	}

	function diff$1(t, d1, d2) {
		var y1 = d1.getUTCFullYear();
		var m1 = d1.getUTCMonth();
		var y2 = d2.getUTCFullYear();
		var m2 = d2.getUTCMonth();

		if (y1 === y2 && m1 === m2) {
			return t + d2.getUTCDate() - d1.getUTCDate() ;
		}

		t += d2.getUTCDate() ;

		// Set to last date of previous month
		d2.setUTCDate(0);
		return diff$1(t, d1, d2);
	}

	function _diffDateDays(date1, date2) {
		var d1 = parseDate(date1);
		var d2 = parseDate(date2);

		return d2 > d1 ?
			// 3rd argument mutates, so make sure we get a clean date if we
			// have not just made one.
			diff$1(0, d1, d2 === date2 || d1 === d2 ? cloneDate(d2) : d2) :
			diff$1(0, d2, d1 === date1 || d2 === d1 ? cloneDate(d1) : d1) * -1 ;
	}

	function floorDateByGrain(grain, date) {
		var diff, week;

		if (grain === 'ms') { return date; }

		date.setUTCMilliseconds(0);
		if (grain === 'second') { return date; }

		date.setUTCSeconds(0);
		if (grain === 'minute') { return date; }

		date.setUTCMinutes(0);
		if (grain === 'hour') { return date; }

		date.setUTCHours(0);
		if (grain === 'day') { return date; }

		if (grain === 'week') {
			date.setDate(date.getDate() - toDay(date));
			return date;
		}

		if (grain === 'fortnight') {
			week = floorDateByDay(1, new Date());
			diff = mod(14, _diffDateDays(week, date));
			date.setUTCDate(date.getUTCDate() - diff);
			return date;
		}

		date.setUTCDate(1);
		if (grain === 'month') { return date; }

		date.setUTCMonth(0);
		if (grain === 'year') { return date; }

		date.setUTCFullYear(0);
		return date;
	}

	function floorDateByDay(day, date) {
		var currentDay = date.getUTCDay();

		// If we are on the specified day, return this date
		if (day === currentDay) { return date; }

		var diff = currentDay - day;
		if (diff < 0) { diff = diff + 7; }
		return _addDate('-0000-00-0' + diff, date);
	}

	function _floorDate(grain, date) {
		// Clone date before mutating it
		date = cloneDate(date);

		// Take a day string or number, find the last matching day
		var day = typeof grain === 'number' ?
			grain :
			days[grain] ;

		return isDefined(day) ?
			floorDateByDay(day, date) :
			floorDateByGrain(grain, date) ;
	}

	const addDate = curry$1(function(diff, date) {
		return _addDate(diff, parseDate(date));
	});

	const diffDateDays = curry$1(_diffDateDays);

	const floorDate = curry$1(function(token, date) {
		return _floorDate(token, parseDate(date));
	});

	const formatDate = curry$1(function(string, timezone, locale, date) {
		return string === 'ISO' ?
			formatDateISO(parseDate(date)) :
		timezone === 'local' ?
			formatDateLocal(string, locale, date) :
		_formatDate(string, timezone, locale, parseDate(date)) ;
	});


	// Time

	// Decimal places to round to when comparing times
	var precision = 9;
	function minutesToSeconds(n) { return n * 60; }
	function hoursToSeconds(n) { return n * 3600; }

	function secondsToMilliseconds(n) { return n * 1000; }
	function secondsToMinutes(n) { return n / 60; }
	function secondsToHours(n) { return n / 3600; }
	function secondsToDays(n) { return n / 86400; }
	function secondsToWeeks(n) { return n / 604800; }

	function prefix(n) {
		return n >= 10 ? '' : '0';
	}

	// Hours:   00-23 - 24 should be allowed according to spec
	// Minutes: 00-59 -
	// Seconds: 00-60 - 60 is allowed, denoting a leap second

	//var rtime   = /^([+-])?([01]\d|2[0-3])(?::([0-5]\d)(?::([0-5]\d|60)(?:.(\d+))?)?)?$/;
	//                sign   hh       mm           ss
	var rtime     = /^([+-])?(\d{2,}):([0-5]\d)(?::((?:[0-5]\d|60)(?:.\d+)?))?$/;
	var rtimediff = /^([+-])?(\d{2,}):(\d{2,})(?::(\d{2,}(?:.\d+)?))?$/;

	var parseTime = overload(toType, {
		number:  id,
		string:  exec(rtime, createTime),
		default: function(object) {
			throw new Error('parseTime() does not accept objects of type ' + (typeof object));
		}
	});

	var parseTimeDiff = overload(toType, {
		number:  id,
		string:  exec(rtimediff, createTime),
		default: function(object) {
			throw new Error('parseTime() does not accept objects of type ' + (typeof object));
		}
	});

	var _floorTime = choose({
		week:   function(time) { return time - mod(604800, time); },
		day:    function(time) { return time - mod(86400, time); },
		hour:   function(time) { return time - mod(3600, time); },
		minute: function(time) { return time - mod(60, time); },
		second: function(time) { return time - mod(1, time); }
	});

	var timeFormatters = {
		'+-': function sign(time) {
			return time < 0 ? '-' : '' ;
		},

		www: function www(time) {
			time = time < 0 ? -time : time;
			var weeks = Math.floor(secondsToWeeks(time));
			return prefix(weeks) + weeks;
		},

		dd: function dd(time) {
			time = time < 0 ? -time : time;
			var days = Math.floor(secondsToDays(time));
			return prefix(days) + days;
		},

		hhh: function hhh(time) {
			time = time < 0 ? -time : time;
			var hours = Math.floor(secondsToHours(time));
			return prefix(hours) + hours;
		},

		hh: function hh(time) {
			time = time < 0 ? -time : time;
			var hours = Math.floor(secondsToHours(time % 86400));
			return prefix(hours) + hours;
		},

		mm: function mm(time) {
			time = time < 0 ? -time : time;
			var minutes = Math.floor(secondsToMinutes(time % 3600));
			return prefix(minutes) + minutes;
		},

		ss: function ss(time) {
			time = time < 0 ? -time : time;
			var seconds = Math.floor(time % 60);
			return prefix(seconds) + seconds ;
		},

		sss: function sss(time) {
			time = time < 0 ? -time : time;
			var seconds = time % 60;
			return prefix(seconds) + toMaxDecimals(precision, seconds);
		},

		ms: function ms(time) {
			time = time < 0 ? -time : time;
			var ms = Math.floor(secondsToMilliseconds(time % 1));
			return ms >= 100 ? ms :
				ms >= 10 ? '0' + ms :
				'00' + ms ;
		}
	};

	function createTime(match, sign, hh, mm, sss) {
		var time = hoursToSeconds(parseInt(hh, 10)) + (
			mm ? minutesToSeconds(parseInt(mm, 10)) + (
				sss ? parseFloat(sss, 10) : 0
			) : 0
		);

		return sign === '-' ? -time : time ;
	}

	function formatTimeString(string, time) {
		return string.replace(rtoken, function($0) {
			return timeFormatters[$0] ? timeFormatters[$0](time) : $0 ;
		}) ;
	}

	function _formatTimeISO(time) {
		var sign = time < 0 ? '-' : '' ;

		if (time < 0) { time = -time; }

		var hours = Math.floor(time / 3600);
		var hh = prefix(hours) + hours ;
		time = time % 3600;
		if (time === 0) { return sign + hh + ':00'; }

		var minutes = Math.floor(time / 60);
		var mm = prefix(minutes) + minutes ;
		time = time % 60;
		if (time === 0) { return sign + hh + ':' + mm; }

		var sss = prefix(time) + toMaxDecimals(precision, time);
		return sign + hh + ':' + mm + ':' + sss;
	}

	function toMaxDecimals(precision, n) {
		// Make some effort to keep rounding errors under control by fixing
		// decimals and lopping off trailing zeros
		return n.toFixed(precision).replace(/\.?0+$/, '');
	}

	const formatTime = curry$1(function(string, time) {
		return string === 'ISO' ?
			_formatTimeISO(parseTime(time)) :
			formatTimeString(string, parseTime(time)) ;
	});

	const addTime = curry$1(function(time1, time2) {
		return parseTime(time2) + parseTimeDiff(time1);
	});

	const subTime = curry$1(function(time1, time2) {
		return parseTime(time2) - parseTimeDiff(time1);
	});

	const diffTime = curry$1(function(time1, time2) {
		return parseTime(time1) - parseTime(time2);
	});

	const floorTime = curry$1(function(token, time) {
		return _floorTime(token, parseTime(time));
	});

	if (window.console && window.console.log) {
	    window.console.log('Fn          - https://github.com/stephband/fn');
	}
	const and     = curry$1(function and(a, b) { return !!(a && b); });
	const or      = curry$1(function or(a, b) { return a || b; });
	const xor     = curry$1(function or(a, b) { return (a || b) && (!!a !== !!b); });

	const assign$4      = curry$1(Object.assign, true, 2);
	const define      = curry$1(Object.defineProperties, true, 2);
	const equals$1      = curry$1(equals, true);
	const get$1         = curry$1(get, true);
	const is          = curry$1(_is, true);
	const invoke$1      = curry$1(invoke, true);
	const parse       = curry$1(_parse);
	const set$1         = curry$1(set, true);
	const toFixed$1     = curry$1(toFixed);
	const getPath$1     = curry$1(getPath, true);
	const setPath$1     = curry$1(setPath, true);

	const by$1          = curry$1(by, true);
	const byAlphabet$1  = curry$1(byAlphabet);

	const concat$1      = curry$1(concat, true);
	const contains$1    = curry$1(contains, true);
	const each$1        = curry$1(each, true);
	const filter$1      = curry$1(filter, true);
	const find$1        = curry$1(find, true);
	const insert$1      = curry$1(insert, true);
	const map$1         = curry$1(map, true);
	const reduce$1      = curry$1(reduce, true);
	const remove$2      = curry$1(remove$1, true);
	const rest$1        = curry$1(rest, true);
	const slice$1       = curry$1(slice, true, 3);
	const sort$1        = curry$1(sort, true);
	const take$1        = curry$1(take, true);
	const update$1      = curry$1(update, true);

	const diff$2        = curry$1(diff, true);
	const intersect$1   = curry$1(intersect, true);
	const unite$1       = curry$1(unite, true);

	const append$2      = curry$1(append$1);
	const prepend$2     = curry$1(prepend$1);
	const prepad$1      = curry$1(prepad);
	const postpad$1     = curry$1(postpad);

	const add$1         = curry$1(add);
	const multiply$1    = curry$1(multiply);
	const min$1         = curry$1(min);
	const max$1         = curry$1(max);
	const mod$1         = curry$1(mod);
	const pow$1         = curry$1(pow);
	const exp$1         = curry$1(exp);
	const log$1         = curry$1(log);
	const gcd$1         = curry$1(gcd);
	const lcm$1         = curry$1(lcm);
	const root$1        = curry$1(root);
	const limit$1       = curry$1(limit);
	const wrap$1        = curry$1(wrap);
	const factorise$1   = curry$1(factorise);
	const cubicBezier$1 = curry$1(cubicBezier);
	const normalise$1   = curry$1(normalise);
	const denormalise$1 = curry$1(denormalise);
	const exponentialOut$1 = curry$1(exponentialOut);
	const rangeLog$1    = curry$1(rangeLog);
	const rangeLogInv$1 = curry$1(rangeLogInv);

	function assignAttributes(node, attributes) {
		var names = Object.keys(attributes);
		var n = names.length;

		while (n--) {
			if (names[n] in node) {
				node[names[n]] = attributes[names[n]];
			}
			else {
				node.setAttribute(names[n], attributes[names[n]]);
			}
		}
	}

	var testDiv = document.createElement('div');

	var constructors = {
		text: function(text) {
			return document.createTextNode(text || '');
		},

		comment: function(text) {
			return document.createComment(text || '');
		},

		fragment: function(html) {
			var fragment = document.createDocumentFragment();

			if (html) {
				testDiv.innerHTML = html;
				append(fragment, testDiv.childNodes);
				testDiv.innerHTML = '';
			}

			return fragment;
		}
	};

	var svgs = [
		'circle',
		'ellipse',
		'g',
		'line',
		'rect',
		//'text',
		'use',
		'path',
		'polygon',
		'polyline',
		'svg'
	];

	svgs.forEach(function(tag) {
		constructors[tag] = function(attributes) {
			var node = document.createElementNS(svgNamespace, tag);
			if (attributes) { setSVGAttributes(node, attributes); }
			return node;
		};
	});

	function setSVGAttributes(node, attributes) {
		var names = Object.keys(attributes);
		var n = names.length;

		while (n--) {
			node.setAttributeNS(null, names[n], attributes[names[n]]);
		}
	}

	function create$1(tag, attributes) {
		// create(type)
		// create(type, text)
		// create(type, attributes)

		var object;

		if (typeof tag === 'string') {
			if (constructors[tag]) {
				return constructors[tag](attributes);
			}
		}
		else {
			object = tag;
			tag = object.tagName;
			delete object.tagName;
		}

		const node = document.createElement(tag);

		if (!object) { return node; }

		assignAttributes(node, object);

		if (!attributes) { return node; }

		if (typeof attributes === 'string') {
			node.innerHTML = attributes;
		}
		else {
			assignAttributes(node, attributes);
		}

		return node;
	}

	const prefixes = ['Khtml','O','Moz','Webkit','ms'];

	var node = document.createElement('div');
	var cache$1 = {};

	function testPrefix(prop) {
	    if (prop in node.style) { return prop; }

	    var upper = prop.charAt(0).toUpperCase() + prop.slice(1);
	    var l = prefixes.length;
	    var prefixProp;

	    while (l--) {
	        prefixProp = prefixes[l] + upper;

	        if (prefixProp in node.style) {
	            return prefixProp;
	        }
	    }

	    return false;
	}

	function prefix$1(prop){
	    return cache$1[prop] || (cache$1[prop] = testPrefix(prop));
	}

	var styleParsers = {
		"transform:translateX": function(node) {
			var matrix = computedStyle('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			return parseFloat(values[4]);
		},

		"transform:translateY": function(node) {
			var matrix = computedStyle('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			return parseFloat(values[5]);
		},

		"transform:scale": function(node) {
			var matrix = computedStyle('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			var a = parseFloat(values[0]);
			var b = parseFloat(values[1]);
			return Math.sqrt(a * a + b * b);
		},

		"transform:rotate": function(node) {
			var matrix = computedStyle('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			var a = parseFloat(values[0]);
			var b = parseFloat(values[1]);
			return Math.atan2(b, a);
		}
	};

	function valuesFromCssFn(string) {
		return string.split('(')[1].split(')')[0].split(/\s*,\s*/);
	}

	function computedStyle(name, node) {
		return window.getComputedStyle ?
			window
			.getComputedStyle(node, null)
			.getPropertyValue(name) :
			0 ;
	}

	function style(name, node) {
	    // If name corresponds to a custom property name in styleParsers...
	    if (styleParsers[name]) { return styleParsers[name](node); }

	    var value = computedStyle(name, node);

	    // Pixel values are converted to number type
	    return typeof value === 'string' && rpx.test(value) ?
	        parseFloat(value) :
	        value ;
	}

	var Node        = window.Node;
	var SVGElement  = window.SVGElement;
	var CustomEvent = window.CustomEvent;

	var assign$6      = Object.assign;
	var define$1      = Object.defineProperties;

	var A$4            = Array.prototype;
	var rspaces      = /\s+/;


	// Features

	var features = define$1({
		events: define$1({}, {
			fullscreenchange: {
				get: cache(function() {
					// TODO: untested event names
					return ('fullscreenElement' in document) ? 'fullscreenchange' :
					('webkitFullscreenElement' in document) ? 'webkitfullscreenchange' :
					('mozFullScreenElement' in document) ? 'mozfullscreenchange' :
					('msFullscreenElement' in document) ? 'MSFullscreenChange' :
					'fullscreenchange' ;
				}),

				enumerable: true
			},

			transitionend: {
				// Infer transitionend event from CSS transition prefix

				get: cache(function() {
					var end = {
						KhtmlTransition: false,
						OTransition: 'oTransitionEnd',
						MozTransition: 'transitionend',
						WebkitTransition: 'webkitTransitionEnd',
						msTransition: 'MSTransitionEnd',
						transition: 'transitionend'
					};

					var prefixed = prefix$1('transition');
					return prefixed && end[prefixed];
				}),

				enumerable: true
			}
		})
	}, {
		inputEventsWhileDisabled: {
			// FireFox won't dispatch any events on disabled inputs:
			// https://bugzilla.mozilla.org/show_bug.cgi?id=329509

			get: cache(function() {
				var input     = document.createElement('input');
				var testEvent = Event('featuretest');
				var result    = false;

				document.body.appendChild(input);
				input.disabled = true;
				input.addEventListener('featuretest', function(e) { result = true; });
				input.dispatchEvent(testEvent);
				input.remove();

				return result;
			}),

			enumerable: true
		},

		template: {
			get: cache(function() {
				// Older browsers don't know about the content property of templates.
				return 'content' in document.createElement('template');
			}),

			enumerable: true
		},

		textareaPlaceholderSet: {
			// IE sets textarea innerHTML (but not value) to the placeholder
			// when setting the attribute and cloning and so on. The twats have
			// marked it "Won't fix":
			//
			// https://connect.microsoft.com/IE/feedback/details/781612/placeholder-text-becomes-actual-value-after-deep-clone-on-textarea

			get: cache(function() {
				var node = document.createElement('textarea');
				node.setAttribute('placeholder', '---');
				return node.innerHTML === '';
			}),

			enumerable: true
		},

		transition: {
			get: cache(function testTransition() {
				var prefixed = prefix$1('transition');
				return prefixed || false;
			}),

			enumerable: true
		},

		fullscreen: {
			get: cache(function testFullscreen() {
				var node = document.createElement('div');
				return !!(node.requestFullscreen ||
					node.webkitRequestFullscreen ||
					node.mozRequestFullScreen ||
					node.msRequestFullscreen);
			}),

			enumerable: true
		},

		// Deprecated

		transitionend: {
			get: function() {
				console.warn('dom.features.transitionend deprecated in favour of dom.features.events.transitionend.');
				return features.events.transitionend;
			},

			enumerable: true
		}
	});


	// Utilities

	function bindTail(fn) {
		// Takes arguments 1 and up and appends them to arguments
		// passed to fn.
		var args$$1 = A$4.slice.call(arguments, 1);
		return function() {
			A$4.push.apply(arguments, args$$1);
			fn.apply(null, arguments);
		};
	}

	function prefixSlash(str) {
		// Prefixes a slash when there is not an existing one
		return (/^\//.test(str) ? '' : '/') + str ;
	}

	function toArray$2(object) {
		// Speed test for array conversion:
		// https://jsperf.com/nodelist-to-array/27

		var array = [];
		var l = array.length = object.length;
		var i;

		for (i = 0; i < l; i++) {
			array[i] = object[i];
		}

		return array;
	}


	// TokenList
	// TokenList constructor to emulate classList property. The get fn should
	// take the arguments (node), and return a string of tokens. The set fn
	// should take the arguments (node, string).

	function TokenList(node, get, set) {
		this.node = node;
		this.get = get;
		this.set = set;
	}

	TokenList.prototype = {
		add: function() {
			var n = arguments.length;
			var tokens = this.get(this.node);
			var array = tokens ? tokens.trim().split(rspaces) : [] ;

			while (n--) {
				if (array.indexOf(arguments[n]) === -1) {
					array.push(arguments[n]);
				}
			}

			this.set(this.node, array.join(' '));
		},

		remove: function() {
			var n = arguments.length;
			var tokens = this.get(this.node);
			var array = tokens ? tokens.trim().split(rspaces) : [] ;
			var i;

			while (n--) {
				i = array.indexOf(arguments[n]);
				if (i !== -1) { array.splice(i, 1); }
			}

			this.set(this.node, array.join(' '));
		},

		contains: function(string) {
			var tokens = this.get(this.node);
			var array = tokens ? tokens.trim().split(rspaces) : [] ;
			return array.indexOf(string) !== -1;
		}
	};


	// DOM Nodes

	var types$1 = {
		1:  'element',
		3:  'text',
		8:  'comment',
		9:  'document',
		10: 'doctype',
		11: 'fragment'
	};

	var clone = features.textareaPlaceholderSet ?

		function clone(node) {
			return node.cloneNode(true);
		} :

		function cloneWithHTML(node) {
			// IE sets textarea innerHTML to the placeholder when cloning.
			// Reset the resulting value.

			var clone     = node.cloneNode(true);
			var textareas = dom.query('textarea', node);
			var n         = textareas.length;
			var clones;

			if (n) {
				clones = dom.query('textarea', clone);

				while (n--) {
					clones[n].value = textareas[n].value;
				}
			}

			return clone;
		} ;

	function type(node) {
		return types$1[node.nodeType];
	}

	function isElementNode(node) {
		return node.nodeType === 1;
	}

	function isTextNode(node) {
		return node.nodeType === 3;
	}

	function isCommentNode(node) {
		return node.nodeType === 8;
	}

	function isFragmentNode(node) {
		return node.nodeType === 11;
	}

	function isInternalLink(node) {
		var location = window.location;

			// IE does not give us a .hostname for links to
			// xxx.xxx.xxx.xxx URLs. file:// URLs don't have a hostname
			// anywhere. This logic is not foolproof, it will let through
			// links to different protocols for example
		return (!node.hostname ||
			// IE gives us the port on node.host, even where it is not
			// specified. Use node.hostname
			location.hostname === node.hostname) &&
			// IE gives us node.pathname without a leading slash, so
			// add one before comparing
			location.pathname === prefixSlash(node.pathname);
	}

	function isValid(node) {
		return node.validity ? node.validity.valid : true ;
	}

	function identify(node) {
		var id$$1 = node.id;

		if (!id$$1) {
			do { id$$1 = Math.ceil(Math.random() * 100000); }
			while (document.getElementById(id$$1));
			node.id = id$$1;
		}

		return id$$1;
	}

	function tag(node) {
		return node.tagName && node.tagName.toLowerCase();
	}

	function attribute(name, node) {
		return node.getAttribute && node.getAttribute(name) || undefined ;
	}

	function setClass(node, classes) {
		if (node instanceof SVGElement) {
			node.setAttribute('class', classes);
		}
		else {
			node.className = classes;
		}
	}

	function classes(node) {
		return node.classList || new TokenList(node, dom.attribute('class'), setClass);
	}

	function addClass(string, node) {
		classes(node).add(string);
	}

	function removeClass(string, node) {
		classes(node).remove(string);
	}

	function flashClass(string, node) {
		var list = classes(node);
		list.add(string);
		requestAnimationFrame(function() {
			list.remove(string);
		});
	}


	// DOM Traversal

	function find$2(selector, node) {
		return node.querySelector(selector);
	}

	function query(selector, node) {
		return toArray$2(node.querySelectorAll(selector));
	}

	function contains$2(child, node) {
		return node.contains ?
			node.contains(child) :
		child.parentNode ?
			child.parentNode === node || contains$2(child.parentNode, node) :
		false ;
	}

	function matches(selector, node) {
		return node.matches ? node.matches(selector) :
			node.matchesSelector ? node.matchesSelector(selector) :
			node.webkitMatchesSelector ? node.webkitMatchesSelector(selector) :
			node.mozMatchesSelector ? node.mozMatchesSelector(selector) :
			node.msMatchesSelector ? node.msMatchesSelector(selector) :
			node.oMatchesSelector ? node.oMatchesSelector(selector) :
			// Dumb fall back to simple tag name matching. Nigh-on useless.
			tag(node) === selector ;
	}

	function closest(selector, node) {
		var root = arguments[2];

		if (!node || node === document || node === root || node.nodeType === 11) { return; }

		// SVG <use> elements store their DOM reference in
		// .correspondingUseElement.
		node = node.correspondingUseElement || node ;

		return matches(selector, node) ?
			 node :
			 closest(selector, node.parentNode, root) ;
	}

	function next(node) {
		return node.nextElementSibling || undefined;
	}

	function previous(node) {
		return node.previousElementSibling || undefined;
	}

	function empty(node) {
		while (node.lastChild) { node.removeChild(node.lastChild); }
	}

	function removeNode(node) {
		node.parentNode && node.parentNode.removeChild(node);
	}

	function remove$3(node) {
		if (node instanceof Node || node instanceof SVGElement) {
			removeNode(node);
		}
		else {
			A$4.forEach.call(node, removeNode);
		}
	}

	function before(target, node) {
		target.parentNode && target.parentNode.insertBefore(node, target);
	}

	function after(target, node) {
		target.parentNode && target.parentNode.insertBefore(node, target.nextSibling);
	}

	function replace(target, node) {
		before(target, node);
		remove$3(target);
		return target;
	}


	// CSS

	function windowBox() {
		return {
			left:   0,
			top:    0,
			right:  window.innerWidth,
			bottom: window.innerHeight,
			width:  window.innerWidth,
			height: window.innerHeight
		};
	}

	function box(node) {
		return node === window ?
			windowBox() :
			node.getClientRects()[0] ;
	}

	function bounds(node) {
		return node.getBoundingClientRect();
	}

	//function offset(node) {
	//	var rect = box(node);
	//	var scrollX = window.scrollX === undefined ? window.pageXOffset : window.scrollX ;
	//	var scrollY = window.scrollY === undefined ? window.pageYOffset : window.scrollY ;
	//	return [rect.left + scrollX, rect.top + scrollY];
	//}

	function offset(node1, node2) {
		var box1 = box(node1);
		var box2 = box(node2);
		return [box2.left - box1.left, box2.top - box1.top];
	}


	// DOM Events

	var eventOptions = { bubbles: true };

	var eventsSymbol = Symbol('events');

	var untrapFocus = noop$1;

	function Event(type, properties) {
		var options = assign$6({}, eventOptions, properties);
		var event   = new CustomEvent(type, options);

		if (properties) {
			delete properties.detail;
			assign$6(event, properties);
		}

		return event;
	}

	function preventDefault(e) {
		e.preventDefault();
	}

	function isTargetEvent(e) {
		return e.target === e.currentTarget;
	}

	function isPrimaryButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
	}

	function on(node, type, fn, data) {
		var options;

		if (typeof type === 'object') {
			options = type;
			type    = options.type;
		}

		var types   = type.split(rspaces);
		var events  = node[eventsSymbol] || (node[eventsSymbol] = {});
		var handler = data ? bindTail(fn, data) : fn ;
		var handlers;

		var n = -1;
		while (++n < types.length) {
			type = types[n];
			handlers = events[type] || (events[type] = []);
			handlers.push([fn, handler]);
			node.addEventListener(type, handler, options);
		}

		return node;
	}

	function once$2(node, types, fn, data) {
		on(node, types, function once() {
			off(node, types, once);
			fn.apply(null, arguments);
		}, data);
	}

	function off(node, type, fn) {
		var options;

		if (typeof type === 'object') {
			options = type;
			type    = options.type;
		}

		var types   = type.split(rspaces);
		var events  = node[eventsSymbol];
		var handlers, i;

		if (!events) { return node; }

		var n = -1;
		while (n++ < types.length) {
			type = types[n];
			handlers = events[type];
			if (!handlers) { continue; }
			i = handlers.length;
			while (i--) {
				if (handlers[i][0] === fn) {
					node.removeEventListener(type, handlers[i][1]);
					handlers.splice(i, 1);
				}
			}
		}

		return node;
	}

	function trigger(node, type, properties) {
		// Don't cache events. It prevents you from triggering an event of a
		// given type from inside the handler of another event of that type.
		var event = Event(type, properties);
		node.dispatchEvent(event);
	}

	function end(e, fn) {
		off(e.currentTarget, features.events.transitionend, end);
		fn(e.timeStamp);
	}

	function requestEvent(type, fn, node) {
		if (type === 'transitionend') {
			if (!features.transition) {
				fn(performance.now());
				return;
			}

			type = features.events.transitionend;
		}

		on(node, type, end, fn);
	}

	function delegate(selector, fn) {
		// Create an event handler that looks up the ancestor tree
		// to find selector.
		return function handler(e) {
			var node = closest(selector, e.target, e.currentTarget);
			if (!node) { return; }
			e.delegateTarget = node;
			fn(e, node);
			e.delegateTarget = undefined;
		};
	}

	function prefixType(type) {
		return features.events[type] || type ;
	}

	function event(type, node) {
		var options;

		if (typeof type === 'object') {
			options = type;
			type    = options.type;
		}

		var types = type.split(rspaces).map(prefixType);

		return new Stream$1(function setup(notify, stop) {
			var buffer = [];

			function update(value) {
				buffer.push(value);
				notify('push');
			}

			types.forEach(function(type) {
				node.addEventListener(type, update, options);
			});

			return {
				shift: function shiftEvent() {
					return buffer.shift();
				},

				stop: function stopEvent() {
					types.forEach(function(type) {
						node.removeEventListener(type, update);
					});

					stop(buffer.length);
				}
			};
		});
	}

	function trapFocus(node) {
		// Trap focus as described by Nikolas Zachas:
		// http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/

		// If there is an existing focus trap, remove it
		untrapFocus();

		// Cache the currently focused node
		var focusNode = document.activeElement || document.body;

		function resetFocus() {
			var focusable = dom.query('[tabindex], a, input, textarea, button', node)[0];
			if (focusable) { focusable.focus(); }
		}

		function preventFocus(e) {
			if (node.contains(e.target)) { return; }

			// If trying to focus outside node, set the focus back
			// to the first thing inside.
			resetFocus();
			e.preventDefault();
			e.stopPropagation();
		}

		// Prevent focus in capture phase
		document.addEventListener("focus", preventFocus, true);

		// Move focus into node
		requestTick(resetFocus);

		return untrapFocus = function() {
			untrapFocus = noop$1;
			document.removeEventListener('focus', preventFocus, true);

			// Set focus back to the thing that was last focused when the
			// dialog was opened.
			requestTick(function() {
				focusNode.focus();
			});
		};
	}


	// DOM Fragments and Templates

	function fragmentFromChildren(node) {
		if (node.domFragmentFromChildren) {
			return node.domFragmentFromChildren;
		}

		var fragment = create$1('fragment');
		node.domFragmentFromChildren = fragment;
		append(fragment, node.childNodes);
		return fragment;
	}

	function fragmentFromHTML(html, tag) {
		var node = document.createElement(tag || 'div');
		node.innerHTML = html;
		return fragmentFromChildren(node);
	}

	function fragmentFromTemplate(node) {
		// A template tag has a content property that gives us a document
		// fragment. If that doesn't exist we must make a document fragment.
		return node.content || fragmentFromChildren(node);
	}

	function fragmentFromId(id$$1) {
		var node = document.getElementById(id$$1);

		if (!node) { throw new Error('DOM: element id="' + id$$1 + '" is not in the DOM.') }

		var t = tag(node);

		// In browsers where templates are not inert their content can clash
		// with content in the DOM - ids, for example. Remove the template as
		// a precaution.
		if (t === 'template' && !features.template) {
			remove$3(node);
		}

		return t === 'template' ? fragmentFromTemplate(node) :
			t === 'script' ? fragmentFromHTML(node.innerHTML, attribute('data-parent-tag', node)) :
			fragmentFromChildren(node) ;
	}


	// Units

	var runit = /(\d*\.?\d+)(r?em|vw|vh)/;
	//var rpercent = /(\d*\.?\d+)%/;

	var fontSize;

	var units = {
		em: function(n) {
			return getFontSize() * n;
		},

		rem: function(n) {
			return getFontSize() * n;
		},

		vw: function(n) {
			return window.innerWidth * n / 100;
		},

		vh: function(n) {
			return window.innerHeight * n / 100;
		}
	};

	var toPx = overload(toType, {
		'number': id,

		'string': function(string) {
			var data = runit.exec(string);

			if (data) {
				return units[data[2]](parseFloat(data[1]));
			}

			throw new Error('dom: "' + string + '" cannot be parsed as rem, em, vw or vh units.');
		}
	});

	function toRem(n) {
		return (toPx(n) / getFontSize()) + 'rem';
	}

	function toVw(n) {
		return (100 * toPx(n) / window.innerWidth) + 'vw';
	}

	function toVh(n) {
		return (100 * toPx(n) / window.innerHeight) + 'vh';
	}

	function getFontSize() {
		return fontSize ||
			(fontSize = parseFloat(style("font-size", document.documentElement), 10));
	}


	// Animation and scrolling

	function transition(duration, fn) {
		var t0 = performance.now();

		function frame(t1) {
			// Progress from 0-1
			var progress = (t1 - t0) / (duration * 1000);

			if (progress < 1) {
				if (progress > 0) {
					fn(progress);
				}
				id$$1 = requestAnimationFrame(frame);
			}
			else {
				fn(1);
			}
		}

		var id$$1 = requestAnimationFrame(frame);

		return function cancel() {
			cancelAnimationFrame(id$$1);
		};
	}

	function animate(duration, transform, name, object, value) {
		return transition(
			duration,
			pipe(transform, denormalise$1(object[name], value), set$1(name, object))
		);
	}

	function animateScroll(coords) {
		var duration = 0.6;
		var ease = pow$1(2);

		// coords may be a single y value or a an [x, y] array
		var x, y;

		if (typeof coords === "number") {
			x = false;
			y = coords;
		}
		else {
			x = coords[0];
			y = coords[1];
		}

		var denormaliseX = x !== false && denormalise$1(dom.view.scrollLeft, x);
		var denormaliseY = denormalise$1(dom.view.scrollTop, y);

		return transition(
			duration,
			pipe(ease, function(progress) {
				x !== false && (dom.view.scrollLeft = denormaliseX(progress));
				dom.view.scrollTop  = denormaliseY(progress);
			})
		);
	}

	function scrollRatio(node) {
		return node.scrollTop / (node.scrollHeight - node.clientHeight);
	}

	function disableScroll(node) {
		node = node || document.documentElement;

		var scrollLeft = node.scrollLeft;
		var scrollTop  = node.scrollTop;

		// Remove scrollbars from the documentElement
		//docElem.css({ overflow: 'hidden' });
		node.style.overflow = 'hidden';

		// FF has a nasty habit of linking the scroll parameters
		// of document with the documentElement, causing the page
		// to jump when overflow is hidden on the documentElement.
		// Reset the scroll position.
		if (scrollTop)  { node.scrollTop = scrollTop; }
		if (scrollLeft) { node.scrollLeft = scrollLeft; }

		// Disable gestures on touch devices
		//add(document, 'touchmove', preventDefaultOutside, layer);
	}

	function enableScroll(node) {
		node = node || document.documentElement;

		var scrollLeft = node.scrollLeft;
		var scrollTop  = node.scrollTop;

		// Put scrollbars back onto docElem
		node.style.overflow = '';

		// FF fix. Reset the scroll position.
		if (scrollTop) { node.scrollTop = scrollTop; }
		if (scrollLeft) { node.scrollLeft = scrollLeft; }

		// Enable gestures on touch devices
		//remove(document, 'touchmove', preventDefaultOutside);
	}

	// dom

	function dom(selector) {
		return query(selector, document);
	}
	var ready = new Promise(function(accept, reject) {
		function handle() {
			document.removeEventListener('DOMContentLoaded', handle);
			window.removeEventListener('load', handle);
			accept();
		}

		document.addEventListener('DOMContentLoaded', handle);
		window.addEventListener('load', handle);
	});

	assign$6(dom, {

		// DOM lifecycle

		ready:   ready.then.bind(ready),

		now:     function() {
			// Return DOM time in seconds
			return window.performance.now() / 1000;
		},

		// DOM traversal

		get: function get(id$$1) {
			return document.getElementById(id$$1) || undefined;
		},

		find:     curry$1(find$2,     true),
		query:    curry$1(query,    true),
		closest:  curry$1(closest,  true),
		contains: curry$1(contains$2, true),
		matches:  curry$1(matches,  true),
		next:     next,
		previous: previous,

		// DOM mutation

		clone:    clone,
		identify: identify,
		before:   curry$1(before,  true),
		after:    curry$1(after,   true),
		replace:  curry$1(replace, true),
		empty:    empty,
		remove:   remove$3,

		validate: function(node) {
			return node.checkValidity ? node.checkValidity() : true ;
		},

		fullscreen: function fullscreen(node) {
			// Find the right method and call it
			return node.requestFullscreen ? node.requestFullscreen() :
				node.webkitRequestFullscreen ? node.webkitRequestFullscreen() :
				node.mozRequestFullScreen ? node.mozRequestFullScreen() :
				node.msRequestFullscreen ? node.msRequestFullscreen() :
				undefined ;
		},

		// EXAMPLE CODE for mutation observers  ------

		//		var observer = new MutationObserver(function(mutationsList) {
		//		    var mutation;
		//		    for(mutation of mutationsList) {
		//		        if (mutation.addedNodes.length) {
		//		            dom
		//		            .query('a[href="' + router.path + '"]', mutation.target)
		//		            .forEach(dom.addClass('current'));
		//		        }
		//		    }
		//		});
		//
		//		observer.observe(dom.get('calendar'), { childList: true, subtree: true });

		// DOM inspection

		isElementNode:  isElementNode,
		isTextNode:     isTextNode,
		isCommentNode:  isCommentNode,
		isFragmentNode: isFragmentNode,
		isInternalLink: isInternalLink,
		isValid:        isValid,

		type:        type,
		tag:         tag,
		attribute:   curry$1(attribute, true),
		classes:     classes,
		addClass:    curry$1(addClass,    true),
		removeClass: curry$1(removeClass, true),
		flashClass:  curry$1(flashClass,  true),

		box:         box,
		bounds:      bounds,
		offset:      curry$1(offset, true),

		toPx:           toPx,
		toRem:          toRem,
		toVw:           toVw,
		toVh:           toVh,

		// DOM fragments and templates

		fragmentFromTemplate: fragmentFromTemplate,
		fragmentFromChildren: fragmentFromChildren,
		fragmentFromHTML:     fragmentFromHTML,
		fragmentFromId:       fragmentFromId,

		// DOM events

		Event:           Event,
		delegate:        delegate,
		isPrimaryButton: isPrimaryButton,
		isTargetEvent:   isTargetEvent,
		preventDefault:  preventDefault,
		trapFocus:       trapFocus,
		trap:            deprecate(trapFocus, 'dom.trap() is now dom.trapFocus()'),

		trigger: curry$1(function(type, node) {
			trigger(node, type);
			return node;
		}, true),

		events: assign$6(curry$1(event, true), {
			on:      on,
			once:    once$2,
			off:     off,
			trigger: trigger
		}),

		on:    deprecate(curry$1(event, true), 'dom.on() is now dom.events()'),
		event: deprecate(curry$1(event, true), 'Deprecated dom.event() – now dom.events()'),

		// DOM animation adn scrolling

		// transition(duration, fn)
		//
		// duration  - duration seconds
		// fn        - callback that is called with a float representing
		//             progress in the range 0-1

		transition: curry$1(transition, true),
		schedule:   deprecate(transition, 'dom: .schedule() is now .transition()'),

		// animate(duration, transform, value, name, object)
		//
		// duration  - in seconds
		// transform - function that maps x (0-1) to y (0-1)
		// name      - name of property to animate
		// object    - object to animate
		// value     - target value

		animate: curry$1(animate, true),

		// animateScroll(n)
		//
		// Animate scrollTop of scrollingElement to n (in px)

		animateScroll: animateScroll,
		scrollTo: deprecate(animateScroll, 'scrollTo(px, node) renamed to animateScroll(px)'),

		// scrollRatio(node)
		//
		// Returns scrollTop as ratio of scrollHeight

		scrollRatio: scrollRatio,

		// disableScroll(node)
		//
		// Disables scrolling without causing node's content to jump

		disableScroll: disableScroll,

		// enableScroll(node)
		//
		// Enables scrolling without causing node's content to jump

		enableScroll: enableScroll,

		// requestEvent(type, fn, node)

		requestEvent: requestEvent,

		requestFrame: requestAnimationFrame.bind(null),

		requestFrameN: curry$1(deprecate(function requestFrameN(n, fn) {
			(function frame() {
				return requestAnimationFrame(--n ? frame : fn);
			}());
		}, 'requestFrameN() will be removed soon'), true),

		// Features

		features: features,

		// Safe visible area

		safe: define$1({
			left: 0
		}, {
			right:  { get: function() { return window.innerWidth; }, enumerable: true, configurable: true },
			top:    { get: function() { return style('padding-top', document.body); }, enumerable: true, configurable: true },
			bottom: { get: function() { return window.innerHeight; }, enumerable: true, configurable: true }
		})
	});

	define$1(dom, {
		// Element shortcuts
		root: { value: document.documentElement, enumerable: true },
		head: { value: document.head, enumerable: true },
		body: { get: function() { return document.body; }, enumerable: true	},
		view: { get: function() { return document.scrollingElement; }, enumerable: true }
	});

	var pre  = document.createElement('pre');
	var text = document.createTextNode('');

	pre.appendChild(text);

	function escape(value) {
		text.textContent = value;
		return pre.innerHTML;
	}

	var mimetypes = {
		xml:  'application/xml',
		html: 'text/html',
		svg:  'image/svg+xml'
	};

	function parse$1(type, string) {
		if (!string) { return; }

		var mimetype = mimetypes[type];
		var xml;

		// From jQuery source...
		try {
			xml = (new window.DOMParser()).parseFromString(string, mimetype);
		} catch (e) {
			xml = undefined;
		}

		if (!xml || xml.getElementsByTagName("parsererror").length) {
			throw new Error("dom: Invalid XML: " + string);
		}

		return xml;
	}

	function children(node) {
		// In IE and Safari, document fragments do not have .children, fall back to
		// querySelectorAll.
		return toArray$1(node.children || node.querySelectorAll('*'));
	}

	if (!Element.prototype.append) {
	    console.warn('A polyfill for Element.append() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append)');
	}

	function append$3(target, node) {
	    target.append(node);
	    return node;
	}

	if (!Element.prototype.prepend) {
	    console.warn('A polyfill for Element.prepend() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/prepend)');
	}

	function prepend$3(target, node) {
	    target.prepend(node);
	    return node;
	}

	const shadowOptions = { mode: 'open' };

	function intoObject(object, entry) {
	    if (typeof entry[1] === 'function') {
	        object[entry[0]] = entry[1];
	    }
	    else if (entry[1].change) {
	        object[entry[0]] = entry[1].change;
	    }

	    return object;
	}

	function isPropertyDescriptor(object) {
	    return object.get || object.set || 'value' in object ;
	}

	function defineElement(name, setup, attributes, dom) {
	    function CustomElement() {
	        var elem = Reflect.construct(HTMLElement, nothing$1, CustomElement);

	        // Create a shadow root if there is DOM content
	        if (isDefined(dom)) {
	            const shadow = elem.attachShadow(shadowOptions);

	            if (typeof dom === 'string') {
	                shadow.innerHTML = dom;
	            }
	            else {
	                shadow.appendChild(dom);
	            }
	        }

	        // Run custom setup and return
	        setup(elem);
	        return elem;
	    }

	    CustomElement.prototype = Object.create(HTMLElement.prototype);

	    if (attributes) {
	        // Extract attribute handlers and register them to listen to changes
	        const entries        = Object.entries(attributes);
	        const changeHandlers = entries.reduce(intoObject, {});
	        const changeCallback = choose(changeHandlers);

	        CustomElement.observedAttributes = Object.keys(changeHandlers);
	        CustomElement.prototype.attributeChangedCallback = function(attribute, old, value) {
	            if (value === old) { return; }
	            changeCallback.apply(this, arguments);
	        };

	        // Define properties. Where the descriptor is a function, assume that
	        // we want a property to reflect the attribute. Where get, set or value
	        // are not in the descriptor, don't define a property.
	        entries.forEach(function(entry) {
	            const name = entry[0];

	            if (name in CustomElement.prototype) {
	                throw new Error('Trying to create a property "' + name + '", but HTMLElement already defines that property.');
	            }

	            if (typeof entry[1] === 'function') {
	                Object.defineProperty(CustomElement.prototype, name, {
	                    get: function() {
	                        return this.getAttribute(name) || '';
	                    },

	                    set: function(value) {
	                        this.setAttribute(name, value);
	                    }
	                });
	            }
	            else if (isPropertyDescriptor(entry[1])) {
	                Object.defineProperty(CustomElement.prototype, name, entry[1]);
	            }
	        });
	    }

	    window.customElements.define(name, CustomElement);
	    return CustomElement;
	}

	var keyCodes = {
		8:  'backspace',
		9:  'tab',
		13: 'enter',
		16: 'shift',
		17: 'ctrl',
		18: 'alt',
		27: 'escape',
		32: 'space',
		33: 'pageup',
		34: 'pagedown',
		35: 'pageright',
		36: 'pageleft',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		46: 'delete',
		48: '0',
		49: '1',
		50: '2',
		51: '3',
		52: '4',
		53: '5',
		54: '6',
		55: '7',
		56: '8',
		57: '9',
		65: 'a',
		66: 'b',
		67: 'c',
		68: 'd',
		69: 'e',
		70: 'f',
		71: 'g',
		72: 'h',
		73: 'i',
		74: 'j',
		75: 'k',
		76: 'l',
		77: 'm',
		78: 'n',
		79: 'o',
		80: 'p',
		81: 'q',
		82: 'r',
		83: 's',
		84: 't',
		85: 'u',
		86: 'v',
		87: 'w',
		88: 'x',
		89: 'y',
		90: 'z',
		// Mac Chrome left CMD
		91: 'cmd',
		// Mac Chrome right CMD
		93: 'cmd',
		186: ';',
		187: '=',
		188: ',',
		189: '-',
		190: '.',
		191: '/',
		219: '[',
		220: '\\',
		221: ']',
		222: '\'',
		// Mac FF
		224: 'cmd'
	};

	function toKey(e) {
		return keyCodes[e.keyCode];
	}

	if (window.console && window.console.log) {
	    console.log('dom         – https://github.com/stephband/dom');
	}
	window.dom = dom;

	// Lifecycle

	const ready$1                  = dom.ready;
	const now$1                    = dom.now;
	const parse$2 = curry$1(parse$1, true);

	const attribute$1              = dom.attribute;
	const closest$1                = dom.closest;
	const contains$3               = dom.contains;
	const find$3                   = dom.find;
	const get$2                    = dom.get;
	const matches$1                = dom.matches;
	const next$1                   = dom.next;
	const previous$1               = dom.previous;
	const query$1                  = dom.query;
	const tag$1                    = dom.tag;
	const type$1                   = dom.type;
	const isElementNode$1          = dom.isElementNode;
	const isTextNode$1             = dom.isTextNode;
	const isCommentNode$1          = dom.isCommentNode;
	const isFragmentNode$1         = dom.isFragmentNode;
	const isInternalLink$1         = dom.isInternalLink;
	const isValid$1                = dom.isValid;
	const assign$7  = curry$1(assignAttributes, true);
	const append$4  = curry$1(append$3, true);
	const prepend$4 = curry$1(prepend$3, true);

	const clone$1                  = dom.clone;
	const identify$1               = dom.identify;
	const before$1                 = dom.before;
	const after$1                  = dom.after;
	const replace$1                = dom.replace;
	const empty$1                  = dom.empty;
	const remove$4                 = dom.remove;

	// Style

	const box$1                    = dom.box;
	const bounds$1                 = dom.bounds;
	const offset$1                 = dom.offset;
	const classes$1                = dom.classes;
	const addClass$1               = dom.addClass;
	const removeClass$1            = dom.removeClass;
	const flashClass$1             = dom.flashClass;

	const toPx$1                   = dom.toPx;
	const toRem$1                  = dom.toRem;
	const toVw$1                   = dom.toVw;
	const toVh$1                   = dom.toVh;
	const style$1 = curry$1(style, true);

	// Fragments

	const fragmentFromTemplate$1   = dom.fragmentFromTemplate;
	const fragmentFromChildren$1   = dom.fragmentFromChildren;
	const fragmentFromHTML$1       = dom.fragmentFromHTML;
	const fragmentFromId$1         = dom.fragmentFromId;

	// Events

	const Event$1                  = dom.Event;
	const events                 = dom.events;
	const trigger$1                = dom.trigger;
	const delegate$1               = dom.delegate;
	const isPrimaryButton$1        = dom.isPrimaryButton;
	const isTargetEvent$1          = dom.isTargetEvent;
	const on$1                     = dom.on;
	const off$1                    = dom.off;
	const preventDefault$1         = dom.preventDefault;
	const trapFocus$1              = dom.trapFocus;
	const requestEvent$1           = dom.requestEvent;

	// Animation

	const animate$1                = dom.animate;
	const fullscreen             = dom.fullscreen;
	const transition$1             = dom.transition;
	const validate               = dom.validate;
	const requestFrame           = dom.requestFrame;

	// Scroll

	const animateScroll$1          = dom.animateScroll;
	const scrollRatio$1            = dom.scrollRatio;
	const disableScroll$1          = dom.disableScroll;
	const enableScroll$1           = dom.enableScroll;

	exports.default = dom;
	exports.ready = ready$1;
	exports.now = now$1;
	exports.parse = parse$2;
	exports.attribute = attribute$1;
	exports.closest = closest$1;
	exports.contains = contains$3;
	exports.find = find$3;
	exports.get = get$2;
	exports.matches = matches$1;
	exports.next = next$1;
	exports.previous = previous$1;
	exports.query = query$1;
	exports.tag = tag$1;
	exports.type = type$1;
	exports.isElementNode = isElementNode$1;
	exports.isTextNode = isTextNode$1;
	exports.isCommentNode = isCommentNode$1;
	exports.isFragmentNode = isFragmentNode$1;
	exports.isInternalLink = isInternalLink$1;
	exports.isValid = isValid$1;
	exports.assign = assign$7;
	exports.append = append$4;
	exports.prepend = prepend$4;
	exports.clone = clone$1;
	exports.identify = identify$1;
	exports.before = before$1;
	exports.after = after$1;
	exports.replace = replace$1;
	exports.empty = empty$1;
	exports.remove = remove$4;
	exports.box = box$1;
	exports.bounds = bounds$1;
	exports.offset = offset$1;
	exports.classes = classes$1;
	exports.addClass = addClass$1;
	exports.removeClass = removeClass$1;
	exports.flashClass = flashClass$1;
	exports.toPx = toPx$1;
	exports.toRem = toRem$1;
	exports.toVw = toVw$1;
	exports.toVh = toVh$1;
	exports.style = style$1;
	exports.fragmentFromTemplate = fragmentFromTemplate$1;
	exports.fragmentFromChildren = fragmentFromChildren$1;
	exports.fragmentFromHTML = fragmentFromHTML$1;
	exports.fragmentFromId = fragmentFromId$1;
	exports.Event = Event$1;
	exports.events = events;
	exports.trigger = trigger$1;
	exports.delegate = delegate$1;
	exports.isPrimaryButton = isPrimaryButton$1;
	exports.isTargetEvent = isTargetEvent$1;
	exports.on = on$1;
	exports.off = off$1;
	exports.preventDefault = preventDefault$1;
	exports.trapFocus = trapFocus$1;
	exports.requestEvent = requestEvent$1;
	exports.animate = animate$1;
	exports.fullscreen = fullscreen;
	exports.transition = transition$1;
	exports.validate = validate;
	exports.requestFrame = requestFrame;
	exports.animateScroll = animateScroll$1;
	exports.scrollRatio = scrollRatio$1;
	exports.disableScroll = disableScroll$1;
	exports.enableScroll = enableScroll$1;
	exports.escape = escape;
	exports.children = children;
	exports.create = create$1;
	exports.define = defineElement;
	exports.prefix = prefix$1;
	exports.toKey = toKey;

	return exports;

}({}));
