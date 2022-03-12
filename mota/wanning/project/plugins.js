var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 =
{
	"init": function () {

		console.log("插件编写测试");

		// 可以写一些直接执行的代码
		// 在这里写的代码将会在【资源加载前】被执行，此时图片等资源尚未被加载。
		// 请勿在这里对包括bgm，图片等资源进行操作。


		this._afterLoadResources = function () {
			// 本函数将在所有资源加载完毕后，游戏开启前被执行
			// 可以在这个函数里面对资源进行一些操作。
			// 若需要进行切分图片，可以使用 core.splitImage() 函数，或直接在全塔属性-图片切分中操作
		}

		// 可以在任何地方（如afterXXX或自定义脚本事件）调用函数，方法为 core.plugin.xxx();
		// 从V2.6开始，插件中用this.XXX方式定义的函数也会被转发到core中，详见文档-脚本-函数的转发。
	},
	"drawLight": function () {

		// 绘制灯光/漆黑层效果。调用方式 core.plugin.drawLight(...)
		// 【参数说明】
		// name：必填，要绘制到的画布名；可以是一个系统画布，或者是个自定义画布；如果不存在则创建
		// color：可选，只能是一个0~1之间的数，为不透明度的值。不填则默认为0.9。
		// lights：可选，一个数组，定义了每个独立的灯光。
		//        其中每一项是三元组 [x,y,r] x和y分别为该灯光的横纵坐标，r为该灯光的半径。
		// lightDec：可选，0到1之间，光从多少百分比才开始衰减（在此范围内保持全亮），不设置默认为0。
		//        比如lightDec为0.5代表，每个灯光部分内圈50%的范围全亮，50%以后才开始快速衰减。
		// 【调用样例】
		// core.plugin.drawLight('curtain'); // 在curtain层绘制全图不透明度0.9，等价于更改画面色调为[0,0,0,0.9]。
		// core.plugin.drawLight('ui', 0.95, [[25,11,46]]); // 在ui层绘制全图不透明度0.95，其中在(25,11)点存在一个半径为46的灯光效果。
		// core.plugin.drawLight('test', 0.2, [[25,11,46,0.1]]); // 创建一个test图层，不透明度0.2，其中在(25,11)点存在一个半径为46的灯光效果，灯光中心不透明度0.1。
		// core.plugin.drawLight('test2', 0.9, [[25,11,46],[105,121,88],[301,221,106]]); // 创建test2图层，且存在三个灯光效果，分别是中心(25,11)半径46，中心(105,121)半径88，中心(301,221)半径106。
		// core.plugin.drawLight('xxx', 0.3, [[25,11,46],[105,121,88,0.2]], 0.4); // 存在两个灯光效果，它们在内圈40%范围内保持全亮，40%后才开始衰减。
		this.drawLight = function (name, color, lights, lightDec) {

			// 清空色调层；也可以修改成其它层比如animate/weather层，或者用自己创建的canvas
			var ctx = core.getContextByName(name);
			if (ctx == null) {
				if (typeof name == 'string')
					ctx = core.createCanvas(name, 0, 0, core.__PIXELS__, core.__PIXELS__, 98);
				else return;
			}

			ctx.mozImageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;
			ctx.msImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;

			core.clearMap(name);
			// 绘制色调层，默认不透明度
			if (color == null) color = 0.9;
			ctx.fillStyle = "rgba(0,0,0," + color + ")";
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			lightDec = core.clamp(lightDec, 0, 1);

			// 绘制每个灯光效果
			ctx.globalCompositeOperation = 'destination-out';
			lights.forEach(function (light) {
				// 坐标，半径，中心不透明度
				var x = light[0],
					y = light[1],
					r = light[2];
				// 计算衰减距离
				var decDistance = parseInt(r * lightDec);
				// 正方形区域的直径和左上角坐标
				var grd = ctx.createRadialGradient(x, y, decDistance, x, y, r);
				grd.addColorStop(0, "rgba(0,0,0,1)");
				grd.addColorStop(1, "rgba(0,0,0,0)");
				ctx.beginPath();
				ctx.fillStyle = grd;
				ctx.arc(x, y, r, 0, 2 * Math.PI);
				ctx.fill();
			});
			ctx.globalCompositeOperation = 'source-over';
			// 可以在任何地方（如afterXXX或自定义脚本事件）调用函数，方法为  core.plugin.xxx();
		}
	},
	"shop": function () {
		// 【全局商店】相关的功能
		// 
		// 打开一个全局商店
		// shopId：要打开的商店id；noRoute：是否不计入录像
		this.openShop = function (shopId, noRoute) {
			var shop = core.status.shops[shopId];
			// Step 1: 检查能否打开此商店
			if (!this.canOpenShop(shopId)) {
				core.drawTip("该商店尚未开启");
				return false;
			}

			// Step 2: （如有必要）记录打开商店的脚本事件
			if (!noRoute) {
				core.status.route.push("shop:" + shopId);
			}

			// Step 3: 检查道具商店 or 公共事件
			if (shop.item) {
				if (core.openItemShop) {
					core.openItemShop(shopId);
				} else {
					core.playSound('操作失败');
					core.insertAction("道具商店插件不存在！请检查是否存在该插件！");
				}
				return;
			}
			if (shop.commonEvent) {
				core.insertCommonEvent(shop.commonEvent, shop.args);
				return;
			}

			_shouldProcessKeyUp = true;

			// Step 4: 执行标准公共商店    
			core.insertAction(this._convertShop(shop));
			return true;
		}

		////// 将一个全局商店转变成可预览的公共事件 //////
		this._convertShop = function (shop) {
			return [
				{ "type": "function", "function": "function() {core.addFlag('@temp@shop', 1);}" },
				{
					"type": "while",
					"condition": "true",
					"data": [
						// 检测能否访问该商店
						{
							"type": "if",
							"condition": "core.isShopVisited('" + shop.id + "')",
							"true": [
								// 可以访问，直接插入执行效果
								{ "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', false) }" },
							],
							"false": [
								// 不能访问的情况下：检测能否预览
								{
									"type": "if",
									"condition": shop.disablePreview,
									"true": [
										// 不可预览，提示并退出
										{ "type": "playSound", "name": "操作失败" },
										"当前无法访问该商店！",
										{ "type": "break" },
									],
									"false": [
										// 可以预览：将商店全部内容进行替换
										{ "type": "tip", "text": "当前处于预览模式，不可购买" },
										{ "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', true) }" },
									]
								}
							]
						}
					]
				},
				{ "type": "function", "function": "function() {core.addFlag('@temp@shop', -1);}" }
			];
		}

		this._convertShop_replaceChoices = function (shopId, previewMode) {
			var shop = core.status.shops[shopId];
			var choices = (shop.choices || []).filter(function (choice) {
				if (choice.condition == null || choice.condition == '') return true;
				try { return core.calValue(choice.condition); } catch (e) { return true; }
			}).map(function (choice) {
				var ableToBuy = core.calValue(choice.need);
				return {
					"text": choice.text,
					"icon": choice.icon,
					"color": ableToBuy && !previewMode ? choice.color : [153, 153, 153, 1],
					"action": ableToBuy && !previewMode ? [{ "type": "playSound", "name": "商店" }].concat(choice.action) : [
						{ "type": "playSound", "name": "操作失败" },
						{ "type": "tip", "text": previewMode ? "预览模式下不可购买" : "购买条件不足" }
					]
				};
			}).concat({ "text": "离开", "action": [{ "type": "playSound", "name": "取消" }, { "type": "break" }] });
			core.insertAction({ "type": "choices", "text": shop.text, "choices": choices });
		}

		/// 是否访问过某个快捷商店
		this.isShopVisited = function (id) {
			if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
			var shops = core.getFlag("__shops__");
			if (!shops[id]) shops[id] = {};
			return shops[id].visited;
		}

		/// 当前应当显示的快捷商店列表
		this.listShopIds = function () {
			return Object.keys(core.status.shops).filter(function (id) {
				return core.isShopVisited(id) || !core.status.shops[id].mustEnable;
			});
		}

		/// 是否能够打开某个商店
		this.canOpenShop = function (id) {
			if (this.isShopVisited(id)) return true;
			var shop = core.status.shops[id];
			if (shop.item || shop.commonEvent || shop.mustEnable) return false;
			return true;
		}

		/// 启用或禁用某个快捷商店
		this.setShopVisited = function (id, visited) {
			if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
			var shops = core.getFlag("__shops__");
			if (!shops[id]) shops[id] = {};
			if (visited) shops[id].visited = true;
			else delete shops[id].visited;
		}

		/// 能否使用快捷商店
		this.canUseQuickShop = function (id) {
			// 如果返回一个字符串，表示不能，字符串为不能使用的提示
			// 返回null代表可以使用

			// 检查当前楼层的canUseQuickShop选项是否为false
			if (core.status.thisMap.canUseQuickShop === false)
				return '当前楼层不能使用快捷商店。';
			return null;
		}

		var _shouldProcessKeyUp = true;

		/// 允许商店X键退出
		core.registerAction('keyUp', 'shops', function (keycode) {
			if (!core.status.lockControl || core.status.event.id != 'action') return false;
			if ((keycode == 13 || keycode == 32) && !_shouldProcessKeyUp) {
				_shouldProcessKeyUp = true;
				return true;
			}

			if (!core.hasFlag("@temp@shop") || core.status.event.data.type != 'choices') return false;
			var data = core.status.event.data.current;
			var choices = data.choices;
			var topIndex = core.actions._getChoicesTopIndex(choices.length);
			if (keycode == 88 || keycode == 27) { // X, ESC
				core.actions._clickAction(core.actions.HSIZE, topIndex + choices.length - 1);
				return true;
			}
			return false;
		}, 60);

		/// 允许长按空格或回车连续执行操作
		core.registerAction('keyDown', 'shops', function (keycode) {
			if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
			if (core.status.event.data.type != 'choices') return false;
			var data = core.status.event.data.current;
			var choices = data.choices;
			var topIndex = core.actions._getChoicesTopIndex(choices.length);
			if (keycode == 13 || keycode == 32) { // Space, Enter
				core.actions._clickAction(core.actions.HSIZE, topIndex + core.status.event.selection);
				_shouldProcessKeyUp = false;
				return true;
			}
			return false;
		}, 60);

		// 允许长按屏幕连续执行操作
		core.registerAction('longClick', 'shops', function (x, y, px, py) {
			if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
			if (core.status.event.data.type != 'choices') return false;
			var data = core.status.event.data.current;
			var choices = data.choices;
			var topIndex = core.actions._getChoicesTopIndex(choices.length);
			if (x >= core.actions.CHOICES_LEFT && x <= core.actions.CHOICES_RIGHT && y >= topIndex && y < topIndex + choices.length) {
				core.actions._clickAction(x, y);
				return true;
			}
			return false;
		}, 60);
	},
	"removeMap": function () {
		// 高层塔砍层插件，删除后不会存入存档，不可浏览地图也不可飞到。
		// 推荐用法：
		// 对于超高层或分区域塔，当在1区时将2区以后的地图删除；1区结束时恢复2区，进二区时删除1区地图，以此类推
		// 这样可以大幅减少存档空间，以及加快存读档速度

		// 删除楼层
		// core.removeMaps("MT1", "MT300") 删除MT1~MT300之间的全部层
		// core.removeMaps("MT10") 只删除MT10层
		this.removeMaps = function (fromId, toId) {
			toId = toId || fromId;
			var fromIndex = core.floorIds.indexOf(fromId),
				toIndex = core.floorIds.indexOf(toId);
			if (toIndex < 0) toIndex = core.floorIds.length - 1;
			flags.__visited__ = flags.__visited__ || {};
			flags.__removed__ = flags.__removed__ || [];
			flags.__disabled__ = flags.__disabled__ || {};
			flags.__leaveLoc__ = flags.__leaveLoc__ || {};
			for (var i = fromIndex; i <= toIndex; ++i) {
				var floorId = core.floorIds[i];
				if (core.status.maps[floorId].deleted) continue;
				delete flags.__visited__[floorId];
				flags.__removed__.push(floorId);
				delete flags.__disabled__[floorId];
				delete flags.__leaveLoc__[floorId];
				(core.status.autoEvents || []).forEach(function (event) {
					if (event.floorId == floorId && event.currentFloor) {
						core.autoEventExecuting(event.symbol, false);
						core.autoEventExecuted(event.symbol, false);
					}
				});
				core.status.maps[floorId].deleted = true;
				core.status.maps[floorId].canFlyTo = false;
				core.status.maps[floorId].canFlyFrom = false;
				core.status.maps[floorId].cannotViewMap = true;
			}
		}

		// 恢复楼层
		// core.resumeMaps("MT1", "MT300") 恢复MT1~MT300之间的全部层
		// core.resumeMaps("MT10") 只恢复MT10层
		this.resumeMaps = function (fromId, toId) {
			toId = toId || fromId;
			var fromIndex = core.floorIds.indexOf(fromId),
				toIndex = core.floorIds.indexOf(toId);
			if (toIndex < 0) toIndex = core.floorIds.length - 1;
			flags.__removed__ = flags.__removed__ || [];
			for (var i = fromIndex; i <= toIndex; ++i) {
				var floorId = core.floorIds[i];
				if (!core.status.maps[floorId].deleted) continue;
				flags.__removed__ = flags.__removed__.filter(function (f) { return f != floorId; });
				core.status.maps[floorId] = core.loadFloor(floorId);
			}
		}

		// 分区砍层相关
		var inAnyPartition = function (floorId) {
			var inPartition = false;
			(core.floorPartitions || []).forEach(function (floor) {
				var fromIndex = core.floorIds.indexOf(floor[0]);
				var toIndex = core.floorIds.indexOf(floor[1]);
				var index = core.floorIds.indexOf(floorId);
				if (fromIndex < 0 || index < 0) return;
				if (toIndex < 0) toIndex = core.floorIds.length - 1;
				if (index >= fromIndex && index <= toIndex) inPartition = true;
			});
			return inPartition;
		}

		// 分区砍层
		this.autoRemoveMaps = function (floorId) {
			if (main.mode != 'play' || !inAnyPartition(floorId)) return;
			// 根据分区信息自动砍层与恢复
			(core.floorPartitions || []).forEach(function (floor) {
				var fromIndex = core.floorIds.indexOf(floor[0]);
				var toIndex = core.floorIds.indexOf(floor[1]);
				var index = core.floorIds.indexOf(floorId);
				if (fromIndex < 0 || index < 0) return;
				if (toIndex < 0) toIndex = core.floorIds.length - 1;
				if (index >= fromIndex && index <= toIndex) {
					core.resumeMaps(core.floorIds[fromIndex], core.floorIds[toIndex]);
				} else {
					core.removeMaps(core.floorIds[fromIndex], core.floorIds[toIndex]);
				}
			});
		}
	},
	"fiveLayers": function () {
		// 是否启用五图层（增加背景2层和前景2层） 将__enable置为true即会启用；启用后请保存后刷新编辑器
		// 背景层2将会覆盖背景层 被事件层覆盖 前景层2将会覆盖前景层
		// 另外 请注意加入两个新图层 会让大地图的性能降低一些
		// 插件作者：ad
		var __enable = false;
		if (!__enable) return;

		// 创建新图层
		function createCanvas (name, zIndex) {
			if (!name) return;
			var canvas = document.createElement('canvas');
			canvas.id = name;
			canvas.className = 'gameCanvas';
			// 编辑器模式下设置zIndex会导致加入的图层覆盖优先级过高
			if (main.mode != "editor") canvas.style.zIndex = zIndex || 0;
			// 将图层插入进游戏内容
			document.getElementById('gameDraw').appendChild(canvas);
			var ctx = canvas.getContext('2d');
			core.canvas[name] = ctx;
			canvas.width = core.__PIXELS__;
			canvas.height = core.__PIXELS__;
			return canvas;
		}

		var bg2Canvas = createCanvas('bg2', 20);
		var fg2Canvas = createCanvas('fg2', 63);
		// 大地图适配
		core.bigmap.canvas = ["bg2", "fg2", "bg", "event", "event2", "fg", "damage"];
		core.initStatus.bg2maps = {};
		core.initStatus.fg2maps = {};

		if (main.mode == 'editor') {
			/*插入编辑器的图层 不做此步新增图层无法在编辑器显示*/
			// 编辑器图层覆盖优先级 eui > efg > fg(前景层) > event2(48*32图块的事件层) > event(事件层) > bg(背景层)
			// 背景层2(bg2) 插入事件层(event)之前(即bg与event之间)
			document.getElementById('mapEdit').insertBefore(bg2Canvas, document.getElementById('event'));
			// 前景层2(fg2) 插入编辑器前景(efg)之前(即fg之后)
			document.getElementById('mapEdit').insertBefore(fg2Canvas, document.getElementById('ebm'));
			// 原本有三个图层 从4开始添加
			var num = 4;
			// 新增图层存入editor.dom中
			editor.dom.bg2c = core.canvas.bg2.canvas;
			editor.dom.bg2Ctx = core.canvas.bg2;
			editor.dom.fg2c = core.canvas.fg2.canvas;
			editor.dom.fg2Ctx = core.canvas.fg2;
			editor.dom.maps.push('bg2map', 'fg2map');
			editor.dom.canvas.push('bg2', 'fg2');

			// 创建编辑器上的按钮
			var createCanvasBtn = function (name) {
				// 电脑端创建按钮
				var input = document.createElement('input');
				// layerMod4/layerMod5
				var id = 'layerMod' + num++;
				// bg2map/fg2map
				var value = name + 'map';
				input.type = 'radio';
				input.name = 'layerMod';
				input.id = id;
				input.value = value;
				editor.dom[id] = input;
				input.onchange = function () {
					editor.uifunctions.setLayerMod(value);
				}
				return input;
			};

			var createCanvasBtn_mobile = function (name) {
				// 手机端往选择列表中添加子选项
				var input = document.createElement('option');
				var id = 'layerMod' + num++;
				var value = name + 'map';
				input.name = 'layerMod';
				input.value = value;
				editor.dom[id] = input;
				return input;
			};
			if (!editor.isMobile) {
				var input = createCanvasBtn('bg2');
				var input2 = createCanvasBtn('fg2');
				// 获取事件层及其父节点
				var child = document.getElementById('layerMod'),
					parent = child.parentNode;
				// 背景层2插入事件层前
				parent.insertBefore(input, child);
				// 不能直接更改背景层2的innerText 所以创建文本节点
				var txt = document.createTextNode('bg2');
				// 插入事件层前(即新插入的背景层2前)
				parent.insertBefore(txt, child);
				// 向最后插入前景层2(即插入前景层后)
				parent.appendChild(input2);
				var txt2 = document.createTextNode('fg2');
				parent.appendChild(txt2);
				parent.childNodes[2].replaceWith("bg");
				parent.childNodes[6].replaceWith("事件");
				parent.childNodes[8].replaceWith("fg");
			} else {
				var input = createCanvasBtn_mobile('bg2');
				var input2 = createCanvasBtn_mobile('fg2');
				// 手机端因为是选项 所以可以直接改innerText
				input.innerText = '背景层2';
				input2.innerText = '前景层2';
				var parent = document.getElementById('layerMod');
				parent.insertBefore(input, parent.children[1]);
				parent.appendChild(input2);
			}
		}

		var _loadFloor_doNotCopy = core.maps._loadFloor_doNotCopy;
		core.maps._loadFloor_doNotCopy = function () {
			return ["bg2map", "fg2map"].concat(_loadFloor_doNotCopy());
		}
		////// 绘制背景和前景层 //////
		core.maps._drawBg_draw = function (floorId, toDrawCtx, cacheCtx, config) {
			config.ctx = cacheCtx;
			core.maps._drawBg_drawBackground(floorId, config);
			// ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制背景图块；后绘制的覆盖先绘制的。
			core.maps._drawFloorImages(floorId, config.ctx, 'bg', null, null, config.onMap);
			core.maps._drawBgFgMap(floorId, 'bg', config);
			if (config.onMap) {
				core.drawImage(toDrawCtx, cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
				core.clearMap('bg2');
				core.clearMap(cacheCtx);
			}
			core.maps._drawBgFgMap(floorId, 'bg2', config);
			if (config.onMap) core.drawImage('bg2', cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
			config.ctx = toDrawCtx;
		}
		core.maps._drawFg_draw = function (floorId, toDrawCtx, cacheCtx, config) {
			config.ctx = cacheCtx;
			// ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制前景图块；后绘制的覆盖先绘制的。
			core.maps._drawFloorImages(floorId, config.ctx, 'fg', null, null, config.onMap);
			core.maps._drawBgFgMap(floorId, 'fg', config);
			if (config.onMap) {
				core.drawImage(toDrawCtx, cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
				core.clearMap('fg2');
				core.clearMap(cacheCtx);
			}
			core.maps._drawBgFgMap(floorId, 'fg2', config);
			if (config.onMap) core.drawImage('fg2', cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
			config.ctx = toDrawCtx;
		}
		////// 移动判定 //////
		core.maps._generateMovableArray_arrays = function (floorId) {
			return {
				bgArray: this.getBgMapArray(floorId),
				fgArray: this.getFgMapArray(floorId),
				eventArray: this.getMapArray(floorId),
				bg2Array: this._getBgFgMapArray('bg2', floorId),
				fg2Array: this._getBgFgMapArray('fg2', floorId)
			};
		}
	},
	"itemShop": function () {
		// 道具商店相关的插件
		// 可在全塔属性-全局商店中使用「道具商店」事件块进行编辑（如果找不到可以在入口方块中找）

		var shopId = null; // 当前商店ID
		var type = 0; // 当前正在选中的类型，0买入1卖出
		var selectItem = 0; // 当前正在选中的道具
		var selectCount = 0; // 当前已经选中的数量
		var page = 0;
		var totalPage = 0;
		var totalMoney = 0;
		var list = [];
		var shopInfo = null; // 商店信息
		var choices = []; // 商店选项
		var use = 'money';
		var useText = '金币';

		var bigFont = core.ui._buildFont(20, false),
			middleFont = core.ui._buildFont(18, false);

		this._drawItemShop = function () {
			// 绘制道具商店

			// Step 1: 背景和固定的几个文字
			core.ui._createUIEvent();
			core.clearMap('uievent');
			core.ui.clearUIEventSelector();
			core.setTextAlign('uievent', 'left');
			core.setTextBaseline('uievent', 'top');
			core.fillRect('uievent', 0, 0, 416, 416, 'black');
			core.drawWindowSkin('winskin.png', 'uievent', 0, 0, 416, 56);
			core.drawWindowSkin('winskin.png', 'uievent', 0, 56, 312, 56);
			core.drawWindowSkin('winskin.png', 'uievent', 0, 112, 312, 304);
			core.drawWindowSkin('winskin.png', 'uievent', 312, 56, 104, 56);
			core.drawWindowSkin('winskin.png', 'uievent', 312, 112, 104, 304);
			core.setFillStyle('uievent', 'white');
			core.setStrokeStyle('uievent', 'white');
			core.fillText("uievent", "购买", 32, 74, 'white', bigFont);
			core.fillText("uievent", "卖出", 132, 74);
			core.fillText("uievent", "离开", 232, 74);
			core.fillText("uievent", "当前" + useText, 324, 66, null, middleFont);
			core.setTextAlign("uievent", "right");
			core.fillText("uievent", core.formatBigNumber(core.status.hero[use]), 405, 89);
			core.setTextAlign("uievent", "left");
			core.ui.drawUIEventSelector(1, "winskin.png", 22 + 100 * type, 66, 60, 33);
			if (selectItem != null) {
				core.setTextAlign('uievent', 'center');
				core.fillText("uievent", type == 0 ? "买入个数" : "卖出个数", 364, 320, null, bigFont);
				core.fillText("uievent", "<   " + selectCount + "   >", 364, 350);
				core.fillText("uievent", "确定", 364, 380);
			}

			// Step 2：获得列表并展示
			list = choices.filter(function (one) {
				if (one.condition != null && one.condition != '') {
					try { if (!core.calValue(one.condition)) return false; } catch (e) { }
				}
				return (type == 0 && one.money != null) || (type == 1 && one.sell != null);
			});
			var per_page = 6;
			totalPage = Math.ceil(list.length / per_page);
			page = Math.floor((selectItem || 0) / per_page) + 1;

			// 绘制分页
			if (totalPage > 1) {
				var half = 156;
				core.setTextAlign('uievent', 'center');
				core.fillText('uievent', page + " / " + totalPage, half, 388, null, middleFont);
				if (page > 1) core.fillText('uievent', '上一页', half - 80, 388);
				if (page < totalPage) core.fillText('uievent', '下一页', half + 80, 388);
			}
			core.setTextAlign('uievent', 'left');

			// 绘制每一项
			var start = (page - 1) * per_page;
			for (var i = 0; i < per_page; ++i) {
				var curr = start + i;
				if (curr >= list.length) break;
				var item = list[curr];
				core.drawIcon('uievent', item.id, 10, 125 + i * 40);
				core.setTextAlign('uievent', 'left');
				core.fillText('uievent', core.material.items[item.id].name, 50, 132 + i * 40, null, bigFont);
				core.setTextAlign('uievent', 'right');
				core.fillText('uievent', (type == 0 ? core.calValue(item.money) : core.calValue(item.sell)) + useText + "/个", 300, 133 + i * 40, null, middleFont);
				core.setTextAlign("uievent", "left");
				if (curr == selectItem) {
					// 绘制描述，文字自动放缩
					var text = core.material.items[item.id].text || "该道具暂无描述";
					try { text = core.replaceText(text); } catch (e) { }
					for (var fontSize = 20; fontSize >= 8; fontSize -= 2) {
						var config = { left: 10, fontSize: fontSize, maxWidth: 403 };
						var height = core.getTextContentHeight(text, config);
						if (height <= 50) {
							config.top = (56 - height) / 2;
							core.drawTextContent("uievent", text, config);
							break;
						}
					}
					core.ui.drawUIEventSelector(2, "winskin.png", 8, 120 + i * 40, 295, 40);
					if (type == 0 && item.number != null) {
						core.fillText("uievent", "存货", 324, 132, null, bigFont);
						core.setTextAlign("uievent", "right");
						core.fillText("uievent", item.number, 406, 132, null, null, 40);
					} else if (type == 1) {
						core.fillText("uievent", "数量", 324, 132, null, bigFont);
						core.setTextAlign("uievent", "right");
						core.fillText("uievent", core.itemCount(item.id), 406, 132, null, null, 40);
					}
					core.setTextAlign("uievent", "left");
					core.fillText("uievent", "预计" + useText, 324, 250);
					core.setTextAlign("uievent", "right");
					totalMoney = selectCount * (type == 0 ? core.calValue(item.money) : core.calValue(item.sell));
					core.fillText("uievent", core.formatBigNumber(totalMoney), 405, 280);

					core.setTextAlign("uievent", "left");
					core.fillText("uievent", type == 0 ? "已购次数" : "已卖次数", 324, 170);
					core.setTextAlign("uievent", "right");
					core.fillText("uievent", (type == 0 ? item.money_count : item.sell_count) || 0, 405, 200);
				}
			}

			core.setTextAlign('uievent', 'left');
			core.setTextBaseline('uievent', 'alphabetic');
		}

		var _add = function (item, delta) {
			if (item == null) return;
			selectCount = core.clamp(
				selectCount + delta, 0,
				Math.min(type == 0 ? Math.floor(core.status.hero[use] / core.calValue(item.money)) : core.itemCount(item.id),
					type == 0 && item.number != null ? item.number : Number.MAX_SAFE_INTEGER)
			);
		}

		var _confirm = function (item) {
			if (item == null || selectCount == 0) return;
			if (type == 0) {
				core.status.hero[use] -= totalMoney;
				core.getItem(item.id, selectCount);
				core.stopSound();
				core.playSound('确定');
				if (item.number != null) item.number -= selectCount;
				item.money_count = (item.money_count || 0) + selectCount;
			} else {
				core.status.hero[use] += totalMoney;
				core.removeItem(item.id, selectCount);
				core.playSound('确定');
				core.drawTip("成功卖出" + selectCount + "个" + core.material.items[item.id].name, item.id);
				if (item.number != null) item.number += selectCount;
				item.sell_count = (item.sell_count || 0) + selectCount;
			}
			selectCount = 0;
		}

		this._performItemShopKeyBoard = function (keycode) {
			var item = list[selectItem] || null;
			// 键盘操作
			switch (keycode) {
				case 38: // up
					if (selectItem == null) break;
					if (selectItem == 0) selectItem = null;
					else selectItem--;
					selectCount = 0;
					break;
				case 37: // left
					if (selectItem == null) {
						if (type > 0) type--;
						break;
					}
					_add(item, -1);
					break;
				case 39: // right
					if (selectItem == null) {
						if (type < 2) type++;
						break;
					}
					_add(item, 1);
					break;
				case 40: // down
					if (selectItem == null) {
						if (list.length > 0) selectItem = 0;
						break;
					}
					if (list.length == 0) break;
					selectItem = Math.min(selectItem + 1, list.length - 1);
					selectCount = 0;
					break;
				case 13:
				case 32: // Enter/Space
					if (selectItem == null) {
						if (type == 2)
							core.insertAction({ "type": "break" });
						else if (list.length > 0)
							selectItem = 0;
						break;
					}
					_confirm(item);
					break;
				case 27: // ESC
					if (selectItem == null) {
						core.insertAction({ "type": "break" });
						break;
					}
					selectItem = null;
					break;
			}
		}

		this._performItemShopClick = function (px, py) {
			var item = list[selectItem] || null;
			// 鼠标操作
			if (px >= 22 && px <= 82 && py >= 71 && py <= 102) {
				// 买
				if (type != 0) {
					type = 0;
					selectItem = null;
					selectCount = 0;
				}
				return;
			}
			if (px >= 122 && px <= 182 && py >= 71 && py <= 102) {
				// 卖
				if (type != 1) {
					type = 1;
					selectItem = null;
					selectCount = 0;
				}
				return;
			}
			if (px >= 222 && px <= 282 && py >= 71 && py <= 102) // 离开
				return core.insertAction({ "type": "break" });
			// < >
			if (px >= 318 && px <= 341 && py >= 348 && py <= 376)
				return _add(item, -1);
			if (px >= 388 && px <= 416 && py >= 348 && py <= 376)
				return _add(item, 1);
			// 确定
			if (px >= 341 && px <= 387 && py >= 380 && py <= 407)
				return _confirm(item);

			// 上一页/下一页
			if (px >= 45 && px <= 105 && py >= 388) {
				if (page > 1) {
					selectItem -= 6;
					selectCount = 0;
				}
				return;
			}
			if (px >= 208 && px <= 268 && py >= 388) {
				if (page < totalPage) {
					selectItem = Math.min(selectItem + 6, list.length - 1);
					selectCount = 0;
				}
				return;
			}

			// 实际区域
			if (px >= 9 && px <= 300 && py >= 120 && py < 360) {
				if (list.length == 0) return;
				var index = parseInt((py - 120) / 40);
				var newItem = 6 * (page - 1) + index;
				if (newItem >= list.length) newItem = list.length - 1;
				if (newItem != selectItem) {
					selectItem = newItem;
					selectCount = 0;
				}
				return;
			}
		}

		this._performItemShopAction = function () {
			if (flags.type == 0) return this._performItemShopKeyBoard(flags.keycode);
			else return this._performItemShopClick(flags.px, flags.py);
		}

		this.openItemShop = function (itemShopId) {
			shopId = itemShopId;
			type = 0;
			page = 0;
			selectItem = null;
			selectCount = 0;
			core.isShopVisited(itemShopId);
			shopInfo = flags.__shops__[shopId];
			if (shopInfo.choices == null) shopInfo.choices = core.clone(core.status.shops[shopId].choices);
			choices = shopInfo.choices;
			use = core.status.shops[shopId].use;
			if (use != 'exp') use = 'money';
			useText = use == 'money' ? '金币' : '经验';

			core.insertAction([{
				"type": "while",
				"condition": "true",
				"data": [
					{ "type": "function", "function": "function () { core.plugin._drawItemShop(); }" },
					{ "type": "wait" },
					{ "type": "function", "function": "function() { core.plugin._performItemShopAction(); }" }
				]
			},
			{
				"type": "function",
				"function": "function () { core.deleteCanvas('uievent'); core.ui.clearUIEventSelector(); }"
			}
			]);
		}

	},
	"enemyLevel": function () {
		// 此插件将提供怪物手册中的怪物境界显示
		// 使用此插件需要先给每个怪物定义境界，方法如下：
		// 点击怪物的【配置表格】，找到“【怪物】相关的表格配置”，然后在【名称】仿照增加境界定义：
		/*
		 "level": {
			  "_leaf": true,
			  "_type": "textarea",
			  "_string": true,
			  "_data": "境界"
		 },
		 */
		// 然后保存刷新，可以看到怪物的属性定义中出现了【境界】。再开启本插件即可。

		// 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
		var __enable = false;
		if (!__enable) return;

		// 这里定义每个境界的显示颜色；可以写'red', '#RRGGBB' 或者[r,g,b,a]四元数组
		var levelToColors = {
			"萌新一阶": "red",
			"萌新二阶": "#FF0000",
			"萌新三阶": [255, 0, 0, 1],
		};

		// 复写 _drawBook_drawName
		var originDrawBook = core.ui._drawBook_drawName;
		core.ui._drawBook_drawName = function (index, enemy, top, left, width) {
			// 如果没有境界，则直接调用原始代码绘制
			if (!enemy.level) return originDrawBook.call(core.ui, index, enemy, top, left, width);
			// 存在境界，则额外进行绘制
			core.setTextAlign('ui', 'center');
			if (enemy.specialText.length == 0) {
				core.fillText('ui', enemy.name, left + width / 2,
					top + 27, '#DDDDDD', this._buildFont(17, true));
				core.fillText('ui', enemy.level, left + width / 2,
					top + 51, core.arrayToRGBA(levelToColors[enemy.level] || '#DDDDDD'), this._buildFont(14, true));
			} else {
				core.fillText('ui', enemy.name, left + width / 2,
					top + 20, '#DDDDDD', this._buildFont(17, true), width);
				switch (enemy.specialText.length) {
					case 1:
						core.fillText('ui', enemy.specialText[0], left + width / 2,
							top + 38, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'),
							this._buildFont(14, true), width);
						break;
					case 2:
						// Step 1: 计算字体
						var text = enemy.specialText[0] + "  " + enemy.specialText[1];
						core.setFontForMaxWidth('ui', text, width, this._buildFont(14, true));
						// Step 2: 计算总宽度
						var totalWidth = core.calWidth('ui', text);
						var leftWidth = core.calWidth('ui', enemy.specialText[0]);
						var rightWidth = core.calWidth('ui', enemy.specialText[1]);
						// Step 3: 绘制
						core.fillText('ui', enemy.specialText[0], left + (width + leftWidth - totalWidth) / 2,
							top + 38, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'));
						core.fillText('ui', enemy.specialText[1], left + (width + totalWidth - rightWidth) / 2,
							top + 38, core.arrayToRGBA((enemy.specialColor || [])[1] || '#FF6A6A'));
						break;
					default:
						core.fillText('ui', '多属性...', left + width / 2,
							top + 38, '#FF6A6A', this._buildFont(14, true), width);
				}
				core.fillText('ui', enemy.level, left + width / 2,
					top + 56, core.arrayToRGBA(levelToColors[enemy.level] || '#DDDDDD'), this._buildFont(14, true));
			}
		}

		// 也可以复写其他的属性颜色如怪物攻防等，具体参见下面的例子的注释部分
		core.ui._drawBook_drawRow1 = function (index, enemy, top, left, width, position) {
			// 绘制第一行
			core.setTextAlign('ui', 'left');
			var b13 = this._buildFont(13, true),
				f13 = this._buildFont(13, false);
			var col1 = left,
				col2 = left + width * 9 / 25,
				col3 = left + width * 17 / 25;
			core.fillText('ui', '生命', col1, position, '#DDDDDD', f13);
			core.fillText('ui', core.formatBigNumber(enemy.hp || 0), col1 + 30, position, /*'red' */ null, b13);
			core.fillText('ui', '攻击', col2, position, null, f13);
			core.fillText('ui', core.formatBigNumber(enemy.atk || 0), col2 + 30, position, /* '#FF0000' */ null, b13);
			core.fillText('ui', '防御', col3, position, null, f13);
			core.fillText('ui', core.formatBigNumber(enemy.def || 0), col3 + 30, position, /* [255, 0, 0, 1] */ null, b13);
		}


	},
	"dynamicHp": function () {
		// 此插件允许人物血量动态进行变化
		// 原作：Fux2（老黄鸡）

		// 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
		var __enable = false;
		if (!__enable) return;

		var speed = 0.05; // 动态血量变化速度，越大越快。

		var _currentHp = null;
		var _lastStatus = null;
		var _check = function () {
			if (_lastStatus != core.status.hero) {
				_lastStatus = core.status.hero;
				_currentHp = core.status.hero.hp;
			}
		}

		core.registerAnimationFrame('dynamicHp', true, function () {
			_check();
			if (core.status.hero.hp != _currentHp) {
				var dis = (_currentHp - core.status.hero.hp) * speed;
				if (Math.abs(dis) < 2) {
					_currentHp = core.status.hero.hp;
				} else {
					_currentHp -= dis;
				}
				core.setStatusBarInnerHTML('hp', _currentHp);
			}
		});
	},
	"multiHeros": function () {
		// 多角色插件
		// Step 1: 启用本插件
		// Step 2: 定义每个新的角色各项初始数据（参见下方注释）
		// Step 3: 在游戏中的任何地方都可以调用 `core.changeHero()` 进行切换；也可以 `core.changeHero(1)` 来切换到某个具体的角色上

		// 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
		var __enable = false;
		if (!__enable) return;

		// 在这里定义全部的新角色属性
		// 请注意，在这里定义的内容不会多角色共用，在切换时会进行恢复。
		// 你也可以自行新增或删除，比如不共用金币则可以加上"money"的初始化，不共用道具则可以加上"items"的初始化，
		// 多角色共用hp的话则删除hp，等等。总之，不共用的属性都在这里进行定义就好。
		var hero1 = {
			"floorId": "MT0", // 该角色初始楼层ID；如果共用楼层可以注释此项
			"image": "brave.png", // 角色的行走图名称；此项必填不然会报错
			"name": "1号角色",
			"lv": 1,
			"hp": 10000, // 如果HP共用可注释此项
			"atk": 1000,
			"def": 1000,
			"mdef": 0,
			// "money": 0, // 如果要不共用金币则取消此项注释
			// "exp": 0, // 如果要不共用经验则取消此项注释
			"loc": { "x": 0, "y": 0, "direction": "up" }, // 该角色初始位置；如果共用位置可注释此项
			"items": {
				"tools": {}, // 如果共用消耗道具（含钥匙）则可注释此项
				// "constants": {}, // 如果不共用永久道具（如手册）可取消注释此项
				"equips": {}, // 如果共用在背包的装备可注释此项
			},
			"equipment": [], // 如果共用装备可注释此项；此项和上面的「共用在背包的装备」需要拥有相同状态，不然可能出现问题
		};
		// 也可以类似新增其他角色
		// 新增的角色，各项属性共用与不共用的选择必须和上面完全相同，否则可能出现问题。
		// var hero2 = { ...

		var heroCount = 2; // 包含默认角色在内总共多少个角色，该值需手动修改。

		this.initHeros = function () {
			core.setFlag("hero1", core.clone(hero1)); // 将属性值存到变量中
			// core.setFlag("hero2", core.clone(hero2)); // 更多的角色也存入变量中；每个定义的角色都需要新增一行

			// 检测是否存在装备
			if (hero1.equipment) {
				if (!hero1.items || !hero1.items.equips) {
					alert('多角色插件的equipment和道具中的equips必须拥有相同状态！');
				}
				// 存99号套装为全空
				var saveEquips = core.getFlag("saveEquips", []);
				saveEquips[99] = [];
				core.setFlag("saveEquips", saveEquips);
			} else {
				if (hero1.items && hero1.items.equips) {
					alert('多角色插件的equipment和道具中的equips必须拥有相同状态！');
				}
			}
		}

		// 在游戏开始注入initHeros
		var _startGame_setHard = core.events._startGame_setHard;
		core.events._startGame_setHard = function () {
			_startGame_setHard.call(core.events);
			core.initHeros();
		}

		// 切换角色
		// 可以使用 core.changeHero() 来切换到下一个角色
		// 也可以 core.changeHero(1) 来切换到某个角色（默认角色为0）
		this.changeHero = function (toHeroId) {
			var currHeroId = core.getFlag("heroId", 0); // 获得当前角色ID
			if (toHeroId == null) {
				toHeroId = (currHeroId + 1) % heroCount;
			}
			if (currHeroId == toHeroId) return;

			var saveList = Object.keys(hero1);

			// 保存当前内容
			var toSave = {};
			// 暂时干掉 drawTip 和 音效，避免切装时的提示
			var _drawTip = core.ui.drawTip;
			core.ui.drawTip = function () { };
			var _playSound = core.control.playSound;
			core.control.playSound = function () { }
			// 记录当前录像，因为可能存在换装问题
			core.clearRouteFolding();
			var routeLength = core.status.route.length;
			// 优先判定装备
			if (hero1.equipment) {
				core.items.quickSaveEquip(100 + currHeroId);
				core.items.quickLoadEquip(99);
			}

			saveList.forEach(function (name) {
				if (name == 'floorId') toSave[name] = core.status.floorId; // 楼层单独设置
				else if (name == 'items') {
					toSave.items = core.clone(core.status.hero.items);
					Object.keys(toSave.items).forEach(function (one) {
						if (!hero1.items[one]) delete toSave.items[one];
					});
				} else toSave[name] = core.clone(core.status.hero[name]); // 使用core.clone()来创建新对象
			});

			core.setFlag("hero" + currHeroId, toSave); // 将当前角色信息进行保存
			var data = core.getFlag("hero" + toHeroId); // 获得要切换的角色保存内容

			// 设置角色的属性值
			saveList.forEach(function (name) {
				if (name == "floorId");
				else if (name == "items") {
					Object.keys(core.status.hero.items).forEach(function (one) {
						if (data.items[one]) core.status.hero.items[one] = core.clone(data.items[one]);
					});
				} else {
					core.status.hero[name] = core.clone(data[name]);
				}
			});
			// 最后装上装备
			if (hero1.equipment) {
				core.items.quickLoadEquip(100 + toHeroId);
			}

			core.ui.drawTip = _drawTip;
			core.control.playSound = _playSound;
			core.status.route = core.status.route.slice(0, routeLength);
			core.control._bindRoutePush();

			// 插入事件：改变角色行走图并进行楼层切换
			var toFloorId = data.floorId || core.status.floorId;
			var toLoc = data.loc || core.status.hero.loc;
			core.insertAction([
				{ "type": "setHeroIcon", "name": data.image || "hero.png" }, // 改变行走图
				// 同层则用changePos，不同层则用changeFloor；这是为了避免共用楼层造成触发eachArrive
				toFloorId != core.status.floorId ? {
					"type": "changeFloor",
					"floorId": toFloorId,
					"loc": [toLoc.x, toLoc.y],
					"direction": toLoc.direction,
					"time": 0 // 可以在这里设置切换时间
				} : { "type": "changePos", "loc": [toLoc.x, toLoc.y], "direction": toLoc.direction }
				// 你还可以在这里执行其他事件，比如增加或取消跟随效果
			]);
			core.setFlag("heroId", toHeroId); // 保存切换到的角色ID
		}
	},
	"itemCategory": function () {
		// 物品分类插件。此插件允许你对消耗道具和永久道具进行分类，比如标记「宝物类」「剧情道具」「药品」等等。
		// 使用方法：
		// 1. 启用本插件
		// 2. 在下方数组中定义全部的物品分类类型
		// 3. 点击道具的【配置表格】，找到“【道具】相关的表格配置”，然后在【道具描述】之后仿照增加道具的分类：
		/*
		 "category": {
			  "_leaf": true,
			  "_type": "textarea",
			  "_string": true,
			  "_data": "道具分类"
		 },
		 */
		// （你也可以选择使用下拉框的方式定义每个道具的分类，写法参见上面的cls）
		// 然后刷新编辑器，就可以对每个物品进行分类了

		// 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
		var __enable = false;
		if (!__enable) return;

		// 在这里定义所有的道具分类类型，一行一个
		var categories = [
			"宝物类",
			"辅助类",
			"技能类",
			"剧情道具",
			"增益道具",
		];
		// 当前选中的道具类别
		var currentCategory = null;

		// 重写 core.ui._drawToolbox 以绘制分类类别
		var _drawToolbox = core.ui._drawToolbox;
		core.ui._drawToolbox = function (index) {
			_drawToolbox.call(this, index);
			core.setTextAlign('ui', 'left');
			core.fillText('ui', '类别[E]：' + (currentCategory || "全部"), 15, this.PIXEL - 13);
		}

		// 获得所有应该在道具栏显示的某个类型道具
		core.ui.getToolboxItems = function (cls) {
			// 检查类别
			return Object.keys(core.status.hero.items[cls])
				.filter(function (id) {
					return !core.material.items[id].hideInToolbox &&
						(currentCategory == null || core.material.items[id].category == currentCategory);
				}).sort();
		}

		// 注入道具栏的点击事件（点击类别）
		var _clickToolbox = core.actions._clickToolbox;
		core.actions._clickToolbox = function (x, y) {
			if (x >= 0 && x <= this.HSIZE - 4 && y == this.LAST) {
				drawToolboxCategory();
				return;
			}
			return _clickToolbox.call(core.actions, x, y);
		}

		// 注入道具栏的按键事件（E键）
		var _keyUpToolbox = core.actions._keyUpToolbox;
		core.actions._keyUpToolbox = function (keyCode) {
			if (keyCode == 69) {
				// 按E键则打开分类类别选择
				drawToolboxCategory();
				return;
			}
			return _keyUpToolbox.call(core.actions, keyCode);
		}

		// ------ 以下为选择道具分类的相关代码 ------ //

		// 关闭窗口时清除分类选择项
		var _closePanel = core.ui.closePanel;
		core.ui.closePanel = function () {
			currentCategory = null;
			_closePanel.call(core.ui);
		}

		// 弹出菜单以选择具体哪个分类
		// 直接使用 core.drawChoices 进行绘制
		var drawToolboxCategory = function () {
			if (core.status.event.id != 'toolbox') return;
			var selection = categories.indexOf(currentCategory) + 1;
			core.ui.closePanel();
			core.status.event.id = 'toolbox-category';
			core.status.event.selection = selection;
			core.lockControl();
			// 给第一项插入「全部」
			core.drawChoices('请选择道具类别', ["全部"].concat(categories));
		}

		// 选择某一项
		var _selectCategory = function (index) {
			core.ui.closePanel();
			if (index <= 0 || index > categories.length) currentCategory = null;
			else currentCategory = categories[index - 1];
			core.openToolbox();
		}

		var _clickToolBoxCategory = function (x, y) {
			if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;

			if (x < core.actions.CHOICES_LEFT || x > core.actions.CHOICES_RIGHT) return false;
			var choices = core.status.event.ui.choices;
			var topIndex = core.actions._getChoicesTopIndex(choices.length);
			if (y >= topIndex && y < topIndex + choices.length) {
				_selectCategory(y - topIndex);
			}
			return true;
		}

		// 注入点击事件
		core.registerAction('onclick', 'toolbox-category', _clickToolBoxCategory, 100);

		// 注入光标跟随事件
		core.registerAction('onmove', 'toolbox-category', function (x, y) {
			if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
			core.actions._onMoveChoices(x, y);
			return true;
		}, 100);

		// 注入键盘光标事件
		core.registerAction('keyDown', 'toolbox-category', function (keyCode) {
			if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
			core.actions._keyDownChoices(keyCode);
			return true;
		}, 100);

		// 注入键盘按键事件
		core.registerAction('keyUp', 'toolbox-category', function (keyCode) {
			if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
			core.actions._selectChoices(core.status.event.ui.choices.length, keyCode, _clickToolBoxCategory);
			return true;
		}, 100);

	},
	"heroFourFrames": function () {
		// 样板的勇士/跟随者移动时只使用2、4两帧，观感较差。本插件可以将四帧全用上。

		// 是否启用本插件
		var __enable = false;
		if (!__enable) return;

		["up", "down", "left", "right"].forEach(function (one) {
			// 指定中间帧动画
			core.material.icons.hero[one].midFoot = 2;
		});

		var heroMoving = function (timestamp) {
			if (core.status.heroMoving <= 0) return;
			if (timestamp - core.animateFrame.moveTime > core.values.moveSpeed) {
				core.animateFrame.leftLeg++;
				core.animateFrame.moveTime = timestamp;
			}
			core.drawHero(['stop', 'leftFoot', 'midFoot', 'rightFoot'][core.animateFrame.leftLeg % 4], 4 * core.status.heroMoving);
		}
		core.registerAnimationFrame('heroMoving', true, heroMoving);

		core.events._eventMoveHero_moving = function (step, moveSteps) {
			var curr = moveSteps[0];
			var direction = curr[0], x = core.getHeroLoc('x'), y = core.getHeroLoc('y');
			// ------ 前进/后退
			var o = direction == 'backward' ? -1 : 1;
			if (direction == 'forward' || direction == 'backward') direction = core.getHeroLoc('direction');
			var faceDirection = direction;
			if (direction == 'leftup' || direction == 'leftdown') faceDirection = 'left';
			if (direction == 'rightup' || direction == 'rightdown') faceDirection = 'right';
			core.setHeroLoc('direction', direction);
			if (curr[1] <= 0) {
				core.setHeroLoc('direction', faceDirection);
				moveSteps.shift();
				return true;
			}
			if (step <= 4) core.drawHero('stop', 4 * o * step);
			else if (step <= 8) core.drawHero('leftFoot', 4 * o * step);
			else if (step <= 12) core.drawHero('midFoot', 4 * o * (step - 8));
			else if (step <= 16) core.drawHero('rightFoot', 4 * o * (step - 8)); // if (step == 8) {
			if (step == 8 || step == 16) {
				core.setHeroLoc('x', x + o * core.utils.scan2[direction].x, true);
				core.setHeroLoc('y', y + o * core.utils.scan2[direction].y, true);
				core.updateFollowers();
				curr[1]--;
				if (curr[1] <= 0) moveSteps.shift();
				core.setHeroLoc('direction', faceDirection);
				return step == 16;
			}
			return false;
		}
	},
	"startCanvas": function () {
		// 使用本插件可以将自绘的标题界面居中。仅在【标题开启事件化】后才有效。
		// 由于一些技术性的原因，标题界面事件化无法应用到覆盖状态栏的整个界面。
		// 这是一个较为妥协的插件，会在自绘标题界面时隐藏状态栏、工具栏和边框，并将画布进行居中。
		// 本插件仅在全塔属性的 "startCanvas" 生效；进入 "startText" 时将会离开居中状态，回归正常界面。

		// 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
		var __enable = false;
		if (!__enable) return;

		// 检查【标题开启事件化】是否开启
		if (!core.flags.startUsingCanvas || main.mode != 'play') return;

		var _isTitleCanvasEnabled = false;
		var _getClickLoc = core.actions._getClickLoc;
		this._setTitleCanvas = function () {
			if (_isTitleCanvasEnabled) return;
			_isTitleCanvasEnabled = true;

			// 禁用窗口resize
			window.onresize = function () { };
			core.resize = function () { }

			// 隐藏状态栏
			core.dom.statusBar.style.display = 'none';
			core.dom.statusCanvas.style.display = 'none';
			core.dom.toolBar.style.display = 'none';
			// 居中画布
			if (core.domStyle.isVertical) {
				core.dom.gameDraw.style.top =
					(parseInt(core.dom.gameGroup.style.height) - parseInt(core.dom.gameDraw.style.height)) / 2 + "px";
			} else {
				core.dom.gameDraw.style.right =
					(parseInt(core.dom.gameGroup.style.width) - parseInt(core.dom.gameDraw.style.width)) / 2 + "px";
			}
			core.dom.gameDraw.style.border = '3px transparent solid';
			core.actions._getClickLoc = function (x, y) {
				var left = core.dom.gameGroup.offsetLeft + core.dom.gameDraw.offsetLeft + 3;
				var top = core.dom.gameGroup.offsetTop + core.dom.gameDraw.offsetTop + 3;
				var loc = { 'x': Math.max(x - left, 0), 'y': Math.max(y - top, 0), 'size': 32 * core.domStyle.scale };
				return loc;
			}
		}

		this._resetTitleCanvas = function () {
			if (!_isTitleCanvasEnabled) return;
			_isTitleCanvasEnabled = false;
			window.onresize = function () { try { main.core.resize(); } catch (e) { main.log(e); } }
			core.resize = function () { return core.control.resize(); }
			core.resize();
			core.actions._getClickLoc = _getClickLoc;
		}

		// 复写“开始游戏”
		core.events._startGame_start = function (hard, seed, route, callback) {
			console.log('开始游戏');
			core.resetGame(core.firstData.hero, hard, null, core.cloneArray(core.initStatus.maps));
			core.setHeroLoc('x', -1);
			core.setHeroLoc('y', -1);

			if (seed != null) {
				core.setFlag('__seed__', seed);
				core.setFlag('__rand__', seed);
			} else core.utils.__init_seed();

			core.clearStatusBar();
			core.plugin._setTitleCanvas();

			var todo = [];
			core.hideStatusBar();
			core.push(todo, core.firstData.startCanvas);
			core.push(todo, { "type": "function", "function": "function() { core.plugin._resetTitleCanvas(); core.events._startGame_setHard(); }" })
			core.push(todo, core.firstData.startText);
			this.insertAction(todo, null, null, function () {
				core.events._startGame_afterStart(callback);
			});

			if (route != null) core.startReplay(route);
		}

		var _loadData = core.control.loadData;
		core.control.loadData = function (data, callback) {
			core.plugin._resetTitleCanvas();
			_loadData.call(core.control, data, callback);
		}
	},
	"warning": function () {
		var timeout;
		/** warning提示
		 * @param {number} x 横坐标
		 * @param {number} y 纵坐标
		 * @param {string} text 显示的文字
		 */
		this.drawWarning = function (x, y, text) {
			if (typeof timeout === 'number') return;
			core.dom.killed.style.display = 'none';
			x = x || 6;
			y = y || 6;
			text = text || 'boss';
			text += '</br>';
			for (var i = 0; i < 10; i++) text += '&nbsp;';
			text += 'danger';
			// 生成文字
			var elements = document.querySelectorAll('.gameCanvas');
			var t = document.createElement('p');
			t.innerHTML = text;
			t.style.position = 'absolute';
			t.style.fontSize = '4em';
			t.style.left = -(300 * core.domStyle.scale) + 'px';
			t.style.top = (parseInt(elements[0].style.height) / 2 - 100) + 'px';
			t.style.zIndex = '300';
			t.style.color = '#f11';
			t.style.fontFamily = '"normal"';
			t.style.overflow = 'none';
			t.style.width = '100%';
			t.classList.add('warning');
			core.dom.gameDraw.appendChild(t);
			setTimeout(function () { t.style.left = (416 * core.domStyle.scale) + 'px' }, 50);
			// 计算偏移量
			var px = (6 - x) / 12 * 50;
			var py = (6 - y) / 12 * 50;
			// 修改画布的scale和transform
			elements.forEach(function (v) {
				if (v instanceof HTMLCanvasElement) {
					v.style.transform = 'scale(2)translate(' + px + '%, ' + py + '%)';
				}
			});
			var id = core.playStereo('danger.mp3', 1, 0);
			core.moveStereo(id, 0, 1, 1000);
			setTimeout(function () { core.moveStereo(id, 1, 0, 1000) }, 1000);
			setTimeout(function () { core.moveStereo(id, 0, 1, 1000) }, 2000);
			setTimeout(function () { core.moveStereo(id, 1, 0, 1000) }, 3000);
			// 拉回镜头
			timeout = setTimeout(function () {
				timeout = setTimeout(function () {
					timeout = void 0;
					core.dom.gameDraw.removeChild(t);
					core.dom.killed.style.display = 'block';
				}, 1500);
				elements.forEach(function (v) {
					if (v instanceof HTMLCanvasElement) {
						v.style.transform = 'none';
					}
				});
			}, 1600);
		}
	},
	"formation": function () {

		/** 四方阵
		 * @param {Enemy} enemy
		 */
		this.square = function (x, y, enemy, floorId) {
			if (enemy.notBomb) return;
			var level = core.status.maps[floorId].formationLevel[core.status.maps[floorId].formation.indexOf(28)];
			var blocks = core.getMapBlocksObj(floorId);

			function hasBlock (x, y) {
				var block = blocks[x + ',' + y];
				return block !== void 0;
			}

			var l = core.clamp(x - level, 0, 12);
			var r = core.clamp(x + level, 0, 12);
			var t = core.clamp(y - level, 0, 12);
			var b = core.clamp(y + level, 0, 12);
			// 在四周范围内重新生成怪物
			for (var dx = l; dx <= r; dx++) {
				for (var dy = t; dy <= b; dy++) {
					if (dx < 0 || dy < 0 || (dx === x && dy === y)) continue;
					if (!hasBlock(dx, dy)) {
						// 转变图块
						core.setBlock(enemy.id, dx, dy, floorId, true);
					}
				}
			}
		}

		/** 连锁阵 */
		this.chain = function (x, y, enemy, floorId) {
			if (enemy.notBomb) return;
			var level = core.status.maps[floorId].formationLevel[core.status.maps[floorId].formation.indexOf(30)];
			var blocks = core.getMapBlocksObj(floorId);

			var all = core.searchBlock(enemy.id);
			all.push({ id: enemy.id, x: x, y: y });

			function hasBlock (x, y) {
				var block = blocks[x + ',' + y];
				return block !== void 0;
			}

			all.forEach(function (block) {
				var l = core.clamp(block.x - level, 0, 12);
				var r = core.clamp(block.x + level, 0, 12);
				var t = core.clamp(block.y - level, 0, 12);
				var b = core.clamp(block.y + level, 0, 12);
				// 在四周范围内重新生成怪物
				for (var dx = l; dx <= r; dx++) {
					if (dx > 12 || dy > 12) continue;
					for (var dy = t; dy <= b; dy++) {
						if (dx < 0 || dy < 0 || (dx === block.x && dy === block.y)) continue;
						if (!hasBlock(dx, dy)) {
							// 转变图块
							core.setBlock(enemy.id, dx, dy, floorId, true);
						}
					}
				}
			});
		}

		/** 自爆阵 */
		this.explodeEnemy = function (x, y, enemy, floorId, eExplode) {
			if (eExplode > 3) return;
			var level = core.status.maps[floorId].formationLevel[core.status.maps[floorId].formation.indexOf(31)];
			// 先检测勇士是否在范围内
			var loc = core.status.hero.loc;
			var l = (core.clamp(level * 2 + 1, 0, 7) - 1) / 2;
			var damage = enemy.hp * level / 10 - core.status.hero.mdef;
			if (Math.abs(loc.x - x) <= l && Math.abs(loc.y - y) <= l) {
				if (damage <= 0) damage = 0;
				core.addPop(loc.x * 32 + 16, loc.y * 32 + 16, damage);
				core.status.hero.hp -= damage;
				if (core.status.hero.hp <= 0) return;
			}
			damage += core.status.hero.mdef;
			// 防爆栈
			eExplode = eExplode !== 0 ? eExplode + 1 : 1;
			core.drawAnimate('explode', x, y);
			// 遍历
			var blocks = core.searchBlockWithFilter(function (block) {
				return (Math.abs(block.x - x) <= l) && (Math.abs(block.y - y) <= l) &&
					(block.event.cls === 'enemys') && !((block.x === x) && (block.y === y));
			}, core.status.floorId);
			blocks.forEach(function (block) {
				core.attack(block.x, block.y, damage, block.block.event.id, { eExplode: eExplode, explode: true });
			});
			core.saveHp(floorId);
		}

		/** 吸收阵 */
		this.absorb = function () {
			var level = core.status.thisMap.formationLevel[core.status.thisMap.formation.indexOf(33)];
			if (!level) return;
			// 搜索有阵法的怪物
			var all = core.searchBlockWithFilter(function (block) {
				var enemy = core.material.enemys[block.event.id];
				if (!enemy) return false;
				if (typeof enemy.special === 'number') enemy.special = [enemy.special];
				return enemy.special.some(function (v) { return v >= 28 && v <= 100; });
			});

			var hps = core.status.thisMap.hps;

			/** 吸收
			 * @param {{x: number, y: number}} target
			 * @param {{x: number, y: number}} self
			 */
			function absorb (target, self) {
				hps[self.x + ',' + self.y] += Math.ceil((hps[target.x + ',' + target.y] || 0) * level / 2);
				delete hps[target.x + ',' + target.y];
			}

			var r = core.clamp(level, 0, 3);
			all.forEach(function (v) {
				// 循环
				var absorbed = false;
				for (var dx = v.x - r; dx <= v.x + r; dx++) {
					if (dx < 0 || dx > 12) continue;
					for (var dy = v.y - r; dy <= v.y + r; dy++) {
						if (dx < 0 || dy < 0 || (dx === v.x && dy === v.y)) continue;
						if (core.getBlockCls(dx, dy) !== 'enemys') continue;
						absorb({ x: dx, y: dy }, { x: v.x, y: v.y });
						core.addAbsorb({ x: v.x, y: v.y }, dx, dy);
						absorbed = true;
					}
				}
				if (absorbed) core.drawAnimate('absorb', v.x, v.y);
			});
			core.updateStatusBar();
		}

		/** 数字函数对应关系 */
		var dict = {
			28: this.square,
			29: function () { return; },
			30: this.chain,
			31: this.explodeEnemy,
			32: function () { return; },
			33: function () { return; }
		}

		/** 数字与特殊属性名的对应关系 */
		var dict2 = {
			28: 'square',
			29: 'strengthen',
			30: 'chain',
			31: 'explode',
			32: 'relive',
			33: 'absorb'
		}
		this.dict2 = dict2;

		/** 扫描地图上的阵法 */
		this.scanFormation = function (floorId) {
			floorId = floorId || core.status.floorId;
			var floor = core.status.maps[floorId];
			floor.formation = [];
			floor.formationLevel = [];
			var formation = [];
			var levels = [];
			core.extractBlocks(floorId);
			var bobj = core.getMapBlocksObj(floorId);
			var blocks = floor.blocks;
			blocks.forEach(function (block) {
				var id = block.event.id;
				var enemy = core.material.enemys[id];
				if (enemy) {
					var special = enemy.special;
					if (!special) return;
					if (typeof special === 'number') special = [special];
					var filtered = special.filter(function (v) { return v >= 28 && v <= 100; });
					if (filtered.length === 0) return;
					formation = formation.concat(filtered);
					var l = filtered.map(function (v) { return core.material.enemys[bobj[block.x + ',' + block.y].event.id][dict2[v]] });
					levels = levels.concat(l);
				}
			});
			// 合并相同项，等级取最大值
			for (var i = 0; i < formation.length; i++) {
				var n = formation[i];
				var level = 0;
				for (var j = 0; j < formation.length; j++) {
					if (formation[j] === n) {
						if (levels[j] > level) level = levels[j];
					}
				}
				floor.formationLevel.push(level);
				floor.formation.push(n);
				levels = levels.filter(function (v, i) { return formation[i] !== n; });
				formation = formation.filter(function (v) { return v !== n; });
				i = -1;
			}
			// 强化阵
			var ii = floor.formation.indexOf(29);
			if (ii !== -1) {
				floor.formationLevel = floor.formationLevel.map(function (v, i, a) {
					if (i === ii) return v;
					return v += a[ii];
				});
			}
			// 重生信息
			if (floor.formationLevel.includes(32)) {
				if (!core.status.maps[floorId].relive) core.status.maps[floorId].relive = {};
			}
			core.updateStatusBar();
		}

		/** 执行阵法效果 */
		this.doFormation = function (x, y, floorId, eExplode) {
			var block = core.getMapBlocksObj(floorId)[x + ',' + y];
			if (!block) return;
			var formation = core.status.maps[floorId].formation || [];
			formation.forEach(function (v) {
				return dict[v](x, y, core.material.enemys[block.event.id], floorId, eExplode);
			});
		}
	},
	"drawFormation": function () {
		// 查看某个地图的阵法
		var enemyList = [];
		var timeout = 0;

		/** 获取某个怪物的特殊属性
		 * @param {string} enemy
		 * @param {number} x
		 * @param {number} y
		 * @returns {string[]}
		 */
		function getSpecial (enemy, x, y) {
			var e = core.getEnemyInfo(enemy, null, x, y);
			if (typeof e.special === 'number') e.special = [e.special];
			if (!e.special) e.special = [];
			var all = core.getSpecials();
			var formation = e.special.filter(function (v) { return v >= 28 && v <= 100; });
			all = all.filter(function (v) { return formation.includes(v[0]); });
			var texts = [];
			all.forEach(function (v) {
				var t = core.getSpecialHint(enemy, v[0]);
				texts.push(t);
			});
			return texts;
		}

		/** 获取所有阵法 */
		function getAll (floorId) {
			core.scanFormation(floorId);
			var formation = core.status.maps[floorId].formation;
			var levels = core.status.maps[floorId].formationLevel;
			var dict = core.plugin.dict2;
			var enemy = {};
			formation.forEach(function (v, i) { enemy[dict[v]] = levels[i]; });
			var texts = [];
			formation.forEach(function (v) {
				var t = core.getSpecialHint(enemy, v);
				if (v === 29) t += '（其余阵法显示为已强化的）';
				texts.push(t);
			});
			return texts;
		}

		/** 绘制阵法怪详细信息
		 * @param {number} index
		 * @param {number} x
		 * @param {number} y
		 */
		function drawDetail (index, x, y) {
			core.playStereo('光标移动', 1 - x / 12, x / 12);
			deleteDetail(true);
			// 获取文字并计算高度
			var specials = getSpecial(enemyList[index].event.id, x, y);
			var text = specials.join('\n');
			var width = core.clamp((x > 6 ? x * 32 : ((12 - x) * 32)) - 24, 0, 280);
			var left = x < 6 ? 396 - width : 10
			var config = { maxWidth: width - 20, font: 'normal', fontSize: 19, left: 10 };
			var height = 416;
			while (height > 396) { config.fontSize--; height = core.getTextContentHeight(text, config) + 20; }
			var top = core.clamp(y * 32 - height / 2, 10, 396 - height);
			config.top = 10;
			config.time = 2;
			config.color = 'white';
			config.align = 'left';
			// 开始绘制
			var box = core.createCanvas('formationBox', left, top, width, height, 190);
			box.canvas.className = 'formation';
			box.canvas.style.border = 'thick double #32a1ce';
			box.canvas.style.opacity = '0';
			box.canvas.style.transition = 'opacity 0.2s linear';
			box.canvas.style.backgroundColor = '#333';
			box.canvas.style.boxShadow = '0px 0px 0px black';
			setTimeout(function () { box.canvas.style.opacity = '1'; }, 50);
			setTimeout(function () {
				clearInterval(core.status.event.interval);
				core.clearMap(box);
				core.drawTextContent(box, text, config);
			}, 250);
		}

		/** 删除详细信息
		 * @param {number} index
		 */
		function deleteDetail (immediate) {
			var box = core.getContextByName('formationBox');
			clearTimeout(timeout);
			if (!box) return;
			if (immediate) {
				core.deleteCanvas(box);
				return;
			}
			box.canvas.style.opacity = '0';
			timeout = setTimeout(function () {
				core.deleteCanvas(box);
			}, 200);
		}

		/** 绘制剩余内容 */
		function drawOther (floorId) {
			// 退出
			var exit = core.createCanvas('formationExit', 3, 3, 60, 22, 185);
			exit.canvas.className = 'formation';
			exit.canvas.style.pointerEvents = 'auto';
			exit.canvas.style.backgroundColor = '#aaa';
			exit.canvas.style.border = '0.2em outset #ccc';
			exit.canvas.style.boxShadow = '0px 0px 0px black';
			exit.canvas.style.opacity = '0';
			exit.canvas.addEventListener('click', function () {
				close();
			});
			setTimeout(function () { exit.canvas.style.opacity = '1'; }, 50);
			core.setTextAlign(exit, 'center');
			core.fillText(exit, '退出', 30, 20, '#fff', '24px normal');
			// 注释
			var tip = core.createCanvas('formationTip', 0, 384, 416, 32, 185);
			tip.canvas.style.transition = 'opacity 0.6s linear';
			tip.canvas.style.opacity = '0';
			setTimeout(function () { tip.canvas.style.opacity = '1' }, 50);
			setTimeout(function () {
				core.drawTextContent(tip, '注：请不要非常快速地移动鼠标，否则可能会出bug', { left: 10, top: 6, fontSize: 18, font: 'normal' });
			}, 650);
			// 总览
			var overview = core.createCanvas('formationOverview', 0, -391, 409, 384, 210);
			overview.canvas.className = 'formationOverview';
			overview.canvas.style.pointerEvents = 'auto';
			overview.canvas.style.backgroundColor = '#333';
			overview.canvas.style.border = '0.3em double #32a1ce';
			overview.canvas.addEventListener('click', function () { deleteDetail(); closeOverview(); });
			// 绘制阵法
			var text = getAll(floorId).join('\n');
			var height = 384;
			var config = { left: 10, top: 10, font: 'normal', fontSize: 19, maxWidth: 396 };
			while (height > 364) { config.fontSize--; height = core.getTextContentHeight(text, config); }
			core.drawTextContent(overview, text, config);
			// 总览索引
			var index = core.createCanvas('formationIndex', 160, 0, 96, 24, 185);
			index.canvas.className = 'formationOverview';
			index.canvas.classList.add('formation');
			index.canvas.style.borderTop = 'none';
			index.canvas.style.borderLeft = '0.2em outset #ccc';
			index.canvas.style.borderRight = '0.2em outset #ccc';
			index.canvas.style.borderBottom = '0.2em outset #ccc';
			index.canvas.style.backgroundColor = '#aaa';
			index.canvas.style.opacity = '0';
			index.canvas.style.pointerEvents = 'auto';
			index.canvas.addEventListener('click', function () {
				deleteDetail();
				if (parseInt(overview.canvas.getAttribute('_top')) > -384) {
					closeOverview();
				} else {
					displayOverview();
				}
			});
			setTimeout(function () { index.canvas.style.opacity = '1'; }, 50);
			core.setTextAlign(index, 'center');
			core.fillText(index, '总览', 48, 22, '#fff', '24px normal');
		}

		/** 显示总览 */
		function displayOverview () {
			core.playSound('光标移动');
			core.relocateCanvas('formationIndex', 160, 388);
			core.relocateCanvas('formationOverview', 0, 0);
		}

		/** 关闭总览 */
		function closeOverview () {
			core.playSound('光标移动');
			core.relocateCanvas('formationIndex', 160, 0);
			core.relocateCanvas('formationOverview', 0, -391);
		}

		/** 退出 */
		function close () {
			core.playSound('光标移动');
			var all = Object.values(core.dymCanvas).filter(function (v) { return v.canvas.id.startsWith('formation'); });
			all.forEach(function (v) {
				v.canvas.style.opacity = '0';
			});
			setTimeout(function () {
				core.deleteCanvas(function (name) { return name.startsWith('formation'); });
				clearTimeout(timeout);
				enemyList = [];
				core.unlockControl();
			}, 600);
		}

		/** 打开查看界面
		 * @param {string} floorId
		 */
		this.openFormation = function (floorId) {
			if (Object.keys(core.dymCanvas).some(function (v) {
				return v.startsWith('skill') || v.startsWith('formation') ||
					v.startsWith('sniper');
			})) return;
			core.lockControl();
			var canvases = [];
			flags.inFormation = true;
			// 获取带有阵法怪物的位置
			var all = core.searchBlockWithFilter(function (block) {
				var enemy = core.material.enemys[block.event.id]
				if (!enemy) return false;
				if (typeof enemy.special === 'number') enemy.special = [enemy.special];
				if (!enemy.special) enemy.special = [];
				return enemy.special.some(function (v) { return v >= 28 && v <= 100; });
			}, floorId);
			// 绘制背景及含有阵法的怪物
			var back = core.createCanvas('formation', 0, 0, 416, 416, 171);
			back.canvas.style.pointerEvents = 'auto';
			back.canvas.className = 'formation';
			back.canvas.style.border = '0px solid';
			back.canvas.addEventListener('click', function () { deleteDetail(); });
			all.forEach(function (v, i) {
				enemyList.push(v.block);
				var enemy = core.createCanvas('formation' + i, v.x * 32, v.y * 32, 32, 32, 180);
				enemy.canvas.className = 'formation';
				enemy.canvas.style.opacity = '0';
				enemy.canvas.id = 'formation' + i;
				enemy.canvas.style.pointerEvents = 'auto';
				enemy.canvas.style.backgroundColor = '#555';
				canvases.push(enemy);
				enemy.canvas.addEventListener('mouseenter', function () {
					var index = this.id.match(/[0-9]+/)[0];
					drawDetail(index, enemyList[index].x, enemyList[index].y);
				});
				enemy.canvas.addEventListener('mouseleave', function () {
					deleteDetail();
				})
			});
			this.drawFormationEnemy(core.status.globalAnimateStatus);
			setTimeout(function () {
				canvases.forEach(function (v) {
					v.canvas.style.opacity = '1';
				});
			}, 50);
			setTimeout(function () { back.canvas.style.backgroundColor = 'rgba(0,0,0,0.9)'; }, 50);
			drawOther(floorId);
		}

		/** 绘制怪物 */
		this.drawFormationEnemy = function (frame) {
			enemyList.forEach(function (v, i) {
				var info = core.getBlockInfo(v);
				info.posX = frame % info.animate;
				var ctx = core.getContextByName('formation' + i);
				core.clearMap(ctx);
				core.drawImage(ctx, info.image, info.posX * 32, info.posY * 32, 32, 32, 0, 0, 32, 32);
			});
		}
	},
	"skill": function () {

		var imgs = [];
		var interval = 0;

		/** 定义技能 */
		var skills = this.skills = {
			explode: {
				name: '地爆天星', id: 'explode',
				description: function (level) {
					var r = core.clamp(level * 2 + 1, 0, 7);
					return '用火焰引爆对方！打败一个怪物后，产生一个' + r + '×' + r + '的爆炸，其中的所有怪物受到勇士攻击' + (level * 2 + 1) + '回合的伤害';
				},
			},
			laser: {
				name: '激光纵横', id: 'laser',
				description: function (level) {
					return '让敌人体验激光的威力吧！打败一个怪物后，产生一个怪物坐标为中心的横竖激光，激光内的怪物受到勇士攻击' + (level * 2 + 2) + '回合的伤害';
				}
			},
			chain: {
				name: '打草惊草', id: 'chain',
				description: function (level) {
					return '让敌人体验一下从天而降的攻击吧！打败一个怪物后，地图上所有的同种怪物受到勇士攻击' + (level * 2 + 2) + '回合的伤害';
				}
			},
			chainBoom: {
				name: '连锁风暴', id: 'chainBoom',
				description: function (level) {
					return '让敌人体验一下从天而来的炸弹吧！打败一个怪物后，地图上所有同种怪物周围3×3范围内的怪物受到勇士攻击' + (level * 2) + '回合的伤害';
				}
			},
			sniper: {
				name: '定点狙击', id: 'sniper',
				description: function (level) {
					return '\r[gold]主动技能，快捷键1\r[]，开启后，可以挑选地图上的怪物进行狙击，对目标怪物造成勇士攻击' + (level * 5) + '回合的伤害，每个地图限用3次';
				}
			}
		};

		/** 获取各个技能的等级 */
		this.getSkillLevel = function () {
			if (!flags.skillLevel) {
				flags.skillLevel = {};
				Object.keys(skills).forEach(function (v) { flags.skillLevel[v] = 0 });
				flags.skillLevel.explode = 1;
			}
			return flags.skillLevel;
		}

		/** 选择
		 * @param {number} index
		 */
		function select (index) {
			core.playSound('光标移动');
			imgs.forEach(function (v) {
				v.canvas.style.transform = '';
			});
			var img = imgs[index];
			img.canvas.style.transform = 'scale(1.2)';
			core.relocateCanvas('skillDescription', 48, -416 * index);
		}

		/** 绘制第一项 */
		function drawFirst (ctx, id, desc) {
			setTimeout(function () {
				// 绘制标题
				var level = core.getSkillLevel()[id] || 0;
				core.fillText(ctx, '当前等级：' + level + '级', 183, 60, 'white', '17px normal');
				core.fillText(ctx, skills[id].name, 183, 40, 'white', '30px normal');
				// 绘制说明
				var config = { left: 10, top: 65, maxWidth: 348, fontSize: 18, font: 'normal', align: 'left' };
				config.time = 10;
				clearInterval(core.status.event.interval);
				core.drawTextContent(ctx, desc, config);
				setTimeout(function () {
					core.drawImage(ctx, id + 'Effect.png', 33, 200, 300, 200);
					ctx.shadowBlur = 5;
					core.strokeRect(ctx, 32, 199, 302, 202, '#ccc', 2);
					ctx.shadowBlur = 0;
				}, 500);
			}, 350);
		}

		/** 绘制所有技能描述到一个画布上 */
		function drawDescription () {
			var list = Object.keys(skills);
			var ctx = core.createCanvas('skillDescription', 48, 0, 368, 416 * (list.length + 1), 185);
			var levels = core.getSkillLevel();
			ctx.canvas.style.opacity = '0';
			ctx.canvas.className = 'skill';
			ctx.canvas.style.boxShadow = '0px 0px 0px black';
			ctx.shadowColor = 'black';
			var i = 0;
			interval = setInterval(function () {
				var v = list[i];
				var level = levels[v] || 0;
				var desc = '        ' + skills[v].description(level || 1);
				// 第一项逐项绘制，其余直接绘制
				if (i === 0) { i++; return drawFirst(ctx, v, desc); }
				core.setTextAlign(ctx, 'center');
				core.fillText(ctx, skills[v].name, 183, 416 * i + 40, 'white', '30px normal');
				core.fillText(ctx, '当前等级：' + level + '级', 183, 416 * i + 60, 'white', '17px normal');
				var config = { left: 10, top: 416 * i + 65, maxWidth: 348, fontSize: 18, font: 'normal', align: 'left' };
				requestAnimationFrame(function () { core.drawTextContent(ctx, desc, config); });
				core.drawImage(ctx, v + 'Effect.png', 33, 200 + 416 * i, 300, 200);
				ctx.shadowBlur = 5;
				core.strokeRect(ctx, 32, 199 + 416 * i, 302, 202, '#ccc', 2);
				ctx.shadowBlur = 0;
				i++;
				if (i >= list.length) {
					clearInterval(interval);
					interval = 0;
				}
			}, 200);
			setTimeout(function () { ctx.canvas.style.opacity = '1'; }, 50);
		}

		/** 绘制剩余内容 */
		function drawOther () {
			// 退出
			var exit = core.createCanvas('skillExit', 0, 388, 44, 24, 200);
			exit.canvas.className = 'skill';
			exit.canvas.style.pointerEvents = 'auto';
			exit.canvas.style.backgroundColor = '#aaa';
			exit.canvas.style.border = '0.2em outset #ccc';
			exit.canvas.style.boxShadow = '0px 0px 0px black';
			exit.canvas.style.opacity = '0';
			exit.canvas.addEventListener('click', close);
			setTimeout(function () { exit.canvas.style.opacity = '1'; }, 50);
			core.setTextAlign(exit, 'center');
			core.fillText(exit, '退出', 22, 20, 'white', '22px normal');
		}

		/** 退出 */
		function close () {
			core.playSound('光标移动');
			var all = Object.values(core.dymCanvas).filter(function (v) { return v.canvas.id.startsWith('skill'); });
			all.forEach(function (v) {
				v.canvas.style.opacity = '0';
			});
			setTimeout(function () {
				core.unlockControl();
				imgs = [];
				core.deleteCanvas(function (name) {
					return name.startsWith('skill');
				});
			}, 600);
		}

		/** 打开技能查看页面 */
		this.openSkill = function () {
			if (Object.keys(core.dymCanvas).some(function (v) {
				return v.startsWith('skill') || v.startsWith('formation') ||
					v.startsWith('sniper');
			})) return;
			core.lockControl();
			clearInterval(interval);
			interval = 0;
			// 背景
			var back = core.createCanvas('skill', 0, 0, 416, 416, 180);
			back.canvas.className = 'skill';
			setTimeout(function () { back.canvas.style.backgroundColor = 'rgba(0,0,0,0.9)'; }, 50);
			// image
			var levels = core.getSkillLevel();
			Object.keys(skills).forEach(function (v, i) {
				var level = levels[v];
				var img = core.createCanvas('skill' + i, 8, 8 + 40 * i, 32, 32, 185);
				if (!level) img.canvas.style.filter = 'grayscale(1)';
				img.canvas.className = 'skill';
				img.canvas.style.opacity = '0';
				img.canvas.style.boxShadow = '0px 0px 0px black';
				img.canvas.style.pointerEvents = 'auto';
				img.canvas.addEventListener('mouseenter', function () {
					select(parseInt(this.id.match(/[0-9]+/)[0]));
				});
				core.drawImage(img, v + '.png', 0, 0, 32, 32);
				imgs.push(img);
			});
			core.drawLine(back, 48, 0, 48, 416, 'rgba(255,255,255,0.7)', 1);
			setTimeout(function () { imgs.forEach(function (v) { v.canvas.style.opacity = '1'; }); }, 50);
			// 默认选中第一项
			select(0);
			drawDescription();
			// 剩余内容
			drawOther();
		}
	},
	"realSkill": function () {
		/** 攻击某个怪物 */
		this.attack = function (x, y, damage, id, option) {
			if (damage < 0) return;
			var floor = core.status.thisMap;
			floor.hps[x + ',' + y] -= damage;
			if (floor.hps[x + ',' + y] <= 0) core.events.afterBattle(id, x, y, option);
			core.addPop(x * 32 + 16, y * 32 + 16, core.formatBigNumber(damage));
		}

		/** 地爆天星 */
		this.explode = function (x, y) {
			var level = core.getSkillLevel().explode;
			if (!level) return;
			var blocks = core.getMapBlocksObj();
			core.drawAnimate('explode', x, y);
			core.playStereo('118-Fire02.mp3', 1 - x / 12, x / 12);
			var l = core.clamp(x - level, x - 3, x + 3); var r = core.clamp(x + level, x - 3, x + 3);
			var t = core.clamp(y - level, y - 3, y + 3); var b = core.clamp(y + level, y - 3, y + 3);
			for (var dx = l; dx <= r; dx++) {
				for (var dy = t; dy <= b; dy++) {
					if (dx < 0 || dx > 12 || dy < 0 || dy > 12) continue;
					if (dx === x && dy === y) continue;
					var block = blocks[dx + ',' + dy];
					if (!block) continue;
					var e = core.material.enemys[block.event.id];
					if (!e) continue;
					var enemy = core.getEnemyInfo(e, null, dx, dy);
					var damage = (core.status.hero.atk - enemy.def) * (level * 2 + 1);
					this.attack(dx, dy, damage, block.event.id, { explode: true });
				}
			}
		}

		/** 激光纵横 */
		this.laser = function (x, y) {
			var level = core.getSkillLevel().laser;
			if (!level) return;
			var blocks = core.getMapBlocksObj();

			function attack (xx, yy) {
				var block = blocks[xx + ',' + yy];
				if (!block) return false;
				var e = core.material.enemys[block.event.id];
				if (!e) return false;
				var enemy = core.getEnemyInfo(e, null, xx, yy);
				var damage = (core.status.hero.atk - enemy.def) * (level * 2 + 2);
				core.attack(xx, yy, damage, block.event.id, { explode: true });
				return true;
			}

			// 横向
			for (var dx = 0; dx <= 12; dx++) {
				if (dx === x) continue;
				attack(dx, y);
			}
			// 纵向
			for (var dy = 0; dy <= 12; dy++) {
				if (dy === y) continue;
				attack(x, dy);
			}
			this.addLaser(x, y);
		}

		function laser () {
			var ctx = core.getContextByName('laser');
			if (!ctx) ctx = core.createCanvas('laser', 0, 0, 416, 416, 80);
			core.clearMap(ctx);
			var lasers = core.status.lasers || [];
			var toDelete = [];
			lasers.forEach(function (one, i) {
				one.frame++;
				// 绘制 由frame计算得opacity
				var opacity = (one.frame * (20 - one.frame)) / 100;
				core.setAlpha(ctx, opacity);
				var color = core.arrayToRGBA([255, 0, 255, opacity])
				ctx.shadowColor = color;
				ctx.shadowBlur = 5;
				var px = one.x * 32 + 16;
				var py = one.y * 32 + 16;
				core.drawLine(ctx, 0, py, 416, py, color, 2);
				core.drawLine(ctx, px, 0, px, 416, color, 2);
				if (one.frame >= 20) toDelete.push(i);
			});
			toDelete.forEach(function (v) {
				lasers.splice(v, 1);
				for (var i in toDelete) toDelete[i]--;
			});
		}
		core.registerAnimationFrame('laser', true, laser);

		/** 绘制激光 */
		this.addLaser = function (x, y) {
			var data = { x: x, y: y, frame: 0 };
			if (!core.status.lasers) core.status.lasers = [data];
			else core.status.lasers.push(data);
			// 音效
			var id = core.playStereo('laser.mp3', 1 - x / 12, x / 12, false);
			core.moveStereo(id, x / 12, 1 - x / 12, 500);
		};

		/** 打草惊草 */
		this.chainHero = function (enemy, x, y) {
			var level = core.getSkillLevel().chain;
			if (!level) return;
			var all = core.searchBlock(enemy);
			all.forEach(function (block) {
				if (block.x === x && block.y === y) return;
				var e = core.material.enemys[block.block.event.id];
				if (!e) return;
				var enemy = core.getEnemyInfo(e, null, block.x, block.y);
				var damage = (core.status.hero.atk - enemy.def) * (level * 2 + 2);
				core.drawAnimate('hand', block.x, block.y);
				core.attack(block.x, block.y, damage, block.block.event.id, { explode: true });
			});
		}

		/** 连锁风暴 */
		this.chainBoom = function (enemy, x, y) {
			var level = core.getSkillLevel().chainBoom;
			if (!level) return;
			var all = core.searchBlock(enemy);
			all.forEach(function (block) {
				if (block.x === x && block.y === y) return;
				var e = core.material.enemys[block.block.event.id];
				if (!e) return;
				for (var dx = block.x - 1; dx <= block.x + 1; dx++) {
					for (var dy = block.y - 1; dy <= block.y + 1; dy++) {
						if (dx < 0 || dx > 12 || dy < 0 || dy > 12) continue;
						if (dx === block.x && dy === block.y) continue;
						if (core.getBlockCls(dx, dy) !== 'enemys') continue;
						var enemy = core.getEnemyInfo(e, null, dx, dy);
						var damage = (core.status.hero.atk - enemy.def) * level * 2;
						core.attack(dx, dy, damage, block.block.event.id, { explode: true });
					}
				}
				core.drawAnimate('explode', block.x, block.y);
			});
		}
	},
	"sniper": function () {
		var enemyList = [];
		var selector;
		var selected = 0;

		/** 选择 */
		function select (index) {
			core.playSound('光标移动');
			core.relocateCanvas(selector, enemyList[index].x * 32 - 16, enemyList[index].y * 32 - 16);
			selected = index;
		}

		/** 绘制瞄准光标 */
		function drawSelector () {
			selector = core.createCanvas('sniperSelector', enemyList[0].x * 32 - 16, enemyList[0].y * 32 - 16, 64, 64, 195);
			selector.canvas.style.pointerEvents = 'auto';
			core.strokeCircle(selector, 32, 32, 20, 'red', 1.5);
			core.fillCircle(selector, 32, 32, 2, 'red');
			core.drawLine(selector, 0, 32, 20, 32, 'red', 1.5);
			core.drawLine(selector, 44, 32, 64, 32, 'red', 1.5);
			core.drawLine(selector, 32, 0, 32, 20, 'red', 1.5);
			core.drawLine(selector, 32, 44, 32, 64, 'red', 1.5);
			selector.canvas.addEventListener('click', function () { shoot(selected); });
		}

		/** 射击 */
		function shoot (index) {
			core.autosave();
			var hps = core.status.thisMap.hps;
			var level = core.getSkillLevel().sniper;
			var block = enemyList[index];
			var enemy = core.getEnemyInfo(block.event.id, null, block.x, block.y);
			var damage = (core.status.hero.atk - enemy.def) * level * 5;
			hps[block.x + ',' + block.y] -= damage;
			core.addPop(block.x * 32 + 16, block.y * 32 + 16, core.formatBigNumber(damage));
			if (hps[block.x + ',' + block.y] <= 0) core.events.afterBattle(block.event.id, block.x, block.y);
			close(true);
			var id = core.playStereo('sniper.mp3', 1 - block.x / 12, block.x / 12, true);
			var target = 0;
			if (block.x < 6) target = 12;
			if (block.x === 6) target = 6;
			core.moveStereo(id, 1 - target / 12, target / 12, 300);
			core.updateStatusBar();
			if (core.status.thisMap.sniper) core.status.thisMap.sniper++;
			else core.status.thisMap.sniper = 1;
		}

		/** 关闭 */
		function close (immediate) {
			enemyList = [];
			selected = 0;
			selector = void 0;
			flags.inSniper = false;
			if (immediate) {
				core.unlockControl();
				core.deleteCanvas('sniperBack');
				core.deleteCanvas('sniperExit');
				core.deleteCanvas('sniperInfo');
				core.deleteCanvas(function (name) { return /sniper[0-9]+/.test(name); });
				var ctx = core.getContextByName('sniperSelector');
				ctx.canvas.style.animationPlayState = 'paused';
				ctx.canvas.style.filter = 'blur(20px)grayscale(1)';
				ctx.canvas.style.opacity = '0';
				setTimeout(function () { core.deleteCanvas('sniperSelector'); }, 2000);
			} else {
				var all = Object.values(core.dymCanvas).filter(function (v) { return v.canvas.id.startsWith('sniper'); });
				all.forEach(function (v) {
					v.canvas.style.transition = 'opacity 0.6s linear';
				});
				setTimeout(function () {
					all.forEach(function (v) {
						v.canvas.style.opacity = '0';
					});
				}, 50);
				setTimeout(function () {
					core.unlockControl();
					core.deleteCanvas(function (name) { return name.startsWith('sniper'); });
				}, 650);
			}
		}

		/** 绘制狙击界面 */
		this.openSniper = function () {
			if (Object.keys(core.dymCanvas).some(function (v) {
				return v.startsWith('skill') || v.startsWith('formation') ||
					v.startsWith('sniper');
			})) return;
			if ((core.status.thisMap.sniper || 0) >= 3) return core.drawTip('本地图狙击次数已用完！');
			var level = core.getSkillLevel().sniper;
			if (!level) return;
			flags.inSniper = true;
			core.lockControl();
			// 背景
			var back = core.createCanvas('sniperBack', 0, 0, 416, 416, 180);
			back.canvas.className = 'formation';
			back.canvas.style.border = 'none';
			setTimeout(function () { back.canvas.style.backgroundColor = 'rgba(0,0,0,0.9)'; }, 50);
			// 绘制所有怪物
			var all = core.searchBlockWithFilter(function (block) { return block.event.cls.startsWith('enemy'); });
			all.forEach(function (v, i) {
				enemyList.push(v.block);
				var enemy = core.createCanvas('sniper' + i, v.x * 32, v.y * 32, 32, 32, 190);
				enemy.canvas.style.pointerEvents = 'auto';
				enemy.canvas.addEventListener('mouseenter', function () {
					select(parseInt(this.id.match(/[0-9]+/)));
				});
			});
			// 绘制怪物信息
			var info = core.createCanvas('sniperInfo', 0, 0, 416, 416, 191);
			core.status.damage.data.forEach(function (v) {
				core.fillBoldText(info, v.text, v.px, v.py, v.color, 'black', '15px normal');
			});
			// 退出
			var exit = core.createCanvas('sniperExit', 3, 3, 60, 22, 185);
			exit.canvas.className = 'formation';
			exit.canvas.style.pointerEvents = 'auto';
			exit.canvas.style.backgroundColor = '#aaa';
			exit.canvas.style.border = '0.2em outset #ccc';
			exit.canvas.style.boxShadow = '0px 0px 0px black';
			exit.canvas.style.opacity = '0';
			exit.canvas.addEventListener('click', function () {
				close();
			});
			setTimeout(function () { exit.canvas.style.opacity = '1'; }, 50);
			core.setTextAlign(exit, 'center');
			core.fillText(exit, '退出', 30, 20, '#fff', '24px normal');

			drawSelector();
			this.drawSniperEnemy(core.status.globalAnimateStatus);
		}

		/** 绘制怪物 */
		this.drawSniperEnemy = function (frame) {
			enemyList.forEach(function (v, i) {
				var info = core.getBlockInfo(v);
				info.posX = frame % info.animate;
				var ctx = core.getContextByName('sniper' + i);
				core.clearMap(ctx);
				core.drawImage(ctx, info.image, info.posX * 32, info.posY * 32, 32, 32, 0, 0, 32, 32);
			});
		}
	},
	"upgrade": function () {
		var skills = this.skills;
		var imgs = [];
		var selector;
		var interval = 0;
		var upgraded = false;

		/** 到达某一层的时候可以升级的技能 */
		var list = [
			[], ['explode', 'laser'], ['laser', 'chain'], ['explode', 'chain'], ['explode', 'chain', 'laser'], // 0~4
			['explode', 'chainBoom', 'laser'], ['explode', 'laser', 'chain'], [], ['sniper'], ['sniper'] // 5~9
		];

		/** 选择
		 * @param {number} index 
		 * @param {string} floorId 
		 */
		function select (index, floorId) {
			if (index < 0 || index >= imgs.length) return;
			if (selector === index) return;
			selector = index;
			var img = imgs[index];
			img.canvas.style.transform = 'scale(1.2)';
			imgs.forEach(function (v, i) { if (i !== index) v.canvas.style.transform = ''; });
			var skill = list[floorId.match(/[0-9]+/)[0]][index]
			var description = skills[skill].description((core.getSkillLevel()[skill] + 1) || 1);
			core.clearMap('skill', 0, 196, 416, 416);
			clearInterval(core.status.event.interval);
			core.drawTextContent('skill', '        ' + description, {
				left: 20, top: 200, fontSize: 18, time: 2, font: 'normal', maxWidth: 376
			});
		}

		/** 随机漂浮
		 * @param {HTMLCanvasElement} img 
		 */
		function floating (img) {
			// 随机漂浮
			clearInterval(interval);
			interval = setInterval(function () {
				img.style.transform = 'scale(1.2)translate(' + ~~(Math.random() * 20 - 10) + 'px,' + ~~(Math.random() * 20 - 10) + 'px)';
			}, 200);
		}

		/** 点击
		 * @param {number} index 
		 * @param {string} floorId
		 */
		function click (index, floorId) {
			if (selector !== index) return select(index, floorId);
			if (upgraded) return;
			// 升级技能
			var skill = list[floorId.match(/[0-9]+/)[0]][index];
			if (!flags.skillLevel[skill]) flags.skillLevel[skill] = 0;
			flags.skillLevel[skill]++;
			core.playSound('光标移动');
			upgraded = true;
			close(index);
		}

		/** 关闭 */
		function close (index) {
			var canvases = Object.values(core.dymCanvas).filter(function (v) {
				return v.canvas.id.startsWith('skill');
			});
			var target = canvases.filter(function (v) { return v.canvas.id === 'skill' + index })[0];
			clearInterval(interval);
			target.canvas.style.transform = 'scale(1.2)';
			target.canvas.classList.add('skillTarget');
			target.canvas.style.boxShadow = '0px 0px 0px black';
			setTimeout(function () {
				core.clearMap(target);
				core.resizeCanvas(target, 90, 64);
				core.relocateCanvas(target, -13, 0, true);
				core.setTextAlign(target, 'center');
				core.fillText(target, '升级成功', 45, 42, 'white', '20px normal');
			}, 500);
			setTimeout(function () {
				canvases.forEach(function (v) {
					v.canvas.style.opacity = '0';
				});
			}, 2000);
			setTimeout(function () {
				core.deleteCanvas(function (name) {
					return name.startsWith('skill');
				});
				selector = void 0;
				upgraded = false;
				core.unlockControl();
			}, 2600);
		}

		/** 打开 */
		this.openUpgrade = function (floorId) {
			if (Object.keys(core.dymCanvas).some(function (v) {
				return v.startsWith('skill') || v.startsWith('formation') ||
					v.startsWith('sniper');
			})) return;
			imgs = [];
			var skill = list[floorId.match(/[0-9]+/)[0]];
			if (!skill || skill.length === 0) {
				return;
			}
			setTimeout(core.lockControl, 10);
			var ctx = core.createCanvas('skill', 0, 0, 416, 416, 170);
			ctx.canvas.className = 'skill';
			setTimeout(function () { ctx.canvas.style.backgroundColor = 'rgba(0,0,0,0.9)' }, 50);
			// 绘制图片 一图片一画布
			var length = skill.length;
			skill.forEach(function (v, i) {
				var img = core.createCanvas('skill' + i, (i + 1) / (length + 1) * 416 - 32, 40, 64, 64, 180);
				img.canvas.style.pointerEvents = 'auto';
				img.canvas.className = 'skill';
				img.canvas.id = 'skill' + i;
				img.canvas.style.opacity = '0';
				imgs.push(img);
				core.drawImage(img, v + '.png', 0, 0, 64, 64);
				img.canvas.addEventListener('mouseenter', function (ev) {
					if (!core.domStyle.isVertical)
						select(parseInt(this.id.match(/[0-9]+/)[0]), floorId);
					floating(this);
				});
				img.canvas.addEventListener('click', function (ev) {
					click(parseInt(this.id.match(/[0-9]+/)[0]), floorId);
				});
			});
			setTimeout(function () { imgs.forEach(function (v) { v.canvas.style.opacity = '1'; }); }, 50);
			setTimeout(function () {
				var levels = core.getSkillLevel();
				skill.forEach(function (v, i) {
					var level = (levels[v] + 1) || 1;
					core.setTextAlign(ctx, 'center');
					core.fillText(ctx, skills[v].name, (i + 1) / (length + 1) * 416, 140, 'white', '20px normal');
					core.fillText(ctx, '下一级：' + level + '级', (i + 1) / (length + 1) * 416, 158, 'white', '18px normal');
				});
				core.fillText(ctx, '下一级效果', 208, 195, 'white', '20px normal')
			}, 600);
		}
	},
	"utils": function () {
		core.dom.openFormation.addEventListener('click', function () { core.openFormation(core.status.floorId); });
		core.dom.openSkill.addEventListener('click', function () { core.openSkill(); });

		core.registerResize('killed', function () {
			var size = (5 / 3 * core.domStyle.scale).toFixed(2);
			core.dom.killed.style.font = 'bold ' + size + 'em normal';
			core.dom.delta.style.font = 'bold ' + size + 'em normal';
		});

		/** 暂存所有怪物的血量 */
		this.saveHp = function (floorId) {
			var floor = core.status.maps[floorId];
			if (!floor.hps) floor.hps = {};
			floor.blocks.forEach(function (block) {
				var enemy = core.material.enemys[block.event.id];
				if (!enemy) return;
				if (floor.hps[block.x + ',' + block.y]) return;
				else floor.hps[block.x + ',' + block.y] = enemy.hp;
			});
		}

		/** 将血量数据存入存档 */
		this.saveHpsToSave = function () {
			var data = {}
			core.floorIds.forEach(function (v) {
				data[v] = core.status.maps[v].hps;
			});
			return data;
		}

		var ctx;
		/** 血量弹出 */
		function pop () {
			if (!ctx) return;
			core.clearMap(ctx);
			var list = core.status.pop || [];
			var count = 0;
			list.forEach(function (one) {
				// 由frame计算出dy
				var dy = 6 - one.frame * 0.2;
				var dx = 1;
				one.py -= dy;
				one.px += dx;
				one.frame++;
				// 绘制
				if (one.frame >= 60) core.setAlpha(ctx, 3 - one.frame / 30);
				else core.setAlpha(ctx, 1);
				core.fillBoldText(ctx, one.value, one.px, one.py, one.color || 'red', one.boldColor || 'black', '20px normal');
				if (one.frame >= 90) count++;
			});
			if (count > 0) list.splice(0, count);
		}
		core.registerAnimationFrame('pop', true, pop);

		/** 添加弹出内容 */
		this.addPop = function (px, py, value, color, boldColor) {
			if (!flags.pop) return;
			if (value == 0) return;
			if (!core.dymCanvas.pop) ctx = core.createCanvas('pop', 0, 0, 416, 416, 90);
			var data = { px: px, py: py, value: value, color: color, boldColor: boldColor, frame: 0 };
			if (!core.status.pop) core.status.pop = [data];
			else core.status.pop.push(data);
		}

		/** 怪物显示血量 */
		this.displayHp = function (floorId) {
			if (!flags.enemyHp) return;
			var hps = core.status.maps[floorId].hps;
			for (var l in hps) {
				var text = core.formatBigNumber(hps[l]);
				if (text === '???') continue;
				var loc = l.split(',');
				loc = loc.map(function (v) { return parseInt(v); });
				var data = {
					px: loc[0] * 32 + 1,
					py: loc[1] * 32 + 11,
					text: text,
					color: '#3f3'
				}
				core.status.damage.data.push(data);
			}
		}

		/** 保存杀敌数 */
		this.saveKilled = function () {
			var data = {}
			core.floorIds.forEach(function (v) {
				data[v] = core.status.maps[v].killed;
			});
			return data;
		}

		var timeout;
		var timeout2;
		var timeout3;
		/** 显示杀敌数 */
		function drawKilled () {
			if (!core.status.thisMap) return;
			if (!flags.floorId) flags.floorId = core.status.floorId;
			var killed = core.status.thisMap.killed || 0;
			var last = flags.killed;
			if (last === void 0) last = flags.killed = killed;
			var p = core.dom.killed;
			var text = '杀敌数：' + killed.toString();
			if (p.innerHTML !== text) p.innerHTML = text;
			if (last === killed) return;
			if (flags.floorId !== core.status.floorId) {
				flags.floorId = core.status.floorId;
				flags.killed = killed;
				return;
			}
			flags.floorId = core.status.floorId;
			clearTimeout(timeout);
			flags.killed = killed;
			// 调整scale，放大
			p.style.transform = 'scale(1.3)';
			timeout = setTimeout(function () { p.style.transform = ''; }, 100);
			// 显示+n
			displayDelta(killed - last);
		}
		/** 显示 +n */
		function displayDelta (delta) {
			clearTimeout(timeout2); clearTimeout(timeout3);
			if ((flags.maxDelta || 0) < delta) flags.maxDelta = delta;
			var p = core.dom.delta;
			delta = delta > 0 ? '+' + delta : delta.toString();
			p.innerHTML = delta;
			p.style.transform = 'scale(1.3)';
			var x = 255 - 255 * delta / (flags.maxDelta || 5);
			p.style.color = core.arrayToRGB([255, x, x]);
			timeout2 = setTimeout(function () { p.style.transform = '' }, 100);
			timeout3 = setTimeout(function () { p.innerHTML = '' }, 3000);
		}
		core.registerAnimationFrame('killed', true, drawKilled);

		/** 增加杀敌数 */
		this.addKilled = function (value, floorId) {
			if (!core.status.maps[floorId].killed) core.status.maps[floorId].killed = 0;
			core.status.maps[floorId].killed += value;
		}

		/** 吸收阵动画 */
		function absorb () {
			var absorb = core.status.absorb || [];
			var count = 0;
			absorb.forEach(function (v) {
				v.frame++;
				if (v.frame >= 48) count++;
			});
			if (count > 0) {
				for (var i = 0; i < count; i++) {
					core.dom.gameDraw.removeChild(absorb[i].ctx.canvas);
					delete core.dymCanvas[absorb[i].ctx.canvas.id];
				}
				absorb.splice(0, count);
			}
		}
		core.registerAnimationFrame('absorb', true, absorb);

		/** 添加吸收动画 */
		this.addAbsorb = function (target, x, y) {
			var ctx = core.createCanvas('absorb' + ~~(Math.random() * 1e8), 32 * x, 32 * y, 32, 32, 31);
			core.drawIcon(ctx, core.getBlockId(x, y), 0, 0, 32, 32);
			ctx.canvas.className = 'absorb';
			setTimeout(function () { core.relocateCanvas(ctx, target.x * 32, target.y * 32); }, 50);
			core.removeBlock(x, y);
			var data = { frame: 0, ctx: ctx };
			if (!core.status.absorb) core.status.absorb = [];
			core.status.absorb.push(data);
		}
	},
	"multiChannel": function () {
		// 音效双声道播放
		var can = true;
		if (!AudioContext) { console.warn('该浏览器不支持AudioContext，无法播放立体声'); can = false }
		if (can) var ac = new AudioContext();
		var datas = {};

		/** 播放立体声 参考：https://developer.mozilla.org/zh-CN/docs/Web/API/BaseAudioContext/createChannelSplitter
		 * @param {number} name 音效名
		 * @param {number} left 左声道音量，默认为1
		 * @param {number} right 右声道音量，默认为1
		 * @param {boolean} split 音效为双声道，请填true，为单声道，请填false或不填
		 * @returns 该音效的唯一id
		 */
		this.playStereo = function (name, left, right, split) {
			if (!can) return core.playSound(name);
			var sound = core.getMappedName(name);
			if (main.mode != 'play' || !core.musicStatus.soundStatus || !core.material.sounds[sound]) return;
			if (!core.status.stereo) core.status.stereo = {};
			var buffer = core.material.sounds[sound];
			var source = ac.createBufferSource();
			source.buffer = buffer;
			var splitter = ac.createChannelSplitter(2);
			source.connect(splitter);
			var merger = ac.createChannelMerger(2);

			/* 大致流程
										gain(L)
									/			  \
			source  ----  splitter  				 merger  ----  destination
									\			  /
										gain(R) 
			*/

			var L = ac.createGain();
			var R = ac.createGain();
			L.gain.value = left * core.musicStatus.userVolume;
			R.gain.value = right * core.musicStatus.userVolume;
			splitter.connect(L, 0, 0);
			if (!split) splitter.connect(R, 0, 0);
			else splitter.connect(R, 1, 0);

			var id = setTimeout(null);
			core.status.stereo[id] = { source: source, L: L, R: R };

			L.connect(merger, 0, 0);
			R.connect(merger, 0, 1);

			var dest = ac.destination;

			source.onended = function () {
				delete datas[id];
				source = void 0;
			}

			merger.connect(dest);
			source.start(0);
			return id;
		}

		/** 移动声源（渐变调整左右声道音量）
		 * @param {number} id 为playStereo返回的id
		 * @param {number} left 要渐变到的左声道音量
		 * @param {number} right 要渐变到的右声道音量
		 * @param {number} time 渐变时间
		 */
		this.moveStereo = function (id, left, right, time) {
			if (!can) return;
			if (main.mode != 'play' || !core.musicStatus.soundStatus) return;
			var stereo = core.status.stereo[id];
			datas[id] = {
				time: time, curr: 0, dL: (left - stereo.L.gain.value) / time * 10 * core.musicStatus.userVolume,
				dR: (right - stereo.R.gain.value) / time * 10 * core.musicStatus.userVolume
			};
			var interval = setInterval(function () {
				var data = datas[id];
				if (!data) return clearInterval(interval);
				data.curr += 10;
				if (data.curr >= data.time) {
					clearInterval(interval);
					datas[id] = void 0;
				}
				stereo.L.gain.value += data.dL;
				stereo.R.gain.value += data.dR;
			}, 10);
		}
	},
	"visualMusic": function () {
		var can = true;
		if (!AudioContext) { console.warn('该浏览器不支持AudioContext，无法可视化播放音乐'); can = false; }
		// 加载音乐用的
		var xhr = new XMLHttpRequest();
		var music = document.getElementById('music');
		var fire = document.getElementById('fire');
		var musicCtx = music.getContext('2d');
		var playing = false;
		var count = document.getElementById('count');
		var visualizer;
		var line;
		var last = 0;
		var listeners = {};

		count.style.display = 'none';

		window.onload = function () {
			init();
		}

		window.addEventListener('resize', resize);

		function init () {
			[music, fire].forEach(function (canvas) {
				canvas.style.position = 'absolute';
				canvas.style.height = '100%';
				canvas.style.width = '100%';
				canvas.style.left = '0px';
				canvas.style.top = '0px';
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			});
		}

		function resize () {
			init();
			// 设置渐变色
			line = music.getContext('2d')
				.createLinearGradient(0, window.innerHeight / 4, 0, window.innerHeight / 4 * 3);
			line.addColorStop(0, "red");
			line.addColorStop(0.25, "orange");
			line.addColorStop(0.5, "green");
			line.addColorStop(0.75, "orange");
			line.addColorStop(1, "red");
		}

		/** 设置倒计时的文字 */
		function setCount (text) {
			count.style.display = 'block';
			count.style.transition = 'none';
			count.innerHTML = text;
			count.style.transform = 'scale(1.3)';
			setTimeout(function () {
				count.style.transition = 'all 0.5s linear';
				setTimeout(function () {
					count.style.transform = 'scale(1)';
				}, 50);
			}, 50);
		}

		/** 准备播放，倒计时三秒 */
		function ready (data, callback) {
			resize();
			readyCanvas();
			var now = 3;
			var buffer;
			var decoded = false;
			setCount('解析音频中');
			var decode = new Promise(function (res, rej) {
				try {
					Musicvisualizer.ac.decodeAudioData(data, function (b) {
						buffer = b;
						res('成功解码');
					}, function (e) {
						console.error(e);
						rej('解码失败');
					});
				} catch (e) {
					console.error(e);
					rej('解码失败');
				}
			})
				.then(function (data) {
					if (data === '成功解码') {
						core.drawTip('音乐准备就绪！');
						decoded = true;
					} else {
						core.drawTip('音乐解码失败，错误信息请查看控制台');
					}
				})
				.then(function () {
					var interval = setInterval(function () {
						if (now >= 0) {
							setCount(now.toString());
							now--;
						}
						if (now === -1 && decoded) {
							count.style.display = 'none';
							clearInterval(interval);
							// 准备后开始播放
							var n = ++visualizer.count;
							if (n !== visualizer.count) return;
							var bufferSource = Musicvisualizer.ac.createBufferSource();
							// 将解码成功后的buffer赋值给bufferSource的buffer属性
							bufferSource.buffer = buffer;
							bufferSource.connect(visualizer.gainNode);
							bufferSource.start(0);
							visualizer.source = bufferSource;
							visualizer.playing = true;
							if (callback) callback();
						}
					}, 1000);
				});
		}

		/** 准备绘制画布 */
		function readyCanvas () {
			[music, fire].forEach(function (v) {
				v.style.display = "block";
			});
		}

		/** 开始播放音乐 */
		this.playVisualMusic = function (dir, callback) {
			if (!can || playing) return;
			last = 0;
			setCount('加载音频中...');
			xhr.abort();
			xhr.open('GET', dir, true);
			xhr.responseType = 'arraybuffer';
			xhr.onload = function () {
				if (xhr.status === 200) {
					ready(xhr.response, callback);
				}
			}
			xhr.send();
		}

		/** 核心绘制函数 */
		function draw (arrL, arrR) {
			var ctx = musicCtx;
			ctx.clearRect(0, 0, music.width, music.height);
			ctx.fillStyle = line;
			var rectWidth = window.innerWidth / 192;
			var style = getComputedStyle(core.dom.gameGroup);
			var groupLeft = parseInt(style.left);
			var groupWidth = parseInt(style.width);
			var groupRight = groupLeft + groupWidth;
			var height = music.height / 2;
			var cw = rectWidth * 0.2;
			var h = window.innerHeight / 2;
			var w = rectWidth / 2;
			var iw = window.innerWidth / 2;
			for (var i = 0; i < 96; i++) {
				var left = arrL[i] / 256 * height;
				var right = arrR[i] / 256 * height;
				var posL = iw - (0.5 + i) * rectWidth;
				var posR = iw + (0.5 + i) * rectWidth;
				if (posL > groupLeft && posL < groupRight) ctx.globalAlpha = 0.3;
				else ctx.globalAlpha = 1;
				ctx.fillRect(posL - w + cw, (window.innerHeight - left) / 2, rectWidth - cw * 2, left);
				ctx.fillRect(posR - w + cw, (window.innerHeight - right) / 2, rectWidth - cw * 2, right);
			}
			ctx.globalAlpha = 0.5;
			ctx.fillRect(0, h - 1, window.innerWidth, 2);
		}

		function listen (currentTime) {
			for (var time in listeners) {
				if (last > time && typeof listeners[time] === 'function') {
					listeners[time](currentTime);
					listeners[time] = void 0;
				}
			}
		}

		/** 添加监听器 */
		this.addAudioListener = function (time, func) {
			listeners[time] = func;
		}

		/** 移除监听器 */
		this.removeAudioListener = function (time) {
			listeners[time] = void 0;
		}

		/** 移除所有监听器 */
		this.removeAllAudioListener = function () {
			listeners = {};
		}

		// 可视化分析器，摘自https://github.com/loosenRogers/MusicVisualizer-WebAudioAPI，略微修改
		function Musicvisualizer (obj) {
			this.source = null;
			this.count = 0;
			this.playing = false;

			this.analyserL = Musicvisualizer.ac.createAnalyser();
			this.analyserR = Musicvisualizer.ac.createAnalyser();
			this.size = obj.size;
			this.analyserL.fftSize = this.size * 2;
			this.analyserR.fftSize = this.size * 2;

			// GainNode用来控制音频的音量
			this.gainNode = Musicvisualizer.ac.createGain();
			// 对象调用对象可以用obj.method，也可以obj[method]
			this.gainNode.connect(Musicvisualizer.ac.destination);

			this.splitter = Musicvisualizer.ac.createChannelSplitter();

			this.gainNode.connect(this.splitter);
			this.splitter.connect(this.analyserL, 0, 0);
			this.splitter.connect(this.analyserR, 1, 0);

			this.draw = obj.draw;
			this.visualize();
		}

		if (can) Musicvisualizer.ac = new AudioContext();

		Musicvisualizer.prototype.visualize = function () {
			var self = this;
			var arrL = new Uint8Array(self.analyserL.frequencyBinCount);//数组长度是fftsize的一半
			var arrR = new Uint8Array(self.analyserR.frequencyBinCount);//数组长度是fftsize的一半

			function fn () {
				if (self.playing) {
					self.analyserL.getByteFrequencyData(arrL);// 将音频频域数据复制到传入的Uint8Array数组
					self.analyserR.getByteFrequencyData(arrR);// 将音频频域数据复制到传入的Uint8Array数组
					self.draw(arrL, arrR);
				}
				requestAnimationFrame(fn);
				listen(Musicvisualizer.ac.currentTime);
			}
			requestAnimationFrame(fn);
		}

		visualizer = new Musicvisualizer({
			size: 128,
			draw: draw
		});

		core.plugin.musicVisualizer = visualizer;
	},
	"boss1": function () {
		var fire = document.getElementById('fire');
		var ctx = fire.getContext('2d');
	},
	"rewrite": function () {

		// 干掉录像 //
		core.replay = control.prototype.replay = function () { return; }

		////// 战斗结束后触发的事件 //////
		events.prototype.afterBattle = function (enemyId, x, y, option) {
			return this.eventdata.afterBattle(enemyId, x, y, option);
		}

		////// 改变图块 //////
		core.setBlock = maps.prototype.setBlock = function (number, x, y, floorId, skill) {
			floorId = floorId || core.status.floorId;
			if (!floorId || number == null || x == null || y == null) return;
			if (x < 0 || x >= core.floors[floorId].width || y < 0 || y >= core.floors[floorId].height) return;
			if (typeof number == 'string') {
				if (/^\d+$/.test(number)) number = parseInt(number);
				else number = core.getNumberById(number);
			}

			var block = core.maps.initBlock(x, y, number, true, core.floors[floorId]);
			if (block.id == 0 && !block.event.trigger) {
				// 转变图块为0且该点无事件，视为删除
				core.removeBlock(x, y, floorId);
				return;
			}
			var originBlock = core.getBlock(x, y, floorId, true);
			var originEvent = originBlock == null ? null : originBlock.event;
			if (originBlock == null) {
				core.status.maps[floorId].blocks.push(block);
				if (core.status.mapBlockObjs[floorId])
					core.status.mapBlockObjs[floorId][block.x + "," + block.y] = block;
				core.setMapBlockDisabled(floorId, block.x, block.y, false);
				delete block.disable;
			}
			else {
				originBlock.id = number;
				originBlock.event = block.event;
				block = originBlock;
			}
			core.maps._updateMapArray(floorId, x, y);
			if (floorId == core.status.floorId) {
				// 有任何一个是autotile直接重绘地图
				if ((originEvent != null && originEvent.cls == 'autotile') || block.event.cls == 'autotile') {
					core.redrawMap();
				} else {
					if (originEvent != null) {
						core.maps._removeBlockFromMap(floorId, { x: x, y: y, event: originEvent });
					}
					if (!block.disable) {
						core.drawBlock(block);
						core.addGlobalAnimate(block);
						if (!skill)
							core.updateStatusBar();
					}
				}
			}
		}

		////// 获得某个点上某个怪物的某项属性 //////
		enemys.prototype.getEnemyValue = function (enemy, name, x, y, floorId) {
			floorId = floorId || core.status.floorId;
			if (x != null && y != null) {
				if (name === 'hp') {
					var floor = core.status.maps[floorId];
					if (floor && floor.hps)
						return floor.hps[x + ',' + y] || 0;
				}
			}
			if ((((flags.enemyOnPoint || {})[floorId] || {})[x + "," + y] || {})[name] != null) {
				return flags.enemyOnPoint[floorId][x + "," + y][name];
			}
			if (enemy == null) {
				var block = core.getBlock(x, y, floorId);
				if (block == null) return null;
				enemy = core.material.enemys[block.event.id];
			}
			if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
			if (enemy == null) return null;
			return enemy[name];
		}

		////// 设置statusBar的innerHTML，会自动斜体和放缩，也可以增加自定义css //////
		utils.prototype.setStatusBarInnerHTML = function (name, value, css) {
			if (!core.statusBar[name]) return;
			if (typeof value == 'number') value = this.formatBigNumber(value);
			var style = 'font-style: normal; ';
			if (name !== 'openSkill')
				style += 'text-shadow: 2px 2px 6px black, 0px 0px 2px #0ff, 0px 0px 2px black; ';
			else style += 'text-shadow: 2px 2px 6px black, 0px 0px 2px #f0f, 0px 0px 2px black; ';
			style += 'font-family: "normal"; ';
			// 判定是否需要缩放
			var length = this.strlen(value) || 1;
			style += 'font-size: ' + Math.min(1.5, 14 / length) + 'em; ';
			if (css) style += css;
			var _style = core.statusBar[name].getAttribute('_style');
			var _value = core.statusBar[name].getAttribute('_value');
			if (_style == style) {
				if (value == _value) return;
				core.statusBar[name].children[0].innerText = value;
			} else {
				core.statusBar[name].innerHTML = "<span class='_status' style='" + style + "'></span>";
				core.statusBar[name].children[0].innerText = value;
				core.statusBar[name].setAttribute('_style', style);
			}
			core.statusBar[name].setAttribute('_value', value);;
		}

		////// 右上角绘制一段提示 //////
		ui.prototype.drawTip = function (text, id, frame) {
			text = core.replaceText(text) || "";
			var realText = this._getRealContent(text);
			var width = 26 + core.calWidth('data', realText, "16px normal")
			var one = {
				text: text,
				textX: 416 - width,
				width: width,
				opacity: 0.1,
				stage: 1,
				frame: frame || 0,
				time: 0
			};
			if (id != null) {
				var info = core.getBlockInfo(id);
				if (info == null || !info.image || info.bigImage) {
					// 检查状态栏图标
					if (core.statusBar.icons[id] instanceof Image) {
						info = { image: core.statusBar.icons[id], posX: 390 - width, posY: 0, height: 32 };
					}
					else info = null;
				}
				if (info != null) {
					one.image = info.image;
					one.posX = info.posX;
					one.posY = info.posY;
					one.height = info.height;
					one.width += 20;
				}
			}
			core.animateFrame.tip = one;
		}

		ui.prototype._drawTip_drawOne = function (tip) {
			core.setAlpha('data', tip.opacity);
			core.fillRect('data', 411, 5, -tip.width, 42, '#000000');
			if (tip.image)
				core.drawImage('data', tip.image, (tip.posX + tip.frame) * 32, tip.posY * tip.height, 32, 32, tip.textX - 22, 10, 32, 32);
			core.fillText('data', tip.text, tip.textX + 8, 33, '#FFFFFF', '16px normal');
			core.setAlpha('data', 1);
		}

		maps.prototype._removeBlockFromMap = function (floorId, block) {
			if (floorId != core.status.floorId) return;
			var filter = block.filter || {};
			if (block.event.cls == 'autotile' || filter.blur > 0 || filter.shadow > 0) {
				core.redrawMap();
			} else {
				var x = block.x, y = block.y;
				var px = 32 * x - core.bigmap.posX * 32;
				var py = 32 * y - core.bigmap.posY * 32;
				core.removeGlobalAnimate(x, y);
				core.clearMap('event', px, py, 32, 32);
				var height = block.event.height || 32;
				if (height > 32) core.clearMap('event2', px, py + 32 - height, 32, height - 32);
				// 删除大怪物
				core.deleteCanvas("_bigImage_header_" + x + "_" + y);
				core.deleteCanvas("_bigImage_body_" + x + "_" + y);
			}
		}

		core.closePanel = ui.prototype.closePanel = function (noUpdate) {
			if (!noUpdate) {
				if (core.status.hero && core.status.hero.flags) {
					// 清除全部临时变量
					Object.keys(core.status.hero.flags).forEach(function (name) {
						if (name.startsWith("@temp@") || /^arg\d+$/.test(name)) {
							delete core.status.hero.flags[name];
						}
					});
				}
				core.updateStatusBar(true);
				core.maps.generateGroundPattern();
			}
			this.clearUI();
			core.unlockControl();
			core.status.event.data = null;
			core.status.event.id = null;
			core.status.event.selection = null;
			core.status.event.ui = null;
			core.status.event.interval = null;
			core.status.thisUIEventInfo = null;
			core.status.thisEventClickArea = null
		}

		////// 绘制动画的某一帧 //////
		maps.prototype._drawAnimateFrame = function (name, animate, centerX, centerY, index) {
			var ctx = core.getContextByName(name);
			if (!ctx) return;
			var frame = animate.frames[index % animate.frame];
			var x = (centerX - 16) / 32;
			core.playStereo((animate.se || {})[index % animate.frame + 1], 1 - x / 12, x / 12);
			var ratio = animate.ratio;
			frame.forEach(function (t) {
				var image = animate.images[t.index];
				if (!image) return;

				var realWidth = image.width * ratio * t.zoom / 100;
				var realHeight = image.height * ratio * t.zoom / 100;
				core.setAlpha(ctx, t.opacity / 255);

				var cx = centerX + t.x, cy = centerY + t.y;

				var ix = cx - realWidth / 2 - core.bigmap.offsetX,
					iy = cy - realHeight / 2 - core.bigmap.offsetY;

				var mirror = t.mirror ? 'x' : null;
				var angle = t.angle ? -t.angle * Math.PI / 180 : null;
				core.drawImage(ctx, image, ix, iy, realWidth, realHeight, null, null, null, null, angle, mirror);

				core.setAlpha(ctx, 1);
			})
		}

		////// 阻击 //////
		control.prototype._checkBlock_repulse = function (repulse) {
			if (!repulse || repulse.length == 0) return;
			var actions = [];
			repulse.forEach(function (t) {
				actions.push({ "type": "move", "loc": [t[0], t[1]], "steps": [t[3]], "time": 250, "keep": true, "async": true });
			});
			actions.push({ "type": "waitAsync" });
			actions.push({ "type": "function", "function": "function () {core.saveHp(core.status.floorId);}" })
			core.insertAction(actions);
		}

		////// 显示移动某块的动画，达到{“type”:”move”}的效果 //////
		maps.prototype.moveBlock = function (x, y, steps, time, keep, callback) {
			if (core.status.replay.speed == 24) time = 1;
			delete core.status.thisMap.hps[x + ',' + y];
			time = time || 500;
			var blockArr = this._getAndRemoveBlock(x, y);
			if (blockArr == null) {
				if (callback) callback();
				return;
			}
			var block = blockArr[0], blockInfo = blockArr[1];
			var moveSteps = (steps || []).map(function (t) {
				return [t.split(':')[0], parseInt(t.split(':')[1] || "1")];
			}).filter(function (t) {
				return ['up', 'down', 'left', 'right', 'forward', 'backward', 'leftup', 'leftdown', 'rightup', 'rightdown', 'speed'].indexOf(t[0]) >= 0
					&& !(t[0] == 'speed' && t[1] < 16)
			});
			var canvases = this._initDetachedBlock(blockInfo, x, y, block.event.animate !== false);
			this._moveDetachedBlock(blockInfo, 32 * x, 32 * y, 1, canvases);

			var moveInfo = {
				sx: x, sy: y, x: x, y: y, px: 32 * x, py: 32 * y, opacity: 1, keep: keep, lastDirection: null, offset: 1,
				moveSteps: moveSteps, step: 0, per_time: time / 16 / core.status.replay.speed
			}
			this._moveBlock_doMove(blockInfo, canvases, moveInfo, callback);
		}

		events.prototype._openDoor_check = function (block, x, y, needKey) {
			var clearAndReturn = function () {
				core.clearContinueAutomaticRoute();
				return false;
			}

			if (block == null || block.event == null) return clearAndReturn();
			var id = block.event.id;

			// 是否存在门或暗墙
			if (core.material.icons.animates[id] == null && core.material.icons.npc48[id] == null) {
				return clearAndReturn();
			}

			if (id == 'steelDoor' && core.flags.steelDoorWithoutKey)
				needKey = false;
			var doorInfo = block.event.doorInfo;
			if (doorInfo == null) return clearAndReturn();
			// Check all keys
			var keyInfo = doorInfo.keys || {};
			if (needKey) {
				for (var keyName in keyInfo) {
					var keyValue = keyInfo[keyName];
					if (keyName.endsWith(':o')) keyName = keyName.substring(0, keyName.length - 2);

					// --- 如果是一个不存在的道具，则直接认为无法开启
					if (!core.material.items[keyName]) {
						core.stopSound();
						core.playSound('操作失败');
						core.drawTip("无法开启此门");
						return clearAndReturn();
					}
					if (core.itemCount(keyName) < keyValue) {
						core.stopSound();
						core.playSound('操作失败');
						core.drawTip("你的" + ((core.material.items[keyName] || {}).name || "钥匙") + "不足！", null, true);
						return false;
					}
				}
				if (!core.status.event.id) core.autosave(true);
				for (var keyName in keyInfo) {
					if (!keyName.endsWith(':o')) core.removeItem(keyName, keyInfo[keyName]);
				}
			}
			core.playStereo(doorInfo.openSound, 1 - x / 12, x / 12);
			return true;
		}

		////// 检查并执行领域、夹击、阻击事件 //////
		control.prototype.checkBlock = function () {
			var x = core.getHeroLoc('x'), y = core.getHeroLoc('y'), loc = x + "," + y;
			var damage = core.status.checkBlock.damage[loc];
			if (damage) {
				core.status.hero.hp -= damage;
				core.addPop(x * 32 + 16, y * 32 + 16, damage);
				core.drawHeroAnimate("zone");
				this._checkBlock_disableQuickShop();
				core.status.hero.statistics.extraDamage += damage;
				if (core.status.hero.hp <= 0) {
					core.status.hero.hp = 0;
					core.updateStatusBar();
					core.events.lose();
					return;
				} else {
					core.updateStatusBar();
				}
			}
			this._checkBlock_ambush(core.status.checkBlock.ambush[loc]);
			this._checkBlock_repulse(core.status.checkBlock.repulse[loc]);
		}

		control.prototype._animationFrame_globalAnimate = function (timestamp) {
			if (timestamp - core.animateFrame.globalTime <= core.values.animateSpeed) return;
			core.status.globalAnimateStatus++;
			if (flags.inFormation) {
				core.drawFormationEnemy(core.status.globalAnimateStatus);
			}
			if (flags.inSniper) {
				core.drawSniperEnemy(core.status.globalAnimateStatus);
			}
			if (core.status.floorId) {
				// Global Animate
				core.status.globalAnimateObjs.forEach(function (block) {
					core.drawBlock(block, core.status.globalAnimateStatus);
				});

				// Global floor images
				core.maps._drawFloorImages(core.status.floorId, core.canvas.bg, 'bg', core.status.floorAnimateObjs || [], core.status.globalAnimateStatus);
				core.maps._drawFloorImages(core.status.floorId, core.canvas.fg, 'fg', core.status.floorAnimateObjs || [], core.status.globalAnimateStatus);

				// Global Autotile Animate
				core.status.autotileAnimateObjs.forEach(function (block) {
					core.maps._drawAutotileAnimate(block, core.status.globalAnimateStatus);
				});

				// Global hero animate
				if ((core.status.hero || {}).animate && core.status.heroMoving == 0 && main.mode == 'play' && !core.status.preview.enabled) {
					core.drawHero('stop', null, core.status.globalAnimateStatus);
				}
			}
			// Box animate
			core.drawBoxAnimate();
			core.animateFrame.globalTime = timestamp;
		}
		core.registerAnimationFrame('globalAnimate', true, control.prototype._animationFrame_globalAnimate);

		////// 获得每个特殊属性的说明 //////
		enemys.prototype.getSpecialHint = function (enemy, special) {
			var specials = this.getSpecials();

			if (special == null) {
				if (specials == null) return [];
				var hints = [];
				for (var i = 0; i < specials.length; i++) {
					if (this.hasSpecial(enemy, specials[i][0]))
						hints.push("\r[" + core.arrayToRGBA(specials[i][3] || "#FF6A6A") + "]\\d" + this._calSpecialContent(enemy, specials[i][1]) +
							"：\\d\r[]" + this._calSpecialContent(enemy, specials[i][2]));
				}
				return hints;
			}

			if (specials == null) return "";
			for (var i = 0; i < specials.length; i++) {
				if (special == specials[i][0])
					return "\r[" + core.arrayToRGBA(specials[i][3] || "#FF6A6A") + "]\\d" + this._calSpecialContent(enemy, specials[i][1]) +
						"：\\d\r[]" + this._calSpecialContent(enemy, specials[i][2]);
			}
			return "";
		}

		control.prototype._shouldDisplayStatus = function (id) {
			if (id == null) {
				var toDraw = [], status = core.dom.status;
				for (var i = 0; i < status.length; ++i) {
					var dom = core.dom.status[i], idCol = dom.id;
					if (idCol.indexOf("Col") != idCol.length - 3) continue;
					var id = idCol.substring(0, idCol.length - 3);
					if (!this._shouldDisplayStatus(id)) continue;
					toDraw.push(id);
				}
				toDraw.push('openFormation', 'openSkill');
				return toDraw;
			}
			var obj = {};
			core.flags.statusBarItems.forEach(function (v) { obj[v] = true; })
			switch (id) {
				case 'floor': return obj.enableFloor;
				case 'name': return obj.enableName;
				case 'lv': return obj.enableLv;
				case 'hp': return obj.enableHP;
				case 'hpmax': return obj.enableHPMax;
				case 'mana': return obj.enableMana;
				case 'atk': return obj.enableAtk;
				case 'def': return obj.enableDef;
				case 'mdef': return obj.enableMDef;
				case 'money': return obj.enableMoney;
				case 'exp': return obj.enableExp && !obj.levelUpLeftMode;
				case 'up': return obj.enableLevelUp;
				case 'key': return obj.enableKeys;
				case 'pzf': return obj.enablePZF;
				case 'debuff': return obj.enableDebuff;
				default: return true;
			}
		}

		function update (noAutoEvents) {
			core.control.controldata.updateStatusBar();
			if (!noAutoEvents) core.checkAutoEvents();
			core.control._updateStatusBar_setToolboxIcon();
			core.clearRouteFolding();
		}

		core.registerAnimationFrame('updateStatusBar', true, function () {
			if (core.control.needUpdate) {
				update(core.control.noAutoEvents);
				core.control.needUpdate = false;
				core.control.noAutoEvents = void 0;
			}
		});

		////// 更新状态栏 //////
		control.prototype.updateStatusBar = function (doNotCheckAutoEvents) {
			if (!core.isPlaying() || core.hasFlag('__statistics__')) return;
			core.control.needUpdate = true;
			if (core.control.noAutoEvents && !doNotCheckAutoEvents) core.control.noAutoEvents = false;
			if (core.control.noAutoEvents === void 0 && doNotCheckAutoEvents) core.control.noAutoEvents = true;
		}
	},
	"fixed": function () {
		// 定点查看怪物属性及怪物属性界面重绘
		////// 点击状态栏中的怪物手册时 //////
		main.statusBar.image.book.onclick = function (e) {
			e.stopPropagation();
			if (core.isReplaying()) {
				core.triggerReplay();
				return;
			}
			if (main.core.isPlaying()) {
				if (!main.core.getFlag("fixToBook"))
					main.core.openBook(true);
				else main.core.useItem("wand");
			}
		};
		// 重绘怪物属性界面
		ui.prototype._drawBookDetail = function (index) {
			var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
			var enemys = core.enemys.getCurrentEnemys(floorId);
			index = core.clamp(index, 0, enemys.length - 1);
			var enemy = enemys[index];
			var info = this._drawBookDetail_getInfo(enemy);
			if (!enemy) return;
			var content = info[1].join("\n");
			core.status.event.id = 'book-detail';
			core.animateFrame.tip = null;
			core.clearMap('data');

			var left = 10,
				width = this.PIXEL - 2 * left,
				right = left + width;
			var content_left = left + 25,
				validWidth = right - content_left - 13;
			var height = Math.max(this.getTextContentHeight(content, { fontSize: 16, lineHeight: 24, maxWidth: validWidth }) + 58, 80),
				top = (this.PIXEL - height) / 2,
				bottom = top + height;

			core.drawWindowSkin("winskin.png", 'data', 0, 0, core.__PIXELS__, core.__PIXELS__);
			core.drawLine('data', 10, 100, core.__PIXELS__ - 10, 100, [255, 255, 255, 0.8], 1);
			core.drawLine('data', 3, 170, core.__PIXELS__ - 3, 170, [255, 255, 255, 0.8], 1);
			core.setTextAlign('data', 'center');
			core.drawIcon('data', enemy.id, core.__PIXELS__ / 2 - 16, 46);
			core.fillText('data', enemy.name, core.__PIXELS__ / 2, 35, core.status.globalAttribute.selectColor, this._buildFont(22));
			if (enemy.special && enemy.special.length != 0) core.fillRect("data", 3, 170, core.__PIXELS__ - 6, core.__PIXELS__ - 173, [0, 0, 0, 0.6]);
			core.setTextAlign('data', 'left');
			// 特殊属性
			core.playSound('确定');
			this._drawBookDetail_drawContent(enemy, content, { top: top, content_left: content_left, bottom: bottom, validWidth: validWidth });
			// 临界表和回合数
			var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
			var critical = this._drawBookDetail_turnAndCriticals(enemy, floorId, []);
			critical = critical.join("\n");
			this.drawTextContent('data', critical, {
				left: 10,
				top: 77,
				maxWidth: core.__PIXELS__ - 20,
				fontSize: 17,
				lineHeight: 24
			});
			// 生命、功防、1防
			this._drawBookDetail_basicAttributes(enemy);
		};
		// 获取怪物属性
		ui.prototype._drawBookDetail_getInfo = function (enemy, x, y) {
			var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
			var enemys = core.enemys.getCurrentEnemys(floorId);
			if (enemys.length == 0) return [];
			var texts = [];
			if (x != null && y != null) {
				var special = enemy.special;
				if (typeof special == "number") special = [special];
				if (special.length != 0) {
					for (var i = 0; i < special.length; i++) {
						texts.push(core.enemys.getSpecialHint(enemy.id, special[i]));
					}
				}
			} else {
				var texts = core.enemys.getSpecialHint(enemy.id);
			}
			if (texts != "") texts.push("");
			this._drawBookDetail_getTexts(enemy, floorId, texts, x, y);
			return [0, texts];
		};
		// 怪物名称
		ui.prototype._drawBook_drawName = function (index, enemy, top, left, width) {
			// 绘制第零列（名称和特殊属性）
			// 如果需要添加自己的比如怪物的称号等，也可以在这里绘制
			core.setTextAlign('ui', 'center');
			if (enemy.specialText.length == 0) {
				core.fillText('ui', enemy.name, left + width / 2,
					top + 35, '#ffffff', this._buildFont(19, false), width);
			} else {
				core.fillText('ui', enemy.name, left + width / 2,
					top + 28, '#ffffff', this._buildFont(19, false), width);
				switch (enemy.specialText.length) {
					case 1:
						core.fillText('ui', enemy.specialText[0], left + width / 2,
							top + 50, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'),
							this._buildFont(15, false), width);
						break;
					case 2:
						// Step 1: 计算字体
						var text = enemy.specialText[0] + "  " + enemy.specialText[1];
						core.setFontForMaxWidth('ui', text, width, this._buildFont(15, false));
						// Step 2: 计算总宽度
						var totalWidth = core.calWidth('ui', text);
						var leftWidth = core.calWidth('ui', enemy.specialText[0]);
						var rightWidth = core.calWidth('ui', enemy.specialText[1]);
						// Step 3: 绘制
						core.fillText('ui', enemy.specialText[0], left + (width + leftWidth - totalWidth) / 2,
							top + 50, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'));
						core.fillText('ui', enemy.specialText[1], left + (width + totalWidth - rightWidth) / 2,
							top + 50, core.arrayToRGBA((enemy.specialColor || [])[1] || '#FF6A6A'));
						break;
					default:
						core.fillText('ui', '多属性...', left + width / 2,
							top + 50, '#FF6A6A', this._buildFont(15, false), width);
				}
			}
		};
		// 额外项
		ui.prototype._drawBookDetail_getTexts = function (enemy, floorId, texts, x, y) {
			// --- 仇恨伤害
			this._drawBookDetail_hatred(enemy, texts);
		};
		// 伤害字符串
		enemys.prototype.getDamageString = function (enemy, x, y, floorId) {
			if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
			var damage = this.getDamage(enemy, x, y, floorId);
			var color = '#000000';
			if (damage == null) {
				damage = "???";
				color = '#FF2222';
			} else {
				if (damage <= 0) color = '#66FF66';
				else if (damage < core.status.hero.hp / 3) color = '#FFFFFF';
				else if (damage < core.status.hero.hp * 2 / 3) color = '#FFFF00';
				else if (damage < core.status.hero.hp) color = '#FF9933';
				else color = '#FF2222';
				damage = core.formatBigNumber(damage, true);
			}
			return {
				"damage": damage,
				"color": color
			};
		};
		ui.prototype._drawBook_drawDamage = function (index, enemy, offset, position) {
			core.setTextAlign('ui', 'center');
			var damage = enemy.damage,
				color = '#FFFF00';
			if (damage == null) {
				damage = '无法战斗';
				color = '#FF2222';
			} else {
				if (damage >= core.status.hero.hp) color = '#FF2222';
				else if (damage >= core.status.hero.hp * 2 / 3) color = '#FF9933';
				else if (damage <= 0) color = '#11FF11';
				damage = core.formatBigNumber(damage);
			}
			if (enemy.notBomb) damage += "[b]";
			core.fillText('ui', damage, offset, position, color, this._buildFont(13, true));
		};
		// 文字
		ui.prototype._drawBookDetail_drawContent = function (enemy, content, pos) {
			core.setTextAlign('data', 'left');
			for (var i = 0; i < 18; i++) {
				// 自适配文字大小
				if (core.getTextContentHeight(content, {
					left: 7,
					top: 170,
					maxWidth: core.__PIXELS__ - 14,
					fontSize: 18 - i,
					lineHeight: 24 - i * 4 / 3,
					interval: 0
				}) <= 336) {
					this.drawTextContent('data', content, {
						left: 7,
						top: 170,
						maxWidth: core.__PIXELS__ - 14,
						fontSize: 18 - i,
						lineHeight: 24 - i * 4 / 3,
						interval: 0
					});
					break;
				}
			}
		};
		// 回合数和临界
		ui.prototype._drawBookDetail_turnAndCriticals = function (enemy, floorId, texts, x, y) {
			var damageInfo = core.getDamageInfo(enemy.id, null, x, y, floorId);
			texts.push("\r[#FF6A6A]\\d战斗回合数：\\d\r[]" + ((damageInfo || {}).turn || 0));
			// 临界表
			var criticals = core.enemys.nextCriticals(enemy.id, 12, x, y, floorId).map(function (v, i) {
				return core.formatBigNumber(v[0]) + ":" + (i == 0 && v[1] < 0 ? "\r[#ffd700]" : "") +
					core.formatBigNumber(v[1], false, i == 0 && v[1] < 0) + (i == 0 && v[1] < 0 ? "\r[]" : "");
			});
			while (criticals[0] == '0:0') criticals.shift();
			if (JSON.stringify(criticals) != "[]") texts.push(JSON.stringify(criticals));
			var prevInfo = core.getDamageInfo(enemy.id, { atk: core.status.hero.atk - 1 }, null, null, floorId);
			if (prevInfo != null && damageInfo != null) {
				if (damageInfo.damage != null) damageInfo = damageInfo.damage;
				if (prevInfo.damage != null) prevInfo = prevInfo.damage;
				if (prevInfo > damageInfo) {
					texts[0] += "（当前攻击力正位于临界点上）";
				}
			}
			// --- 原始数值
			this._drawBookDetail_origin(enemy, texts, x, y);
			return texts;
		};
		ui.prototype._drawBookDetail_basicAttributes = function (enemy, floorId, x, y) {
			core.fillText("data", "生命: " + core.formatBigNumber(enemy.hp), 10, 25, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
			core.fillText("data", "攻击: " + core.formatBigNumber(enemy.atk), 10, 49, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
			core.fillText("data", "防御: " + core.formatBigNumber(enemy.def), 10, 73, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
			core.fillText("data", "金经: " + core.formatBigNumber(enemy.money || 0) + "/" + core.formatBigNumber(enemy.exp || 0),
				core.__PIXELS__ - 150, 25, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
			core.fillText("data", core.formatBigNumber(core.status.thisMap.ratio) + "防: " + core.formatBigNumber(enemy.defDamage || 0),
				core.__PIXELS__ - 150, 49, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
			core.fillText("data", "伤害: " + ((enemy.damage > 0 || enemy.damage == null) ? "\r[#ff8888]" : "\r[#55BB55]") +
				core.formatBigNumber(enemy.damage == null ? "???" : enemy.damage), core.__PIXELS__ - 150, 74, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
		};
		ui.prototype._drawBook_drawRow1 = function (index, enemy, top, left, width, position) {
			// 绘制第一行
			core.setTextAlign('ui', 'left');
			var b13 = this._buildFont(15, false),
				f13 = this._buildFont(15, false);
			var col1 = left,
				col2 = left + width * 9 / 25,
				col3 = left + width * 17 / 25;
			core.setTextAlign('ui', 'right');
			core.fillText('ui', core.getStatusLabel('hp'), col1 + 25, position, '#ffffff', f13);
			core.fillText('ui', core.getStatusLabel('atk'), col2 + 25, position, null, f13);
			core.fillText('ui', core.getStatusLabel('def'), col3 + 25, position, null, f13);
			core.setTextAlign('ui', 'left');
			core.fillText('ui', core.formatBigNumber(enemy.hp || 0), col1 + 30, position, null, b13);
			core.fillText('ui', core.formatBigNumber(enemy.atk || 0), col2 + 30, position, null, b13);
			core.fillText('ui', core.formatBigNumber(enemy.def || 0), col3 + 30, position, null, b13);
		};
		ui.prototype._drawBook_drawRow2 = function (index, enemy, top, left, width, position) {
			// 绘制第二行
			core.setTextAlign('ui', 'left');
			var b13 = this._buildFont(15, false),
				f13 = this._buildFont(15, false);
			var col1 = left,
				col2 = left + width * 9 / 25,
				col3 = left + width * 17 / 25;
			core.setTextAlign('ui', 'right');
			core.fillText('ui', core.getStatusLabel('money'), col1 + 25, position, '#ffffff', f13);
			core.fillText('ui', core.getStatusLabel('exp'), col2 + 25, position, '#ffffff', f13);
			core.setTextAlign('ui', 'left');
			core.fillText('ui', core.formatBigNumber(enemy.money || 0), col1 + 30, position, null, b13);
			core.fillText('ui', core.formatBigNumber(enemy.exp || 0), col2 + 30, position, null, b13);
			// 忽略第三列，直接绘制伤害
			var damage_offset = col3 + (this.PIXEL - col3) / 2 - 12;
			this._drawBook_drawDamage(index, enemy, damage_offset, position);
		};
		// 手册n防
		ui.prototype._drawBook_drawRow3 = function (index, enemy, top, left, width, position) {
			// 绘制第三行
			core.setTextAlign('ui', 'left');
			var b13 = this._buildFont(15, false),
				f13 = this._buildFont(15, false);
			var col1 = left,
				col2 = left + width * 9 / 25,
				col3 = left + width * 17 / 25;
			var damage = core.getDamageInfo(enemy);
			core.setTextAlign('ui', 'right');
			core.fillText('ui', '临界', col1 + 25, position, '#ffffff', f13);
			core.fillText('ui', '减伤', col2 + 25, position, damage == null && enemy.critical ? "#ffd700" : "#ffffff", f13);
			core.fillText('ui', core.formatBigNumber(core.status.thisMap.ratio) + '防', col3 + 25, position, "#ffffff", f13);
			core.setTextAlign('ui', 'left');
			core.fillText('ui', core.formatBigNumber(enemy.criticalDamage || 0,
				false, damage == null && enemy.critical), col2 + 30, position, null, b13);
			core.fillText('ui', core.formatBigNumber(enemy.critical || 0), col1 + 30, position, null, b13);
			core.fillText('ui', core.formatBigNumber(enemy.defDamage || 0), col3 + 30, position, null, b13);
		};
		// 绘制伤害
		ui.prototype._drawBook_drawDamage = function (index, enemy, offset, position) {
			core.setTextAlign('ui', 'center');
			var damage = enemy.damage,
				color = '#FFFF00';
			if (damage == null) {
				damage = '无法战斗';
				color = '#FF2222';
			} else {
				if (damage >= core.status.hero.hp) color = '#FF2222';
				else if (damage >= core.status.hero.hp * 2 / 3) color = '#FF9933';
				else if (damage <= 0) color = '#11FF11';
				damage = core.formatBigNumber(damage);
			}
			if (enemy.notBomb) damage += "[b]";
			core.fillText('ui', damage, offset, position, color, this._buildFont(15, false));
		};
		ui.prototype._drawBookDetail_origin = function (enemy, texts) {
			// 怪物数值和原始值不一样时，在详细信息页显示原始数值
			var originEnemy = core.enemys._getCurrentEnemys_getEnemy(enemy.id);
			var content = [];
			if (enemy.x != null && enemy.y != null && flags.useLocEnemy) {
				texts.push("\r[#FF6A6A]\\d怪物坐标：\\d\r[][" + enemy.x + ", " + enemy.y + ']');
			}
			["hp", "atk", "def", "point", "money", "exp"].forEach(function (one) {
				if (enemy[one] == null || originEnemy[one] == null) return;
				if (enemy[one] != originEnemy[one]) {
					content.push(core.getStatusLabel(one) + " " + originEnemy[one]);
				}
			});
			if (content.length > 0) {
				if (flags.useLocEnemy)
					texts[texts.length - 1] += "  \r[#FF6A6A]\\d原始数值：\\d\r[]" + content.join("；");
				else
					texts.push("\r[#FF6A6A]\\d原始数值：\\d\r[]" + content.join("；"));
			}
		};
		////// 接下来N个临界值和临界减伤计算 //////
		enemys.prototype.nextCriticals = function (enemy, number, x, y, floorId) {
			if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
			number = number || 1;
			var info = this.getDamageInfo(enemy, null, x, y, floorId);
			// 防杀
			if (info && info.per_damage <= 0 && info.hero_per_damage > 0) return [
				[0, 0]
			];
			if (this.hasSpecial(enemy.special, 9) && core.status.hero.atk + core.status.hero.mana <=
				core.getEnemyInfo(enemy, null, x, y, floorId).def) {
				info = this.getEnemyInfo(enemy, null, x, y, floorId);
				return [
					[info.def + 1 - core.status.hero.atk - core.status.hero.mana, '?']
				];
			}
			if (info == null) { // 如果未破防...
				var enemyInfo = this.getEnemyInfo(enemy, null, x, y, floorId);
				if (enemyInfo.def == null || enemyInfo.def < core.status.hero.atk) return [];
				// 再次尝试获得破防后伤害
				info = this.getDamageInfo(enemy, { atk: enemyInfo.def + 1 }, x, y, floorId);
				if (info == null || info.mon_def != enemyInfo.def) return [];
				info.__over__ = true;
				info.__overAtk__ = info.mon_def + 1 - core.status.hero.atk;
			}
			// getDamageInfo直接返回数字；0伤且无负伤
			if (typeof info == 'number' || (info.damage <= 0 && !core.flags.enableNegativeDamage)) {
				return [
					[0, 0]
				];
			}
			if (core.flags.useLoop) {
				var LOOP_MAX_VALUE = 1;
				if (core.status.hero.atk <= LOOP_MAX_VALUE) {
					return this._nextCriticals_useLoop(enemy, info, number, x, y, floorId);
				} else {
					return this._nextCriticals_useBinarySearch(enemy, info, number, x, y, floorId);
				}
			} else {
				return this._nextCriticals_useTurn(enemy, info, number, x, y, floorId);
			}
		};
		// 绘制详细信息
		this.drawFixedDetail = function (index, x, y, Enemy) {
			var enemy = Enemy;
			if (enemy == null) return;
			var enemyInfo = core.enemys.getEnemyInfo(enemy, null, x, y, floorId);
			var specialText = core.enemys.getSpecialText(enemy);
			var specialColor = core.enemys.getSpecialColor(enemy);
			var e = {};
			for (var i in enemyInfo) {
				e[i] = enemyInfo[i];
			}
			e.specialText = specialText;
			e.specialColor = specialColor;
			e.damage = core.enemys.getDamage(enemy, x, y, floorId);
			e.defDamage = core.enemys.getDefDamage(enemy, 1 * core.status.thisMap.ratio, x, y, floorId);
			e.id = enemy;
			e.name = core.material.enemys[enemy].name;
			enemy = e;
			if (enemy.special == 0) enemy.special = null;
			if (typeof enemy.special == "number") {
				enemy.special = [enemy.special];
			}
			var info = core.ui._drawBookDetail_getInfo(enemy);
			if (!enemy) return;
			var content = info[1].join("\n");
			core.status.event.id = 'fixed-detail';
			core.animateFrame.tip = null;
			core.clearMap('data');
			var left = 10,
				width = this.PIXEL - 2 * left,
				right = left + width;
			var content_left = left + 25,
				validWidth = right - content_left - 13;
			var height = Math.max(core.getTextContentHeight(content, { fontSize: 16, lineHeight: 24, maxWidth: validWidth }) + 58, 80),
				top = (this.PIXEL - height) / 2,
				bottom = top + height;
			// 背景
			core.drawWindowSkin("winskin.png", 'data', 0, 0, core.__PIXELS__, core.__PIXELS__);
			core.drawLine('data', 10, 100, core.__PIXELS__ - 10, 100, [255, 255, 255, 0.8], 1);
			core.drawLine('data', 3, 170, core.__PIXELS__ - 3, 170, [255, 255, 255, 0.8], 1);
			core.setTextAlign('data', 'center');
			core.drawIcon('data', enemy.id, core.__PIXELS__ / 2 - 16, 46);
			core.fillText('data', enemy.name, core.__PIXELS__ / 2, 35, core.status.globalAttribute.selectColor, core.ui._buildFont(22));
			if (enemy.special && enemy.special.length != 0) core.fillRect("data", 3, 170, core.__PIXELS__ - 6, core.__PIXELS__ - 173, [0, 0, 0, 0.6]);
			core.setTextAlign('data', 'left');
			// 特殊属性
			core.ui._drawBookDetail_drawContent(enemy, content, { top: top, content_left: content_left, bottom: bottom, validWidth: validWidth });
			// 临界表和回合数
			var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
			var critical = core.ui._drawBookDetail_turnAndCriticals(enemy, floorId, [], x, y);
			critical = critical.join("\n");
			core.drawTextContent('data', critical, {
				left: 10,
				top: 77,
				maxWidth: core.__PIXELS__ - 20,
				fontSize: 17,
				lineHeight: 24
			});
			core.playSound('确定');
			// 生命、功防、1防
			core.ui._drawBookDetail_basicAttributes(enemy, floorId, x, y);
		};
		// 定点查看怪物属性
		this.fixedEnemy = function (x, y, floorId) {
			floorId = floorId || core.status.floorId;
			if (core.getBlockCls(x, y, floorId) == "enemys" || core.getBlockCls(x, y, floorId) == "enemy48") {
				core.drawFixedDetail(null, x, y, core.getBlockId(x, y, floorId));
			} else {
				core.drawTip("您选择的图块没有敌人！");
			}
		};
		// 定点查看界面
		var enemyIndex = 0;
		// 打开
		this.openFixed = function () {
			if (core.isReplaying()) return;
			core.lockControl();
			enemyIndex = 0;
			core.playSound("打开界面");
			core.startFixed();
		};
		this.startFixed = function () {
			// 注册点击与键盘action
			core.registerAction('onclick', 'fixedClick1', core.clickFixed, 120);
			core.registerAction('keyUp', 'fixedKeyboard1', core.keyBoardFixed, 120);
			// 改变事件id和绘制
			core.status.event.id = 'fixed';
			core.drawFixedEnemy(core.status.floorId);
		};
		// 绘制
		this.drawFixedEnemy = function (floorId) {
			if (!core.dymCanvas.fixedEnemy)
				core.createCanvas('fixedEnemy', 0, 0, 480, 480, 150);
			else core.clearMap("fixedEnemy");
			core.fillRect("fixedEnemy", 0, 0, 480, 480, [0, 0, 0, 0.3]);
			var enemyLoc = core.getEnemyLoc(floorId);
			var ox = Math.floor(core.bigmap.offsetX / 32);
			var oy = Math.floor(core.bigmap.offsetY / 32);
			if (enemyLoc.length != 0) {
				for (var i in enemyLoc) {
					core.fillRect("fixedEnemy", 32 * enemyLoc[i][0] + 2 - ox * 32, 32 * enemyLoc[i][1] + 2 - oy * 32, 28, 28, [175, 175, 175, 0.5]);
				}
				core.strokeRect("fixedEnemy", 32 * enemyLoc[enemyIndex][0] + 1 - ox * 32, 32 * enemyLoc[enemyIndex][1] + 1 - oy * 32, 30, 30, [255, 255, 50, 1], 2);
			}
			// 关闭
			core.fillText("fixedEnemy", "关 闭", 5, 25, [255, 255, 255, 1], "24px " + core.status.globalAttribute.font);
		};
		// 操作
		this.registeredClick = function () {
			if (core.status.event.id != "fixed-detail") return false;
			core.clearMap('data');
			core.status.event.id = "fixed";
			core.playSound("取消");
			return true;
		};
		this.registeredKeyboard = function () {
			if (core.status.event.id != "fixed-detail") return false;
			core.clearMap('data');
			core.status.event.id = "fixed";
			core.playSound("取消");
			return true;
		};
		this.clickFixed = function (x, y) {
			if (core.status.event.id != 'fixed') return true;
			if (x < 2 && y < 1) {
				core.unregisterAction("keyUp", "fixedKeyboard1");
				core.unregisterAction("keyUp", "fixedKeyboard2");
				core.unregisterAction("onclick", "fixedClick1");
				core.unregisterAction("onclick", "fixedClick2");
				core.playSound("取消");
				core.deleteCanvas('fixedEnemy');
				core.closePanel();
				core.unlockControl();
				return true;
			}
			var floorId = core.status.floorId;
			var enemyLoc = core.getEnemyLoc(floorId);
			for (var i in enemyLoc) {
				if (x - core.bigmap.offsetX / 32 == enemyLoc[i][0] && y - core.bigmap.offsetY / 32 == enemyLoc[i][1]) {
					enemyIndex = i;
					this.drawFixedEnemy(core.status.floorId);
				}
			}
			core.fixedEnemy(x - core.bigmap.offsetX / 32, y - core.bigmap.offsetY / 32, floorId);
			return true;
		};
		this.keyBoardFixed = function (keyCode) {
			if (core.status.event.id != 'fixed') return true;
			var floorId = core.status.floorId;
			var enemyLoc = core.getEnemyLoc(floorId);
			switch (keyCode) {
				case 88:
				case 27:
					core.unregisterAction("keyUp", "fixedKeyboard1");
					core.unregisterAction("keyUp", "fixedKeyboard2");
					core.unregisterAction("onclick", "fixedClick1");
					core.unregisterAction("onclick", "fixedClick2");
					core.playSound("取消");
					core.deleteCanvas('fixedEnemy');
					core.closePanel();
					core.unlockControl();
					return true;
				case 13:
				case 32:
					if (enemyLoc.length != 0) {
						var x = enemyLoc[enemyIndex][0];
						var y = enemyLoc[enemyIndex][1];
						core.fixedEnemy(x, y, floorId);
					}
					return true;
				case 37:
				case 38:
					if (enemyIndex > 0) {
						core.playSound("光标移动");
						enemyIndex--;
						this.drawFixedEnemy(core.status.floorId);
					}
					return true;
				case 39:
				case 40:
					if (enemyIndex < enemyLoc.length - 1) {
						core.playSound("光标移动");
						enemyIndex++;
						this.drawFixedEnemy(core.status.floorId);
					}
					return true;
			}
		};
		// 获得指定楼层怪物坐标数组
		this.getEnemyLoc = function (floorId) {
			// 是否在范围内
			function inRange (loc, ox, oy) {
				if (loc[0] < ox || loc[0] > (ox + core.__SIZE__ - 1) ||
					loc[1] < oy || loc[1] > (oy + core.__SIZE__ - 1)) return false;
				return true;
			}
			var ox = Math.floor(core.bigmap.offsetX / 32);
			var oy = Math.floor(core.bigmap.offsetY / 32);
			core.registerAction("keyUp", "fixedKeyboard2", this.registeredKeyboard, 150);
			core.registerAction("onclick", "fixedClick2", this.registeredClick, 150);
			floorId = floorId || core.status.floorId;
			var loc = [];
			core.status.maps[floorId].blocks.forEach(function (block) {
				var id = block.event.id,
					enemy = core.material.enemys[id];
				if (enemy) {
					loc.push([block.x, block.y]);
				}
			});
			for (var i = 0; i < loc.length; i++) {
				if (!inRange(loc[i], ox, oy)) {
					loc.splice(i, 1);
					i--;
				}
			}
			return loc;
		};
	},
	"itemDetail": function () {
		core.control.updateDamage = function (floorId, ctx) {
			floorId = floorId || core.status.floorId;
			if (!floorId || core.status.gameOver || main.mode != 'play') return;
			var onMap = ctx == null;

			// 没有怪物手册
			if (!core.hasItem('book')) return;
			core.status.damage.posX = core.bigmap.posX;
			core.status.damage.posY = core.bigmap.posY;
			if (!onMap) {
				var width = core.floors[floorId].width,
					height = core.floors[floorId].height;
				// 地图过大的缩略图不绘制显伤
				if (width * height > core.bigmap.threshold) return;
			}
			this._updateDamage_damage(floorId, onMap);
			this._updateDamage_extraDamage(floorId, onMap);
			core.getItemDetail(floorId); // 宝石血瓶详细信息
			core.displayHp(floorId); // 显血
			this.drawDamage(ctx);
		};
		// 绘制地图显示
		control.prototype._drawDamage_draw = function (ctx, onMap) {
			if (!core.hasItem('book')) return;
			// *** 下一句话可以更改你想要的显示字体
			core.setFont(ctx, "15px normal");
			// ***
			core.setTextAlign(ctx, 'left');
			core.status.damage.data.forEach(function (one) {
				var px = one.px,
					py = one.py;
				if (onMap && core.bigmap.v2) {
					px -= core.bigmap.posX * 32;
					py -= core.bigmap.posY * 32;
					if (px < -32 * 2 || px > core.__PIXELS__ + 32 || py < -32 || py > core.__PIXELS__ + 32)
						return;
				}
				core.fillBoldText(ctx, one.text, px, py, one.color);
			});
			core.setTextAlign(ctx, 'center');
			core.status.damage.extraData.forEach(function (one) {
				var px = one.px,
					py = one.py;
				if (onMap && core.bigmap.v2) {
					px -= core.bigmap.posX * 32;
					py -= core.bigmap.posY * 32;
					if (px < -32 || px > core.__PIXELS__ + 32 || py < -32 || py > core.__PIXELS__ + 32)
						return;
				}
				core.fillBoldText(ctx, one.text, px, py, one.color);
			});
		};
		////// 更改地图画布的尺寸 //////
		maps.prototype.resizeMap = function (floorId) {
			floorId = floorId || core.status.floorId;
			if (!floorId) return;
			core.bigmap.width = core.floors[floorId].width;
			core.bigmap.height = core.floors[floorId].height;
			core.bigmap.posX = core.bigmap.posY = 0;
			// *** 下一句话可以更改超大地图的定义，core.bigmap.threshold为1024，这里/4 说明地图面积超过256即为超大地图，使用v2优化
			core.bigmap.v2 = core.bigmap.width * core.bigmap.height > core.bigmap.threshold / 4;
			// ***
			var width = core.bigmap.v2 ? core.__PIXELS__ + 64 : core.bigmap.width * 32;
			var height = core.bigmap.v2 ? core.__PIXELS__ + 64 : core.bigmap.height * 32;

			core.bigmap.canvas.forEach(function (cn) {
				if (core.domStyle.hdCanvas.indexOf(cn) >= 0)
					core.maps._setHDCanvasSize(core.canvas[cn], width, height);
				else {
					core.canvas[cn].canvas.width = width;
					core.canvas[cn].canvas.height = height;
				}
				core.canvas[cn].canvas.style.width = width * core.domStyle.scale + "px";
				core.canvas[cn].canvas.style.height = height * core.domStyle.scale + "px";
				core.canvas[cn].translate(core.bigmap.v2 ? 32 : 0, core.bigmap.v2 ? 32 : 0);
				if (main.mode === 'editor' && editor.isMobile) {
					core.canvas[cn].canvas.style.width = width / core.__PIXELS__ * 96 + "vw";
					core.canvas[cn].canvas.style.height = height / core.__PIXELS__ * 96 + "vw";
				}
			});
		};
		// 获取宝石信息 并绘制
		this.getItemDetail = function (floorId) {
			if (!core.getFlag("itemDetail")) return;
			floorId = floorId || core.status.thisMap.floorId;
			core.status.maps[floorId].blocks.forEach(function (block) {
				var x = block.x,
					y = block.y;
				// v2优化，只绘制范围内的部分
				if (core.bigmap.v2) {
					if (x < core.bigmap.posX - core.bigmap.extend || x > core.bigmap.posX + core.__SIZE__ + core.bigmap.extend ||
						y < core.bigmap.posY - core.bigmap.extend || y > core.bigmap.posY + core.__SIZE__ + core.bigmap.extend) {
						return;
					}
				}
				if (block.event.cls == "items") {
					var before = core.clone(core.status.hero),
						id = block.event.id;

					// *** 可以加一些不检测的道具，比如屏蔽圣水可以这么写：
					if (id === "I343") return;
					// ***

					// 跟数据统计原理一样 执行效果 前后比较
					core.setFlag("__statistics__", true);
					try {
						eval(core.material.items[id].itemEffect);
					} catch (error) { }
					var diff = core.compareObject(before, core.status.hero);
					core.status.hero = before;
					window.hero = core.status.hero;
					window.flags = core.status.hero.flags;
					core.drawItemDetail(diff, block.x, block.y, floorId, id);
				}
			});
		};
		// 比较两个对象之间每一项的数值差异（弱等于）返回数值差异
		this.compareObject = function (a, b) {
			a = a || {};
			b = b || {};
			var diff = {}; // 差异
			for (var name in a) {
				if (a[name] != b[name]) { // a != b
					try {
						diff[name] = b[name] - (a[name] || 0);
					} catch (error) { }
					if (isNaN(diff[name])) delete diff[name];
					if (diff[name] == 0) delete diff[name];
				}
			}
			return diff;
		};
		// 绘制
		this.drawItemDetail = function (diff, x, y, floorId, id) {
			if (core.same(diff, {}) || !diff) return;
			var px = 32 * x + 2,
				py = 32 * y + 30;
			var content = "";
			// 获得数据和颜色
			var i = 0;
			for (var name in diff) {
				var color = "#ffffff"
				diff[name] = core.formatBigNumber(diff[name], true);
				// *** 这里可以改不同属性对应的颜色
				switch (name) {
					case 'atk':
						color = "#FF7A7A";
						break;
					case 'def':
						color = "#00E6F1";
						break;
					case 'mdef':
						color = "#6EFF83";
						break;
					case 'hp':
						color = "#A4FF00";
						break;
					case 'hpmax':
						color = "#F9FF00";
						break;
					case 'mana':
						color = "#001CFF";
						break;
				}
				// ***
				content = diff[name];
				// 绘制
				core.status.damage.data.push({ text: content, px: px, py: py - 10 * i, color: color });
				i++;
			}
		}
		core.formatBigNumber = utils.prototype.formatBigNumber = function (x, onMap, onCritical) {
			x = Math.floor(parseFloat(x));
			if (!core.isset(x) || !Number.isFinite(x)) return '???';
			if (x > 1e24 || x < -1e24) return x.toExponential(2);
			var c = x < 0 ? "-" : "";
			if (onCritical) c = '-> ';
			x = Math.abs(x);
			if (x <= 9999 || (!onMap && x <= 999999)) return c + x;
			var all = [
				{ "val": 1e20, "c": "g" },
				{ "val": 1e16, "c": "j" },
				{ "val": 1e12, "c": "z" },
				{ "val": 1e8, "c": "e" },
				{ "val": 1e4, "c": "w" },
			]
			for (var i = 0; i < all.length; i++) {
				var one = all[i];
				if (onMap) {
					if (x >= one.val) {
						var v = x / one.val;
						return c + v.toFixed(Math.max(0, Math.floor((c == "-" ? 2 : 3) - Math.log10(v + 1)))) + one.c;
					}
				} else {
					if (x >= 10 * one.val) {
						var v = x / one.val;
						return c + v.toFixed(Math.max(0, Math.floor(4 - Math.log10(v + 1)))) + one.c;
					}
				}
			}
			return c + x;
		};
	},
	"autoGetItem": function () {
		var enable = true;
		if (!enable) return;
		// 
		// var noUpdate = false;
		////// 更新状态栏 ////// 不建议状态栏刷新后触发 容易导致录像不一致的问题
		//control.prototype.updateStatusBar = function (doNotCheckAutoEvents) {
		//	if (!core.isPlaying()) return;
		//	if (noUpdate) return;
		//	noUpdate = true;
		//	core.autoGetItem();
		//	noUpdate = false;
		//	this.controldata.updateStatusBar();
		//	if (!doNotCheckAutoEvents) core.checkAutoEvents();
		//	this._updateStatusBar_setToolboxIcon();
		//	core.clearRouteFolding();
		//}

		////// 每移动一格后执行的事件 //////
		control.prototype.moveOneStep = function (callback) {
			core.autoGetItem();
			return this.controldata.moveOneStep(callback);
		}

		function bfsFlood (sx, sy, blockfn) {
			var canMoveArray = core.generateMovableArray();
			var blocksObj = core.getMapBlocksObj();
			var bgMap = core.getBgMapArray();

			var visited = [],
				queue = [];
			visited[sx + "," + sy] = 0;
			queue.push(sx + "," + sy);

			while (queue.length > 0) {
				var now = queue.shift().split(","),
					x = ~~now[0],
					y = ~~now[1];
				for (var direction in core.utils.scan) {
					if (!core.inArray(canMoveArray[x][y], direction)) continue;
					var nx = x + core.utils.scan[direction].x,
						ny = y + core.utils.scan[direction].y,
						nindex = nx + "," + ny;
					if (visited[nindex]) continue;
					if (core.onSki(bgMap[ny][nx])) continue;
					if (blockfn && !blockfn(blocksObj, nx, ny)) continue;
					visited[nindex] = visited[now] + 1;
					queue.push(nindex);
				}
			}
		}

		function attractAnimate () {
			var name = 'attractAnimate';
			var isPlaying = false;
			this.nodes = [];

			this.add = function (id, x, y, callback) {
				this.nodes.push({ id: id, x: x, y: y, callback: callback });
			}
			this.start = function () {
				if (isPlaying) return;
				isPlaying = true;
				core.registerAnimationFrame(name, true, this.update);
				this.ctx = core.createCanvas(name, 0, 0, core.__PIXELS__, core.__PIXELS__, 120);
			}
			this.remove = function () {
				core.unregisterAnimationFrame(name);
				core.deleteCanvas(name);
				isPlaying = false;
			}
			this.clear = function () {
				this.nodes = [];
				this.remove();
			}
			var lastTime = -1;
			var self = this;
			this.update = function (timeStamp) {
				if (lastTime < 0) lastTime = timeStamp;
				if (timeStamp - lastTime < 20) return;
				lastTime = timeStamp;
				core.clearMap(name);
				var cx = core.status.heroCenter.px - 16,
					cy = core.status.heroCenter.py - 16;
				var thr = 5; //缓动比例倒数 越大移动越慢
				self.nodes.forEach(function (n) {
					var dx = cx - n.x,
						dy = cy - n.y;
					if (Math.abs(dx) <= thr && Math.abs(dy) <= thr) {
						n.dead = true;
					} else {
						n.x += ~~(dx / thr);
						n.y += ~~(dy / thr);
					}
					core.drawIcon(name, n.id, n.x, n.y, 32, 32);
				});
				self.nodes = self.nodes.filter(function (n) {
					if (n.dead && n.callback) {
						n.callback();
					}
					return !n.dead;
				});
				if (self.nodes.length == 0)
					self.remove();
			}
		}


		var animateHwnd = new attractAnimate();

		this.stopAttractAnimate = function () {
			animateHwnd.clear();
		}

		this.autoGetItem = function () {
			if (!flags.autoItem) return;
			var canGetItems = {};
			if (!core.status.floorId || !core.status.checkBlock.damage || core.status.event.id == 'action' || core.status.lockControl) return;
			if (Object.keys(core.status.checkBlock.damage).indexOf(core.status.hero.loc.x + "," + core.status.hero.loc.y) != -1 &&
				core.status.checkBlock.damage[core.status.hero.loc.x + "," + core.status.hero.loc.y] >= 1) return
			bfsFlood(core.getHeroLoc('x'), core.getHeroLoc('y'), function (blockMap, x, y) {
				var idx = x + ',' + y;
				if (idx in canGetItems) return false;
				var blk = blockMap[idx];
				if (blk && !blk.disable && blk.event.cls == 'items' && !core.isMapBlockDisabled(core.status.floorId, blk.x, blk.y) && blk.event.trigger == 'getItem') {
					canGetItems[idx] = { x: x, y: y, id: blk.event.id };
					return !core.status.checkBlock.damage[idx] && !core.status.checkBlock.ambush[idx];
				}
				return core.maps._canMoveDirectly_checkNextPoint(blockMap, x, y);
			});
			for (var k in canGetItems) {
				var x = canGetItems[k].x,
					y = canGetItems[k].y,
					id = canGetItems[k].id;
				core.trigger(x, y);
				animateHwnd.add(id, x * 32, y * 32);
			}
			animateHwnd.start();
		}
	},
	"equipbox": function () {
		// 注：///// *** 裹起来的区域： 该区域内参数可以随意更改调整ui绘制 不会影响总体布局
		// 请尽量修改该区域而不是其他区域 修改的时候最好可以对照现有ui修改

		///// *** 道具类型
		// cls对应name
		var itemClsName = {
			"constants": "永久道具",
			"tools": "消耗道具",
		}
		// 一页最大放的道具数量 将把整个道具左栏分成num份 每份是一个道具项
		var itemNum = 12;
		///// ***

		// 背景设置
		this.drawBoxBackground = function (ctx) {
			core.setTextAlign(ctx, "left");
			core.clearMap(ctx);
			core.deleteCanvas("_selector");
			var info = core.status.thisUIEventInfo || {};

			///// *** 背景设置
			var max = core.__PIXELS__;
			var x = 2,
				y = x,
				w = max - x * 2,
				h = w;
			var borderWidth = 2,
				borderRadius = 5, // radius:圆角矩形的圆角半径
				borderStyle = "#fff";
			var backgroundColor = "gray";
			// 设置背景不透明度(0.85)
			var backgroundAlpha = 0.85;
			///// ***

			var start_x = x + borderWidth / 2,
				start_y = y + borderWidth / 2,
				width = max - start_x * 2,
				height = max - start_y * 2;

			// 渐变色背景的一个例子(黑色渐变白色)：
			// 有关渐变色的具体知识请网上搜索canvas createGradient了解
			/*
			   var grd = ctx.createLinearGradient(x, y, x + w, y);
			   grd.addColorStop(0, "black");
			   grd.addColorStop(1, "white");
			   backgroundColor = grd;
			*/
			// 使用图片背景要注释掉下面的strokeRect和fillRoundRect
			// 图片背景的一个例子：
			/*
			   core.drawImage(ctx, "xxx.png", x, y, w, h);
			   core.strokeRect(ctx, x, y, w, h, borderStyle, borderWidth);
			*/
			core.setAlpha(ctx, backgroundAlpha);
			core.strokeRoundRect(ctx, x, y, w, h, borderRadius, borderStyle, borderWidth);
			core.fillRoundRect(ctx, start_x, start_y, width, height, borderRadius, backgroundColor);
			core.setAlpha(ctx, 1);

			///// *** 左栏配置
			var leftbar_height = height;
			// 左边栏宽度(width*0.6) 本身仅为坐标使用 需要与底下的rightbar_width(width*0.4)同时更改
			var leftbar_width = width * 0.6;
			///// ***

			// xxx_right参数 代表最右侧坐标
			var leftbar_right = start_x + leftbar_width - borderWidth / 2;
			var leftbar_bottom = start_y + leftbar_height;
			var leftbar_x = start_x;
			var leftbar_y = start_y;

			///// *** 道具栏配置
			var boxName_color = "#fff";
			var boxName_fontSize = 15;
			var boxName_font = core.ui._buildFont(boxName_fontSize, true);
			var arrow_x = 10 + start_x;
			var arrow_y = 10 + start_y;
			var arrow_width = 20;
			var arrow_style = "white";
			// 暂时只能是1 否则不太行 等待新样板(2.7.3)之后对drawArrow做优化
			var arrow_lineWidth = 1;
			// 右箭头
			var rightArrow_right = leftbar_right - 10;
			// 道具内栏顶部坐标 本质是通过该项 控制(道具栏顶部文字和箭头)与道具内栏顶部的间隔
			var itembar_top = arrow_y + 15;
			///// ***

			var itembar_right = rightArrow_right;
			var boxName = core.status.event.id == "toolbox" ? "\r[yellow]道具栏\r | 装备栏" : "道具栏 | \r[yellow]装备栏\r";
			core.drawArrow(ctx, arrow_x + arrow_width, arrow_y, arrow_x, arrow_y, arrow_style, arrow_lineWidth);
			core.drawArrow(ctx, rightArrow_right - arrow_width, arrow_y, rightArrow_right, arrow_y, arrow_style, arrow_lineWidth);
			core.setTextAlign(ctx, "center");
			core.setTextBaseline(ctx, "middle");
			var changeBox = function () {
				var id = core.status.event.id;
				core.closePanel();
				if (id == "toolbox") core.openEquipbox();
				else core.openToolbox();
			}
			core.fillText(ctx, boxName, (leftbar_right + leftbar_x) / 2, arrow_y + 2, boxName_color, boxName_font);

			///// *** 底栏按钮
			var pageBtn_radius = 8;
			// xxx_left 最左侧坐标
			var pageBtn_left = leftbar_x + 3;
			var pageBtn_right = leftbar_right - 3;
			// xxx_bottom 最底部坐标
			var pageBtn_bottom = leftbar_bottom - 2;
			var pageBtn_borderStyle = "#fff";
			var pageBtn_borderWidth = 2;
			var pageText_color = "#fff";
			// 底部按钮与上面的道具内栏的间隔大小
			var bottomSpace = 8;
			///// ***

			core.drawItemListbox_setPageBtn(ctx, pageBtn_left, pageBtn_right, pageBtn_bottom, pageBtn_radius, pageBtn_borderStyle, pageBtn_borderWidth);
			var page = info.page || 1;
			var pageFontSize = pageBtn_radius * 2 - 4;
			var pageFont = core.ui._buildFont(pageFontSize);
			core.setPageItems(page);
			var num = itemNum;
			if (core.status.event.id == "equipbox") num -= 5;
			var maxPage = info.maxPage;
			var pageText = page + " / " + maxPage;
			core.setTextAlign(ctx, "center");
			core.setTextBaseline(ctx, "bottom");
			core.fillText(ctx, pageText, (leftbar_x + leftbar_right) / 2, pageBtn_bottom, pageText_color, pageFont);
			core.addUIEventListener(start_x, start_y, leftbar_right - start_x, arrow_y - start_y + 13, changeBox);
			var itembar_height = Math.ceil(pageBtn_bottom - pageBtn_radius * 2 - pageBtn_borderWidth / 2 - bottomSpace - itembar_top);
			var oneItemHeight = (itembar_height - 4) / itemNum;
			return {
				x: start_x,
				y: start_y,
				width: width,
				height: height,
				leftbar_right: leftbar_right,
				obj: {
					x: arrow_x,
					y: itembar_top,
					width: itembar_right - arrow_x,
					height: itembar_height,
					oneItemHeight: oneItemHeight
				}
			}
		}

		this.drawItemListbox = function (ctx, obj) {
			ctx = ctx || core.canvas.ui;
			var itembar_x = obj.x,
				itembar_y = obj.y,
				itembar_width = obj.width,
				itembar_height = obj.height,
				itemNum = obj.itemNum,
				oneItemHeight = obj.oneItemHeight;
			var itembar_right = itembar_x + itembar_width;
			var info = core.status.thisUIEventInfo || {};
			var obj = {};
			var page = info.page || 1,
				index = info.index,
				select = info.select || {};

			///// *** 道具栏内栏配置
			var itembar_style = "black";
			var itembar_alpha = 0.7;
			// 一个竖屏下减少道具显示的例子:
			// if (core.domStyle.isVertical) itemNum = 10;
			// 每个道具项的上下空隙占总高度的比例
			var itembar_marginHeightRatio = 0.2;
			// 左右间隔空隙
			var item_marginLeft = 2;
			var item_x = itembar_x + 2,
				item_y = itembar_y + 2,
				item_right = itembar_right - 2,
				itemName_color = "#fff";
			// 修改此项以更换闪烁光标
			var item_selector = "winskin.png";
			///// ***

			core.setAlpha(ctx, itembar_alpha);
			core.fillRect(ctx, itembar_x, itembar_y, itembar_width, itembar_height, itembar_style);
			core.setAlpha(ctx, 1);
			var pageItems = core.setPageItems(page);
			var marginHeight = itembar_marginHeightRatio * oneItemHeight;
			core.setTextBaseline(ctx, "middle");
			var originColor = itemName_color;
			for (var i = 0; i < pageItems.length; i++) {
				itemName_color = originColor;
				var item = pageItems[i];
				// 设置某个的字体颜色的一个例子
				// if (item.id == "xxx") itemName_color = "green";
				core.drawItemListbox_drawItem(ctx, item_x, item_right, item_y, oneItemHeight, item_marginLeft, marginHeight, itemName_color, pageItems[i]);
				if (index == i + 1) core.ui._drawWindowSelector(item_selector, item_x + 1, item_y - 1, item_right - item_x - 2, oneItemHeight - 2);
				item_y += oneItemHeight;
			}
		}

		this.drawToolboxRightbar = function (ctx, obj) {
			ctx = ctx || core.canvas.ui;
			var info = core.status.thisUIEventInfo || {};
			var page = info.page || 1,
				index = info.index || 1,
				select = info.select || {};
			var start_x = obj.x,
				start_y = obj.y,
				width = obj.width,
				height = obj.height;
			var toolboxRight = start_x + width,
				toolboxBottom = start_y + height;


			///// *** 侧边栏(rightbar)背景设置(物品介绍)
			var rightbar_width = width * 0.4;
			var rightbar_height = height;
			var rightbar_lineWidth = 2;
			var rightbar_lineStyle = "#fff";
			///// ***

			var rightbar_x = toolboxRight - rightbar_width - rightbar_lineWidth / 2;
			var rightbar_y = start_y;
			core.drawLine(ctx, rightbar_x, rightbar_y, rightbar_x, rightbar_y + rightbar_height, rightbar_lineStyle, rightbar_lineWidth);

			// 获取道具id(有可能为null)
			var itemId = select.id;
			var item = core.material.items[itemId];

			///// *** 侧边栏物品Icon信息
			var iconRect_y = rightbar_y + 10;
			// space：间距
			// 这里布局设定iconRect与侧边栏左边框 itemName与工具栏右边框 itemRect与itemName的间距均为space
			var space = 15;
			var iconRect_x = rightbar_x + space;
			var iconRect_radius = 2,
				iconRect_width = 32,
				iconRect_height = 32,
				iconRect_style = "#fff",
				iconRect_lineWidth = 2;
			///// ***

			var iconRect_bottom = iconRect_y + iconRect_height,
				iconRect_right = iconRect_x + iconRect_width;

			///// *** 侧边栏各项信息
			var itemTextFontSize = 15,
				itemText_x = iconRect_x - 4,
				itemText_y = Math.floor(start_y + rightbar_height * 0.25), // 坐标取整防止模糊
				itemClsFontSize = 15,
				itemClsFont = core.ui._buildFont(itemClsFontSize),
				itemClsColor = "#fff",
				itemCls_x = itemText_x - itemClsFontSize / 2,
				itemCls_middle = (iconRect_bottom + itemText_y) / 2, //_middle代表文字的中心y坐标
				itemNameFontSize = 18,
				itemNameColor = "#fff",
				itemNameFont = core.ui._buildFont(itemNameFontSize, true);
			var itemName_x = iconRect_right + space;
			var itemName_middle = iconRect_y + iconRect_height / 2 + iconRect_lineWidth;
			// 修改这里可以编辑未选中道具时的默认值
			var defaultItem = {
				cls: "constants",
				name: "未知道具",
				text: "没有道具最永久"
			}
			var defaultEquip = {
				cls: "equips",
				name: "未知装备",
				text: "一无所有，又何尝不是一种装备",
				equip: {
					type: "装备"
				}
			}
			///// ***

			var originItem = item;
			if (core.status.event.id == "equipbox") item = item || defaultEquip;
			item = item || defaultItem;
			var itemCls = item.cls,
				itemName = item.name,
				itemText = item.text;
			/* 一个根据道具id修改道具名字(右栏)的例子
			 * if (item.id == "xxx") itemNameColor = "red";
			 */
			var itemClsName = core.getItemClsName(item);
			var itemNameMaxWidth = rightbar_width - iconRect_width - iconRect_lineWidth * 2 - space * 2;
			core.strokeRoundRect(ctx, iconRect_x, iconRect_y, iconRect_width, iconRect_height, iconRect_radius, iconRect_style, iconRect_lineWidth);
			if (item.id)
				core.drawIcon(ctx, item.id, iconRect_x + iconRect_lineWidth / 2, iconRect_y + iconRect_lineWidth / 2, iconRect_width - iconRect_lineWidth, iconRect_height - iconRect_lineWidth);
			core.setTextAlign(ctx, "left");
			core.setTextBaseline(ctx, "middle");
			core.fillText(ctx, itemName, itemName_x, itemName_middle, itemNameColor, itemNameFont, itemNameMaxWidth);
			core.fillText(ctx, "【" + itemClsName + "】", itemCls_x, itemCls_middle, itemClsColor, itemClsFont);
			var statusText = "";
			if (core.status.event.id == "equipbox") {
				var type = item.equip.type;
				if (typeof type == "string") type = core.getEquipTypeByName(type);
				var compare = core.compareEquipment(item.id, core.getEquip(type));
				if (info.select.action == "unload") compare = core.compareEquipment(null, item.id);
				// --- 变化值...
				for (var name in core.status.hero) {
					if (typeof core.status.hero[name] != 'number') continue;
					var nowValue = core.getRealStatus(name);
					// 查询新值
					var newValue = Math.floor((core.getStatus(name) + (compare.value[name] || 0)) *
						(core.getBuff(name) * 100 + (compare.percentage[name] || 0)) / 100);
					if (nowValue == newValue) continue;
					var color = newValue > nowValue ? '#00FF00' : '#FF0000';
					nowValue = core.formatBigNumber(nowValue);
					newValue = core.formatBigNumber(newValue);
					statusText += core.getStatusLabel(name) + " " + nowValue + "->\r[" + color + "]" + newValue + "\r\n";
				}
			}
			itemText = statusText + itemText;
			core.drawTextContent(ctx, itemText, {
				left: itemText_x,
				top: itemText_y,
				bold: false,
				color: "white",
				align: "left",
				fontSize: itemTextFontSize,
				maxWidth: rightbar_width - (itemText_x - rightbar_x) * 2 + itemTextFontSize / 2
			});

			///// *** 退出按钮设置
			var btnRadius = 10;
			var btnBorderWidth = 2;
			var btnRight = toolboxRight - 2;
			var btnBottom = toolboxBottom - 2;
			var btnBorderStyle = "#fff";
			///// ***

			// 获取圆心位置
			var btn_x = btnRight - btnRadius - btnBorderWidth / 2;
			btn_y = btnBottom - btnRadius - btnBorderWidth / 2;
			core.drawToolbox_setExitBtn(ctx, btn_x, btn_y, btnRadius, btnBorderStyle, btnBorderWidth);

			///// *** 使用按钮设置
			var useBtnHeight = btnRadius * 2;
			// 这里不设置useBtnWidth而是根据各项数据自动得出width
			var useBtnRadius = useBtnHeight / 2;
			var useBtn_x = rightbar_x + 4,
				useBtn_y = btnBottom - useBtnHeight;
			var useBtnBorderStyle = "#fff";
			var useBtnBorderWidth = btnBorderWidth;
			///// ***

			core.drawToolbox_setUseBtn(ctx, useBtn_x, useBtn_y, useBtnRadius, useBtnHeight, useBtnBorderStyle, useBtnBorderWidth);
		}

		this.drawEquipbox_drawOthers = function (ctx, obj) {
			var info = core.status.thisUIEventInfo;

			///// *** 装备格设置
			var equipList_lineWidth = 2;
			var equipList_boxSize = 32;
			var equipList_borderWidth = 2;
			var equipList_borderStyle = "#fff";
			var equipList_nameColor = "#fff";
			///// ***

			var equipList_x = obj.x + 4,
				equipList_bottom = obj.obj.y - equipList_lineWidth,
				equipList_y = equipList_bottom - obj.obj.oneItemHeight * reduceItem - 2,
				equipList_height = equipList_bottom - equipList_y;
			var equipList_right = obj.leftbar_right,
				equipList_width = equipList_right - equipList_x;
			core.drawLine(ctx, obj.x, equipList_bottom + equipList_lineWidth / 2, equipList_right, equipList_bottom + equipList_lineWidth / 2, equipList_borderStyle, equipList_lineWidth);
			var toDrawList = core.status.globalAttribute.equipName,
				len = toDrawList.length;

			///// *** 装备格设置
			var maxItem = 4;
			var box_width = 32,
				box_height = 32,
				box_borderStyle = "#fff",
				box_selectBorderStyle = "gold", // 选中的装备格的颜色
				box_borderWidth = 2;
			var boxName_fontSize = 14,
				boxName_space = 2,
				boxName_color = "#fff"; // 装备格名称与上面的装备格框的距离
			var maxLine = Math.ceil(len / maxItem);
			///// ***
			var l = Math.sqrt(len)
			if (Math.pow(l) == len && len != 4) {
				if (l <= maxItem) maxItem = l;
			}
			maxItem = Math.min(toDrawList.length, maxItem);
			info.equips = maxItem;

			var boxName_font = core.ui._buildFont(boxName_fontSize);
			// 总宽高减去所有装备格宽高得到空隙大小
			var oneBoxWidth = box_width + box_borderWidth * 2;
			var oneBoxHeight = box_height + boxName_fontSize + boxName_space + 2 * box_borderWidth;
			var space_y = (equipList_height - maxLine * oneBoxHeight) / (1 + maxLine),
				space_x = (equipList_width - maxItem * oneBoxWidth) / (1 + maxItem);
			var box_x = equipList_x + space_x,
				box_y = equipList_y + space_y;
			for (var i = 0; i < len; i++) {
				var id = core.getEquip(i),
					name = toDrawList[i];
				var selectBorder = false;
				if (core.status.thisUIEventInfo.select.type == i) selectBorder = true;
				var borderStyle = selectBorder ? box_selectBorderStyle : box_borderStyle;
				core.drawEquipbox_drawOne(ctx, name, id, box_x, box_y, box_width, box_height, boxName_space, boxName_font, boxName_color, borderStyle, box_borderWidth);
				var todo = new Function("core.clickOneEquipbox('" + id + "'," + i + ")");
				core.addUIEventListener(box_x - box_borderWidth / 2, box_y - box_borderWidth / 2, oneBoxWidth, oneBoxHeight, todo);
				box_x += space_x + oneBoxWidth;
				if ((i + 1) % maxItem == 0) {
					box_x = equipList_x + space_x;
					box_y += space_y + oneBoxHeight;
				}
			}
		}

		this.drawToolbox = function (ctx) {
			ctx = ctx || core.canvas.ui;
			core.status.thisEventClickArea = [];

			var info = core.drawBoxBackground(ctx);
			info.itemNum = itemNum;
			core.drawItemListbox(ctx, info.obj);
			core.drawToolboxRightbar(ctx, info);
			core.setTextBaseline(ctx, "alphabetic");
			core.setTextAlign("left");
		}

		var reduceItem = 4;
		this.drawEquipbox = function (ctx) {
			ctx = ctx || core.canvas.ui;
			core.status.thisEventClickArea = [];
			var info = core.drawBoxBackground(ctx);
			info.itemNum = itemNum - reduceItem;
			info.obj.y += info.obj.oneItemHeight * reduceItem;
			info.obj.height -= info.obj.oneItemHeight * reduceItem;
			core.drawItemListbox(ctx, info.obj);
			core.drawEquipbox_drawOthers(ctx, info);
			core.drawToolboxRightbar(ctx, info);
			core.setTextBaseline(ctx, "alphabetic");
			core.setTextAlign("left");
		}


		this.drawEquipbox_drawOne = function (ctx, name, id, x, y, width, height, space, font, color, style, lineWidth) {
			if (id) core.drawIcon(ctx, id, x + lineWidth / 2, y + lineWidth / 2, width, height);
			core.strokeRect(ctx, x, y, width + lineWidth, height + lineWidth, style, lineWidth);
			core.setTextAlign(ctx, "center");
			core.setTextBaseline(ctx, "top");
			var tx = (x + x + lineWidth / 2 + width) / 2,
				ty = y + height + lineWidth / 2 * 3 + space;
			core.fillText(ctx, name, tx, ty, color, font);
			core.setTextBaseline(ctx, "alphabetic");
			core.setTextAlign("left");
		}

		this.drawItemListbox_drawItem = function (ctx, left, right, top, height, marginLeft, marginHeight, style, id) {
			var info = core.status.thisUIEventInfo;
			var nowClick = info.index;
			var item = core.material.items[id] || {};
			var name = item.name || "???";
			var num = core.itemCount(id) || 0;
			var fontSize = Math.floor(height - marginHeight * 2);
			core.setTextAlign(ctx, "right");
			var numText = "x" + num;
			core.fillText(ctx, numText, right - marginLeft, top + height / 2, style, core.ui._buildFont(fontSize));
			if (name != "???") core.drawIcon(ctx, id, left + marginLeft, top + marginHeight, fontSize, fontSize);
			var text_x = left + marginLeft + fontSize + 2;
			var maxWidth = right - core.calWidth(ctx, numText) - text_x;
			core.setTextAlign(ctx, "left");
			core.fillText(ctx, name, text_x, top + height / 2, style, core.ui._buildFont(fontSize), maxWidth);
			var todo = new Function("var id = '" + id + "';\ncore.clickItemFunc(id)");
			core.addUIEventListener(left, top, right - left, height, todo);
		}

		this.setPageItems = function (page) {
			var num = itemNum;
			if (core.status.event.id == "equipbox") num -= reduceItem;
			var info = core.status.thisUIEventInfo;
			if (!info) return;
			page = page || info.page;
			var items = core.getToolboxItems(core.status.event.id == "toolbox" ? "all" : "equips");
			info.allItems = items;
			var maxPage = Math.ceil(items.length / num);
			info.maxPage = maxPage;
			var pageItems = items.slice((page - 1) * num, page * num);
			info.pageItems = pageItems;
			info.maxItem = pageItems.length;
			if (items.length == 0 && pageItems.length == 0) info.index = null;
			if (pageItems.length == 0 && info.page > 1) {
				info.page = Math.max(1, info.page - 1);
				return core.setPageItems(info.page);
			}
			return pageItems;
		}

		this.drawToolbox_setExitBtn = function (ctx, x, y, r, style, lineWidth) {
			core.strokeCircle(ctx, x, y, r, style, lineWidth);
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			var textSize = Math.sqrt(2) * r;
			core.fillText(ctx, "x", x, y, style, core.ui._buildFont(textSize), textSize);
			core.setTextAlign(ctx, "start");
			core.setTextBaseline(ctx, "top");

			var todo = function () {
				core.closePanel();
			}
			core.addUIEventListener(x - r, y - r, r * 2, r * 2, todo);
		}

		this.drawToolbox_setUseBtn = function (ctx, x, y, r, h, style, lineWidth) {
			core.setTextAlign(ctx, "left");
			core.setTextBaseline(ctx, "top");
			var fontSize = h - 4;
			var font = core.ui._buildFont(fontSize);
			var text = core.status.event.id == "toolbox" ? "使用" : "装备";
			if (core.status.thisUIEventInfo.select.action == "unload") text = "卸下";
			var w = core.calWidth(ctx, text, font) + 2 * r + lineWidth / 2;

			core.strokeRoundRect(ctx, x, y, w, h, r, style, lineWidth);
			core.fillText(ctx, text, x + r, y + lineWidth / 2 + 2, style, font);

			var todo = function () {
				core.useSelectItemInBox();
			}
			core.addUIEventListener(x, y, w, h, todo);
		}

		this.drawItemListbox_setPageBtn = function (ctx, left, right, bottom, r, style, lineWidth) {
			var offset = lineWidth / 2 + r;

			var x = left + offset;
			var y = bottom - offset;
			var pos = Math.sqrt(2) / 2 * (r - lineWidth / 2);
			core.fillPolygon(ctx, [
				[x - pos, y],
				[x + pos - 2, y - pos],
				[x + pos - 2, y + pos]
			], style);
			core.strokeCircle(ctx, x, y, r, style, lineWidth);
			var todo = function () {
				core.addItemListboxPage(-1);
			}
			core.addUIEventListener(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4, todo);

			x = right - offset;
			core.fillPolygon(ctx, [
				[x + pos, y],
				[x - pos + 2, y - pos],
				[x - pos + 2, y + pos]
			], style);
			core.strokeCircle(ctx, x, y, r, style, lineWidth);
			var todo = function () {
				core.addItemListboxPage(1);
			}
			core.addUIEventListener(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4, todo);
		}

		this.clickItemFunc = function (id) {
			var info = core.status.thisUIEventInfo;
			if (!info) return;
			if (info.select.id == id) return core.useSelectItemInBox();
			info.select = {};
			info.select.id = id;
			core.setIndexAndSelect('index');
			core.refreshBox();
		}

		this.clickOneEquipbox = function (id, type) {
			var info = core.status.thisUIEventInfo;
			if (!info) return;
			if (info.select.id == id && info.select.type == type) core.useSelectItemInBox();
			else core.status.thisUIEventInfo.select = {
				id: id,
				type: type,
				action: "unload"
			}
			return core.refreshBox();
		}

		core.ui.getToolboxItems = function (cls) {
			var list = Object.keys(core.status.hero.items[cls] || {});
			if (cls == "all") {
				for (var name in core.status.hero.items) {
					if (name == "equips") continue;
					list = list.concat(Object.keys(core.status.hero.items[name]));
				}
				return list.filter(function (id) {
					return !core.material.items[id].hideInToolbox;
				}).sort();
			}

			if (this.uidata.getToolboxItems) {
				return this.uidata.getToolboxItems(cls);
			}
			return list.filter(function (id) {
				return !core.material.items[id].hideInToolbox;
			}).sort();
		}

		this.useSelectItemInBox = function () {
			var info = core.status.thisUIEventInfo;
			if (!info) return;
			if (!info.select.id) return;
			var id = info.select.id;
			if (core.status.event.id == "toolbox") {
				core.events.tryUseItem(id);
				// core.closePanel();
			} else if (core.status.event.id == "equipbox") {
				var action = info.select.action || "load";
				info.index = 1;
				if (action == "load") {
					var type = core.getEquipTypeById(id);
					core.loadEquip(id, function () {
						core.status.route.push("equip:" + id);
						info.select.type = type;
						core.setIndexAndSelect("select");
						core.drawEquipbox();
					});
				} else {
					var type = info.select.type;
					core.unloadEquip(type, function () {
						core.status.route.push("unEquip:" + type);
						core.setIndexAndSelect("select");
						core.drawEquipbox();
					});
				}
			}
		}

		this.setIndexAndSelect = function (toChange) {
			var info = core.status.thisUIEventInfo;
			if (!info) return;
			core.setPageItems(info.page);
			var index = info.index || 1;
			var items = info.pageItems;
			if (info.select.type) {
				var type = info.select.type;
				id = core.getEquip(type);
				info.index = null;
				info.select = {
					id: id,
					action: "unload",
					type: type
				};
				return;
			} else {
				info.select.type = null;
			}
			if (toChange == "index") info.index = items.indexOf(info.select.id) + 1;
			else {
				var id = info.pageItems[index - 1];
				info.select.id = id;
			}
		}

		this.addItemListboxPage = function (num) {
			var info = core.status.thisUIEventInfo;
			if (!info) return;
			var maxPage = info.maxPage || 1;
			info.page = info.page || 1;
			info.page += num;
			if (info.page <= 0) info.page = maxPage;
			if (info.page > maxPage) info.page = 1;
			info.index = 1;
			core.setPageItems(info.page);
			core.setIndexAndSelect("select");
			core.refreshBox();
		}

		this.addItemListboxIndex = function (num) {
			var info = core.status.thisUIEventInfo;
			if (!info) return;
			var maxItem = info.maxItem || 0;
			info.index = info.index || 0;
			info.index += num;
			if (info.index <= 0) info.index = 1;
			if (info.index > maxItem) info.index = maxItem;
			core.setIndexAndSelect("select");
			core.refreshBox();
		}

		this.addEquipboxType = function (num) {
			var info = core.status.thisUIEventInfo;
			var type = info.select.type;
			if (type == null && num > 0) info.select.type = 0;
			else info.select.type = type + num;
			var max = core.status.globalAttribute.equipName.length;
			if (info.select.type >= max) {
				info.select = {};
				return core.addItemListboxPage(0);
			} else {
				var m = Math.abs(info.select.type);
				if (info.select.type < 0) info.select.type = max - m;
				core.refreshBox();
				return;
			}
		}

		core.actions._keyDownToolbox = function (keycode) {
			if (!core.status.thisEventClickArea) return;
			if (keycode == 37) { // left
				core.addItemListboxPage(-1);
				return;
			}
			if (keycode == 38) { // up
				core.addItemListboxIndex(-1);
				return;
			}
			if (keycode == 39) { // right
				core.addItemListboxPage(1);
				return;
			}
			if (keycode == 40) { // down
				core.addItemListboxIndex(1);
				return;
			}
		}

		////// 工具栏界面时，放开某个键的操作 //////
		core.actions._keyUpToolbox = function (keycode) {
			if (keycode == 81) {
				core.ui.closePanel();
				if (core.isReplaying())
					core.control._replay_equipbox();
				else
					core.openEquipbox();
				return;
			}
			if (keycode == 84 || keycode == 27 || keycode == 88) {
				core.closePanel();
				return;
			}
			if (keycode == 13 || keycode == 32 || keycode == 67) {
				var info = core.status.thisUIEventInfo;
				if (info.select) {
					core.useSelectItemInBox();
				}
				return;
			}
		}

		core.actions._keyDownEquipbox = function (keycode) {
			if (!core.status.thisEventClickArea) return;
			if (keycode == 37) { // left
				var info = core.status.thisUIEventInfo;
				if (info.index != null) return core.addItemListboxPage(-1);
				return core.addEquipboxType(-1);
			}
			if (keycode == 38) { // up
				var info = core.status.thisUIEventInfo;
				if (info.index == 1) {
					info.select.type = core.status.globalAttribute.equipName.length - 1;
					core.setIndexAndSelect();
					return core.refreshBox();
				}
				if (info.index) return core.addItemListboxIndex(-1);
				return core.addEquipboxType(-1 * info.equips);
			}
			if (keycode == 39) { // right
				var info = core.status.thisUIEventInfo;
				if (info.index != null) return core.addItemListboxPage(1);
				return core.addEquipboxType(1);
			}
			if (keycode == 40) { // down
				var info = core.status.thisUIEventInfo;
				if (info.index) return core.addItemListboxIndex(1);
				return core.addEquipboxType(info.equips);
			}
		}

		core.actions._keyUpEquipbox = function (keycode, altKey) {
			if (altKey && keycode >= 48 && keycode <= 57) {
				core.items.quickSaveEquip(keycode - 48);
				return;
			}
			if (keycode == 84) {
				core.ui.closePanel();
				if (core.isReplaying())
					core.control._replay_toolbox();
				else
					core.openToolbox();
				return;
			}
			if (keycode == 81 || keycode == 27 || keycode == 88) {
				core.closePanel();
				return;
			}
			if (keycode == 13 || keycode == 32 || keycode == 67) {
				var info = core.status.thisUIEventInfo;
				if (info.select) core.useSelectItemInBox();
				return;
			}
		}

		core.registerAction("ondown", "inEventClickAction", function (x, y, px, py) {
			if (!core.status.thisEventClickArea) return false;
			// console.log(px + "," + py);
			var info = core.status.thisEventClickArea;
			for (var i = 0; i < info.length; i++) {
				var obj = info[i];
				if (px >= obj.x && px <= obj.x + obj.width && py > obj.y && py < obj.y + obj.height) {
					if (obj.todo) obj.todo();
					break;
				}
			}
			return true;
		}, 51);
		core.registerAction("onclick", "stopClick", function () {
			if (core.status.thisEventClickArea) return true;
		}, 51);

		this.addUIEventListener = function (x, y, width, height, todo) {
			if (!core.status.thisEventClickArea) return;
			var obj = {
				x: x,
				y: y,
				width: width,
				height: height,
				todo: todo
			}
			core.status.thisEventClickArea.push(obj);
		}

		this.initThisEventInfo = function () {
			core.status.thisUIEventInfo = {
				page: 1,
				select: {}
			};
			core.status.thisEventClickArea = [];
		}

		this.refreshBox = function () {
			if (!core.status.event.id) return;
			if (core.status.event.id == "toolbox") core.drawToolbox();
			else core.drawEquipbox();
		}

		this.getItemClsName = function (item) {
			if (item == null) return itemClsName;
			if (item.cls == "equips") {
				if (typeof item.equip.type == "string") return item.equip.type;
				var type = core.getEquipTypeById(item.id);
				return core.status.globalAttribute.equipName[type];
			} else return itemClsName[item.cls] || item.cls;
		}

		core.events.openToolbox = function (fromUserAction) {
			if (core.isReplaying()) return;
			if (!this._checkStatus('toolbox', fromUserAction)) return;
			core.initThisEventInfo();
			core.drawToolbox();
		}

		core.events.openEquipbox = function (fromUserAction) {
			if (core.isReplaying()) return;
			if (!this._checkStatus('equipbox', fromUserAction)) return;
			core.initThisEventInfo();
			core.drawEquipbox();
		}

		core.control._replay_toolbox = function () {
			if (!core.isPlaying() || !core.isReplaying()) return;
			if (!core.status.replay.pausing) return core.drawTip("请先暂停录像");
			if (core.isMoving() || core.status.replay.animate || core.status.event.id)
				return core.drawTip("请等待当前事件的处理结束");

			core.lockControl();
			core.status.event.id = 'toolbox';
			core.drawToolbox();
		}

		core.control._replay_equipbox = function () {
			if (!core.isPlaying() || !core.isReplaying()) return;
			if (!core.status.replay.pausing) return core.drawTip("请先暂停录像");
			if (core.isMoving() || core.status.replay.animate || core.status.event.id)
				return core.drawTip("请等待当前事件的处理结束");

			core.lockControl();
			core.status.event.id = 'equipbox';
			core.drawEquipbox();
		}

		core.control._replayAction_item = function (action) {
			if (action.indexOf("item:") != 0) return false;
			var itemId = action.substring(5);
			if (!core.canUseItem(itemId)) return false;
			if (core.material.items[itemId].hideInReplay || core.status.replay.speed == 24) {
				core.useItem(itemId, false, core.replay);
				return true;
			}
			core.status.event.id = "toolbox";
			core.initThisEventInfo();
			var info = core.status.thisUIEventInfo;
			var items = core.getToolboxItems("all");
			core.setPageItems(1);
			var index = items.indexOf(itemId) + 1;
			info.page = Math.ceil(index / info.maxItem);
			info.index = index % info.maxItem || info.maxItem;
			core.setIndexAndSelect("select");
			core.setPageItems(info.page);
			core.drawToolbox();
			setTimeout(function () {
				core.ui.closePanel();
				core.useItem(itemId, false, core.replay);
			}, core.control.__replay_getTimeout());
			return true;
		}

		core.control._replayAction_equip = function (action) {
			if (action.indexOf("equip:") != 0) return false;
			var itemId = action.substring(6);
			var items = core.getToolboxItems('equips');
			var index = items.indexOf(itemId) + 1;
			if (index < 1) return false;
			core.status.route.push(action);
			if (core.material.items[itemId].hideInReplay || core.status.replay.speed == 24) {
				core.loadEquip(itemId, core.replay);
				return true;
			}
			core.status.event.id = "equipbox";
			core.initThisEventInfo();
			var info = core.status.thisUIEventInfo;
			core.setPageItems(1);
			info.page = Math.ceil(index / info.maxItem);
			info.index = index % info.maxItem || info.maxItem;
			core.setIndexAndSelect("select");
			core.setPageItems(info.page);
			core.drawEquipbox();
			setTimeout(function () {
				core.ui.closePanel();
				core.loadEquip(itemId, core.replay);
			}, core.control.__replay_getTimeout());
			return true;
		}

		core.control._replayAction_unEquip = function (action) {
			if (action.indexOf("unEquip:") != 0) return false;
			var equipType = parseInt(action.substring(8));
			if (!core.isset(equipType)) return false;
			core.status.route.push(action);
			if (core.status.replay.speed == 24) {
				core.unloadEquip(equipType, core.replay);
				return true;
			}
			core.status.event.id = "equipbox";
			core.initThisEventInfo();
			var info = core.status.thisUIEventInfo;
			core.setPageItems(1);
			info.select.type = equipType;
			core.setIndexAndSelect();
			core.drawEquipbox();
			setTimeout(function () {
				core.ui.closePanel();
				core.unloadEquip(equipType, core.replay);
			}, core.control.__replay_getTimeout());
			return true;
		}
		core.registerReplayAction("item", core.control._replayAction_item);
		core.registerReplayAction("equip", core.control._replayAction_equip);
		core.registerReplayAction("unEquip", core.control._replayAction_unEquip);
	}
}