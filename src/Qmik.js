/**
 * @author:leo
 * @email:cwq0312@163.com
 * @version:1.2.33
 */
(function() {
	var win = this,
		doc = win.document || {},
		nav = win.navigator || {}, //
		UA = nav.userAgent,
		loc = win.location;
	var encode = encodeURIComponent,
		decode = decodeURIComponent,
		slice = [].slice, //
		baseURL = loc.protocol + "//" + loc.hostname + (loc.port ? ":" + loc.port : ""), //
		config = {
			context: "/" //工程上下文目录
		};
	//var readyRE = /complete|loaded|interactive/i;
	// define qmik object
	function Q(selector, context) {
		return Q.init(selector, context)
	}
	Q.extend = function() {
		var args = arguments,
			ret = args[0] || {},
			i = 1;
		switch (args.length) {
			case 0:
				return;
			case 1:
				ret = this;
				i = 0;
				break
		}
		each(slice.call(args, i), function(j, v) {
			v && each(v, function(key, val) {
				isNull(val) || (ret[key] = val)
			})
		});
		return ret
	}
	var strtype = String.prototype;
	Q.extend(strtype, {
		trim: function() {
			return this.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, "")
		},
		toLower: strtype.toLowerCase,
		toUpper: strtype.toUpperCase
	});

	function grep(array, callback) {
		var ret = [];
		each(array, function(i, v) {
			(callback ? callback(i, v) : !isNull(v)) && ret.push(v)
		});
		return ret
	}
	// public function
	// ///////////////////////////////////////////////////////////////////
	// isNull
	function isNull(v) {
		return v === undefined || v === null
	}

	function likeNull(v) {
		return isNull(v) || (isString(v) && (v == "undefined" || v == "null" || v.trim() == ""))
	}
	// isString
	function isString(v) {
		return typeof v == 'string'
	}
	// isDom
	function isDom(v) {
		return v && v.nodeType == 1
	}
	// isArray
	function isArray(v) {
		return v instanceof Array
	}

	function likeArray(v) { // like Array
		return !isString(v) && (isArray(v) || (Q.isQmik && Q.isQmik(v)) || (function() {
			v += "";
			return v == "[object Arguments]" || v == "[object NodeList]" || v == "[object HTMLCollection]" || v == "[object StaticNodeList]"
		})())
	}
	// isFunction
	function isFun(v) {
		return v instanceof Function
	}

	function isError(v) {
		return v instanceof Error
	}

	function isObject(v) {
		return v instanceof Object
	}

	function each(obj, callback) { // each fun(k,v)
		var i;
		if (likeArray(obj)) {
			for (i = 0; i < obj.length; i++) {
				callback.call(obj[i], i, obj[i])
			}
		} else if (isObject(obj)) {
			for (i in obj) {
				callback.call(obj[i], i, obj[i])
			}
		}
		return obj;
	}
	// isNumber
	function isNum(v) {
		return typeof v == 'number'
	}

	function isBool(v) {
		return typeof v == 'boolean'
	}
	/*	function isBaseType(v) {
			return isBool(v) || isString(v) || isNum(v)
		}*/
	function toString(v) {
		return (isBool(v) || isString(v) || isNum(v)) ? v + "" : isFun(v) ? v.toString() : JSON.stringify(v)
	}
	// to json
	function toJSON(v) {
		return likeNull(v) ? "" : JSON.parse(v)
	}

	function isEvent(e) {
		return win.Event && e instanceof win.Event || e == win.event
	}

	function execObject(v) {
		return isFun(v) ? v() : v
	}

	function merge() { // merge array or object
		var args = arguments,
			array = args[0],
			isA = isArray(array);
		each(args,function(i, arg){
			each(arg, function(k, v){
				isA ? array.push(v) : array[k] = v
			})
		})
		return array
	}

	/*	function isGrandfather(grandfather, child) {
			return isDom(child) && (grandfather === child.parentNode ? !0 : isGrandfather(grandfather, child.parentNode))
		}*/
	// 合并url,参数个数不限
	function concactUrl() {
		return Q.map(arguments, function(i, url) {
			return isArray(url) ? url.join("") : url
		}).join("/").replace(/(^\w+:\/\/)|([\/]{2,})/g, function(v) {
			return !/^\w+:\/\//.test(v) ? "/" : v
		})
	}

	function loadResource(type, url, success, error) {
		url = Q.url(url);
		var isCss = type == "css",
			isScript = type == "js", //
			tagName = isCss ? "link" : isScript ? "script" : "iframe",
			node = doc.createElement(tagName),
			qnode = Q(node).attr({
				_src: url,
				async: "async"
			});
		isCss ? qnode.attr("rel", "stylesheet") : isScript && qnode.attr("type", "text/javascript");
		/*node.ready(function(e) {
			success && success(node)
		}).on("error", function(e) {
			node.remove();
			error && error(node)
		});*/
		qnode.on({
			load: function() {
				success && success(node)
			},
			error: function() {
				qnode.remove();
				error && error(node)
			}
		});
		if (isCss) node.href = url;
		else node.src = url;
		Q("head").append(node);
		return node
	}
	/**
		字符串变量${name}替换
	*/
	function replaceVar(str, data){
		data = data || {};
		return isNull(str) ? null : (str+"").replace(/(\$[!]?\{[\.\w_ -]*\})|(\{\{[\.\w_ -]*\}\})/g, function(name) {
			var keys = name.replace(/(^\$?[!]?\{\{?)|(\}\}?$)/g, "").trim();
			keys = keys.split(".");
			var val = data[keys[0]];
			for (var i = 1; i < keys.length; i++) {
				try {
					val = val[keys[i]]
				} catch (e) {
					Q.log(e, str);
					return ""
				}
			}
			return val || "";
		})
	}
	/* 为每个渲染模块注入此方法 */
	function addRenderChild(struct, item){
		this.child = this.child || [];
		this.child.push({
			text:Q.render(struct, item)
		});
	}
	//////////Delay class, function 实现setTimeout的功能
	function Delay(fun, time, params) {
		var me = this;
		me.pid = setTimeout(function() {
			fun.apply(fun, params)
		}, time)
	}
	Q.extend(Delay.prototype, {
		stop: function() {
			clearTimeout(this.pid)
		}
	});
	///////////////
	///////////////////Cycle class
	function Cycle(fun, cycleTime, ttl, params) {
		var me = this,
			chisu = 1;

		function _exec() {
			if ((isNull(ttl) || (chisu * cycleTime) < ttl)) {
				fun.apply(fun, params);
				me._p = new Delay(_exec, cycleTime, params);
			}
			chisu++;
		}
		me._p = new Delay(_exec, cycleTime, params);
	}
	Q.extend(Cycle.prototype, {
		stop: function() {
			this._p && this._p.stop()
		}
	});
	//////////////////////
	Q
		.extend({
			encode: encode,
			decode: decode,
			isDom: isDom,
			isBool: isBool,
			isString: isString,
			isFun: isFun,
			isFunction: isFun,
			isNum: isNum,
			isNumber: isNum,
			isArray: isArray,
			isNull: isNull,
			isError: isError,
			each: each,
			stringify: toString,
			parseJSON: toJSON,
			isEvent: isEvent,
			likeArray: likeArray,
			isDate: function(v) {
				return v instanceof Date
			},
			isObject: isObject,
			isPlainObject: function(v) { // isPlainObject
				if (isNull(v) || v + '' != '[object Object]' || v.nodeType || v == win) return !1;
				var k;
				for (k in v) {}
				return isNull(k) || Object.prototype.hasOwnProperty.call(v, k)
			},
			likeNull: likeNull,
			/**
			 * 继承类 子类subClass继承父类superClass的属性方法, 注:子类有父类的属性及方法时,不会被父类替换
			 */
			inherit: function(subClass, superClass) {
				function F() {}
				var subPrototype = subClass.prototype;
				F.prototype = superClass.prototype;
				subClass.prototype = new F();
				subClass.prototype.constructor = subClass;
				if (superClass.prototype.constructor == Object.prototype.constructor) {
					superClass.prototype.constructor = superClass;
				}
				for (var name in subPrototype) {
					subClass.prototype[name] = subPrototype[name];
				}
				for (var name in superClass) {
					subClass[name] = superClass[name];
				}
			},
			trim: function(v) {
				return isNull(v) ? "" : isString(v) ? v.trim() : v.toString().trim()
			},
			toLower: function(v) {
				return v ? v.toLower() : v
			},
			toUpper: function(v) {
				return v ? v.toUpper() : v
			},
			// 合并数组或对象
			merge: merge,
			array: function(array) {
				return merge([], array)
			},
			inArray: function(value, array) {
				if (Q.likeArray(array))
					for (var i = 0; i < array.length; i++)
						if (array[i] === value) return i;
				return -1
			},
			unique: function(array) {
				var ret = [];
				each(array, function(i, value) {
					Q.inArray(value, ret) < 0 && ret.push(value)
				});
				return ret
			},
			//contains : isGrandfather,
			/**
			 * 对数组里的内容,做部做一次数据映射转换,
			 * 例:
			 * var array=[1,2,3];
			 * array = Qmik.map(array,function(index,val){
			 * 	return index*val
			 * });
			 * console.log(array);//>>0,2,6
			 */
			map: function(array, callback) {
				var r = [],
					i = 0;
				for (; array && i < array.length; i++)
					isNull(array[i]) || r.push(callback(i, array[i]));
				/*each(array, function(i, val) {
					isNull(val) || r.push(callback(i, val));
				})*/
				return r
			},
			/**
			 * 取得脚本
			 */
			getScript: function(url, success, error) {
				return loadResource("js", url, success, error)
			},
			/**
			 * 取得css
			 */
			getCss: function(url, success, error) {
				return loadResource("css", url, success, error)
			},
			grep: grep,
			/**
			 * 抽取数组里面每个元素的name和value属性,转换成一个url形式(a=b&name=g)的字符串
			 */
			param: function(array) {
				var h = [];
				each(array, function(i, v) {
					isString(i) ? h.push(encode(i) + '=' + encode(execObject(v))) : v.name && h.push(encode(v.name) + '=' + encode(execObject(v.value)))
				});
				return h.join('&')
			},
			/**
			 * 当前时间
			 */
			now: function(d) {
				return (d || 0) + new Date().getTime()
			},
			// 延迟执行,==setTimeout
			/**
			 * target:apply,call的指向对象
			 */
			delay: function(fun, time) {
				//var params = slice.call(arguments, 2);
				return new Delay(fun, time, slice.call(arguments, 2))
			},
			// 周期执行
			/**
			 * fun:执行的方法
			 * cycleTime:执行的周期时间
			 * ttl:过期时间,执行时间>ttl时,停止执行,单位 ms(毫秒)
			 * target:apply,call的指向对象
			 */
			cycle: function(fun, cycleTime, ttl) {
				//var params = slice.call(arguments, 3);
				return new Cycle(fun, cycleTime, ttl, slice.call(arguments, 3));
			},
			log: function() {
				var args = arguments;
				if (config.debug || isError(args[0])) {
					try{console.log.apply(Q, args)}catch(e){Q.each(args,function(i,v){console.log(v)})};
				}
			},
			isIphone: function() {
				return /iPhone OS/.test(UA)
			},
			isAndroid: function() {
				return /Android/.test(UA)
			},
			isWP: function() {
				return /Windows Phone/.test(UA)
			},
			isIE: function() {
				return /MSIE/.test(UA)
			},
			/**
			 * is Firefox
			 */
			isFF: function() {
				return /Firefox/.test(UA)
			},
			/**
			 * is Webkit
			 */
			isWK: function() {
				return /WebKit/.test(UA)
			},
			isOpera: function() {
				return /Opera/.test(UA)
			},
			isRetinal: function() { //判断是否是视网膜高清屏,默认是高清屏
				return (win.devicePixelRatio || 2) >= 1.5;
			},
			config: function(opts, _config) {
				_config = arguments.length <= 1 ? config : (_config || {});
				var ret = _config;
				if (arguments.length < 1 || isNull(opts)) {} else if (!isObject(opts)) {
					ret = _config[opts]
				} else {
					each(opts, function(key, val) {
						isObject(val) && _config[key] ? Q.extend(_config[key], val) : (_config[key] = val)
					})
				}
				return ret
					//return (arguments.length < 1 || isNull(opts)) ? _config : isObject(opts) ? Q.extend(_config, opts) : _config[opts]
			},
			/**
			 * 合并url,if 参数 _url为空,则
			 */
			url: function(_url) {
				return arguments.length < 1 ? baseURL : !/^[a-zA-Z0-9]+:\/\//.test(_url) ? concactUrl(baseURL, (/^\//.test(_url) ? "" : config.context || "/") + "/" + _url) : _url
			},
			cssPrefix: function(style) {
				var ret = {};
				if (isString(style)) {
					ret = (Q.isWK() ? "-webkit-" : Q.isIE() ? "-ms-" : Q.isFF() ? "-moz-" : Q.isOpera() ? "-o-" : "") + style;
				} else {
					each(Q.extend({}, style), function(key, val) {
						ret[Q.cssPrefix(key)] = val
					})
				}
				return ret
			},
			/** 局部页面渲染引擎 
				struct:数据结构:{
					tag:'div[id="${id}" name="${name}"  itemid="${itemid}"]',
					text:'显示文本',
					child:[//子节点
						{
							tag:'p[class="title"]',
							text:'显示内容'
						},
						{
							tag:'p[class="remark"]',
							text:'显示内容'
						}
					]
				},
				item://数据
				{
					id:"",
					name:"",
					itemid:""
				}
			*/
			render: function(struct, item) {
				var h = [],
					tag = (struct.tag || "").trim(),
					text = struct.text;
				text = replaceVar(text, item);
				struct.add = addRenderChild;
				if ( tag=="" && !isNull(text)) {
					return text;
				}
				if(!/^\s*\w+\s*(\[.*\])?\s*$/.test(tag)){
					console.log("tag is lllegal:",tag);
					return "";
				}
				var tagName = (tag.match(/^[^\[]+/)||[""])[0];
				var attr = (tag.match(/\[.*$/) || [""])[0].replace(/(^\s*\[)|(\s*\]\s*$)/g, "");
				h.push('<' + tagName + " ");
				attr = replaceVar(attr, item);
				h.push(attr);
				h.push('>');
				isNull(text) || h.push(text);
				struct.exec && Q.execCatch(function(){
					struct.exec()
				});
				isArray(struct.child) && each(struct.child, function(i, ch) {
					ch && h.push(Q.render(ch, item));
				});				
				h.push('</' + tagName + '>');
				return h.join("");
			},
			/**
				执行方法并捕获异常,不向外抛出异常,try{}catch(e){} 影响方法的美观性
				fun:执行方法
				args:数组,参数[]
				error:抛出异常回调,无异常不回调
			*/
			execCatch: function (fun, args, error) {
				try {
					fun.apply(fun, args||[]);
				} catch (e) {
					Q.log(e, e.stack);
					error && error(e);
				} 
			}
		});
	each([
		Q.url, Q.now
	], function(i, val) {
		val.toString = val
	});
	//不对外部开放,不保持此对象api不变动,
	Q._in = {
		createEvent: function(type) {
			return doc.createEvent ? doc.createEvent(type) : doc.createEventObject(type)
		},
		isSE: function() {
			return !isNull(doc.addEventListener)
		}
	};
	///////////////////////////////////////////////////////
	Q.version = "1.3.62";
	Q.global = win;
	win.Qmik = Q;
	win.$ = win.$ || Q;
})();