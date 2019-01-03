/*global friGame */
/*jshint bitwise: true, curly: true, eqeqeq: true, esversion: 3, forin: true, freeze: true, funcscope: true, futurehostile: true, iterator: true, latedef: true, noarg: true, nocomma: true, nonbsp: true, nonew: true, notypeof: false, shadow: outer, singleGroups: false, strict: true, undef: true, unused: true, varstmt: false, eqnull: false, plusplus: true, browser: true, laxbreak: true, laxcomma: true */

// Copyright (c) 2011-2019 Franco Bugnano

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Uses ideas and APIs inspired by:
// gameQuery Copyright (c) 2008 Selim Arsever (gamequery.onaluf.org), licensed under the MIT

(function (fg) {
	'use strict';

	var
		isoGroupMakers,
		SCREEN_PREFIX = 'friGame_iso_',
		SCREEN_POSTFIX = '_screen'
	;

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	// Functions for coordinate conversion
	fg.extend(fg, {
		screenFromGrid: function (x, y) {
			var
				screen_x = x - y,
				screen_y = (x + y) / 2
			;

			return [screen_x, screen_y];
		},

		gridFromScreen: function (x, y) {
			var
				grid_x = y + (x / 2),
				grid_y = y - (x / 2)
			;

			return [grid_x, grid_y];
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	function baseISOSpriteMove(method, options) {
		/*jshint validthis: true */
		var
			new_options = options || {},
			elevation,
			screen,
			screen_x,
			screen_y,
			screen_obj = fg.s[this.screen_name],
			my_options = this.options,
			originx = my_options.originx,
			originy = my_options.originy,
			referencex = my_options.referencex,
			referencey = my_options.referencey,
			round = fg.truncate
		;

		fg.PBaseSprite[method].call(this, options);

		if (typeof originx === 'string') {
			originx = screen_obj[originx];
		}

		if (typeof originy === 'string') {
			originy = screen_obj[originy];
		}

		if (typeof referencex === 'string') {
			referencex = this[referencex];
		}

		if (typeof referencey === 'string') {
			referencey = this[referencey];
		}

		if (new_options.elevation !== undefined) {
			elevation = round(new_options.elevation);
			this.elevation = elevation;

			screen_obj.originy(originy + elevation);
		} else {
			elevation = this.elevation;
		}

		// Step 1: Calculate the screen object position
		screen = fg.screenFromGrid(this.left + referencex, this.top + referencey);
		screen_x = round(screen[0]);
		screen_y = round(screen[1]);

		// Step 2: Move the screen object
		screen_obj[method]({
			left: screen_x - originx,
			top: screen_y - originy - elevation
		});

		return this;
	}


	fg.PBaseISOSprite = Object.create(fg.PBaseSprite);
	fg.extend(fg.PBaseISOSprite, {
		// Public functions

		move: function (options) {
			return baseISOSpriteMove.call(this, 'move', options);
		},

		teleport: function (options) {
			return baseISOSpriteMove.call(this, 'teleport', options);
		},

		origin: function (originx, originy) {
			var
				options = this.options,
				screen_obj = fg.s[this.screen_name],
				round = fg.truncate
			;

			if (originx === undefined) {
				return options.originx;
			}

			if (typeof originx === 'string') {
				if (window.console) {
					if (!((originx === 'halfWidth') || (originx === 'width'))) {
						console.error('Invalid originx: ' + originx);
						console.trace();
					}
				}
			} else {
				originx = round(originx) || 0;
			}

			options.originx = originx;

			if (originy === undefined) {
				// If originy isn't specified, it is assumed to be equal to originx.
				if (originx === 'halfWidth') {
					originy = 'halfHeight';
				} else if (originx === 'width') {
					originy = 'height';
				} else {
					originy = originx;
				}
			} else {
				if (typeof originy === 'string') {
					if (window.console) {
						if (!((originy === 'halfHeight') || (originy === 'height'))) {
							console.error('Invalid originy: ' + originy);
							console.trace();
						}
					}
				} else {
					originy = round(originy) || 0;
				}
			}

			options.originy = originy;

			if (typeof originy === 'string') {
				originy = screen_obj[originy];
			}

			screen_obj.origin(originx, originy + this.elevation);

			this.move();

			return this;
		},

		originx: function (originx) {
			var
				options = this.options
			;

			if (originx === undefined) {
				return options.originx;
			}

			if (typeof originx === 'string') {
				if (window.console) {
					if (!((originx === 'halfWidth') || (originx === 'width'))) {
						console.error('Invalid originx: ' + originx);
						console.trace();
					}
				}
			} else {
				originx = fg.truncate(originx) || 0;
			}

			options.originx = originx;

			fg.s[this.screen_name].originx(originx);

			this.move();

			return this;
		},

		originy: function (originy) {
			var
				options = this.options,
				screen_obj = fg.s[this.screen_name]
			;

			if (originy === undefined) {
				return options.originy;
			}

			if (typeof originy === 'string') {
				if (window.console) {
					if (!((originy === 'halfHeight') || (originy === 'height'))) {
						console.error('Invalid originy: ' + originy);
						console.trace();
					}
				}
			} else {
				originy = fg.truncate(originy) || 0;
			}

			options.originy = originy;

			if (typeof originy === 'string') {
				originy = screen_obj[originy];
			}

			screen_obj.originy(originy + this.elevation);

			this.move();

			return this;
		},

		reference: function (referencex, referencey) {
			var
				options = this.options,
				round = fg.truncate
			;

			if (referencex === undefined) {
				return options.referencex;
			}

			if (typeof referencex === 'string') {
				if (window.console) {
					if (!((referencex === 'halfWidth') || (referencex === 'width'))) {
						console.error('Invalid referencex: ' + referencex);
						console.trace();
					}
				}
			} else {
				referencex = round(referencex) || 0;
			}

			options.referencex = referencex;

			if (referencey === undefined) {
				// If referencey isn't specified, it is assumed to be equal to referencex.
				if (referencex === 'halfWidth') {
					options.referencey = 'halfHeight';
				} else if (referencex === 'width') {
					options.referencey = 'height';
				} else {
					options.referencey = referencex;
				}
			} else {
				if (typeof referencey === 'string') {
					options.referencey = referencey;

					if (window.console) {
						if (!((referencey === 'halfHeight') || (referencey === 'height'))) {
							console.error('Invalid referencey: ' + referencey);
							console.trace();
						}
					}
				} else {
					options.referencey = round(referencey) || 0;
				}
			}

			this.move();

			return this;
		},

		referencex: function (referencex) {
			var
				options = this.options
			;

			if (referencex === undefined) {
				return options.referencex;
			}

			if (typeof referencex === 'string') {
				options.referencex = referencex;

				if (window.console) {
					if (!((referencex === 'halfWidth') || (referencex === 'width'))) {
						console.error('Invalid referencex: ' + referencex);
						console.trace();
					}
				}
			} else {
				options.referencex = fg.truncate(referencex) || 0;
			}

			this.move();

			return this;
		},

		referencey: function (referencey) {
			var
				options = this.options
			;

			if (referencey === undefined) {
				return options.referencey;
			}

			if (typeof referencey === 'string') {
				options.referencey = referencey;

				if (window.console) {
					if (!((referencey === 'halfHeight') || (referencey === 'height'))) {
						console.error('Invalid referencey: ' + referencey);
						console.trace();
					}
				}
			} else {
				options.referencey = fg.truncate(referencey) || 0;
			}

			this.move();

			return this;
		},

		getScreenRect: function () {
			var
				options = this.options,
				originx = options.originx,
				originy = options.originy,
				screen_obj = fg.s[this.screen_name],
				screen_rect = fg.Rect(screen_obj)
			;

			if (typeof originx === 'string') {
				originx = screen_obj[originx];
			}

			if (typeof originy === 'string') {
				originy = screen_obj[originy];
			}

			screen_rect.originx = originx;
			screen_rect.originy = originy;
			screen_rect.elevation = this.elevation;

			return screen_rect;
		},

		// Proxy functions

		hide: function () {
			fg.s[this.screen_name].hide();

			return this;
		},

		show: function () {
			fg.s[this.screen_name].show();

			return this;
		},

		toggle: function (showOrHide) {
			fg.s[this.screen_name].toggle(showOrHide);

			return this;
		},

		drawFirst: function () {
			fg.PBaseSprite.drawFirst.apply(this, arguments);

			fg.s[this.screen_name].drawFirst();

			return this;
		},

		drawLast: function () {
			fg.PBaseSprite.drawLast.apply(this, arguments);

			fg.s[this.screen_name].drawLast();

			return this;
		},

		getDrawIndex: function () {
			return fg.s[this.screen_name].getDrawIndex();
		},

		drawTo: function (index) {
			fg.PBaseSprite.drawTo.apply(this, arguments);

			fg.s[this.screen_name].drawTo(index);

			return this;
		},

		drawBefore: function (name) {
			var
				screen_obj = fg.s[name] || {}
			;

			fg.PBaseSprite.drawBefore.apply(this, arguments);

			fg.s[this.screen_name].drawBefore(screen_obj.screen_name);

			return this;
		},

		drawAfter: function (name) {
			var
				screen_obj = fg.s[name] || {}
			;

			fg.PBaseSprite.drawAfter.apply(this, arguments);

			fg.s[this.screen_name].drawAfter(screen_obj.screen_name);

			return this;
		},

		transformOrigin: function (originx, originy) {
			if (originx === undefined) {
				return fg.s[this.screen_name].transformOrigin();
			}

			fg.s[this.screen_name].transformOrigin(originx, originy);

			return this;
		},

		transformOriginx: function (originx) {
			if (originx === undefined) {
				return fg.s[this.screen_name].transformOriginx();
			}

			fg.s[this.screen_name].transformOriginx(originx);

			return this;
		},

		transformOriginy: function (originy) {
			if (originy === undefined) {
				return fg.s[this.screen_name].transformOriginy();
			}

			fg.s[this.screen_name].transformOriginy(originy);

			return this;
		},

		rotate: function (angle) {
			if (angle === undefined) {
				return fg.s[this.screen_name].rotate();
			}

			fg.s[this.screen_name].rotate(angle);

			return this;
		},

		scale: function (sx, sy) {
			if (sx === undefined) {
				return fg.s[this.screen_name].scale();
			}

			fg.s[this.screen_name].scale(sx, sy);

			return this;
		},

		scalex: function (sx) {
			if (sx === undefined) {
				return fg.s[this.screen_name].scalex();
			}

			fg.s[this.screen_name].scalex(sx);

			return this;
		},

		scaley: function (sy) {
			if (sy === undefined) {
				return fg.s[this.screen_name].scaley();
			}

			fg.s[this.screen_name].scaley(sy);

			return this;
		},

		fliph: function (flip) {
			if (flip === undefined) {
				return fg.s[this.screen_name].fliph();
			}

			fg.s[this.screen_name].fliph(flip);

			return this;
		},

		flipv: function (flip) {
			if (flip === undefined) {
				return fg.s[this.screen_name].flipv();
			}

			fg.s[this.screen_name].flipv(flip);

			return this;
		},

		opacity: function (alpha) {
			if (alpha === undefined) {
				return fg.s[this.screen_name].opacity();
			}

			fg.s[this.screen_name].opacity(alpha);

			return this;
		},

		// Implementation details

		draw: fg.noop	// The drawing is performed only on the screen objects
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PISOSprite = Object.create(fg.PBaseISOSprite);
	fg.extend(fg.PISOSprite, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {},
				referencex = new_options.referencex,
				referencey = new_options.referencey,
				sprite_options = Object.create(new_options),
				parent_obj,
				screen_name = SCREEN_PREFIX + name + SCREEN_POSTFIX,
				screen_obj,
				round = fg.truncate
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			this.screen_name = screen_name;

			// The screen sprite must be created in the screen layer
			parent_obj = fg.s[parent];
			if (parent_obj.screen_name) {
				parent_obj = fg.s[parent_obj.screen_name];
			}

			// Create the screen sprite
			if (new_options.method === 'insert') {
				parent_obj.insertSprite(screen_name, sprite_options);
			} else {
				parent_obj.addSprite(screen_name, sprite_options);
			}

			screen_obj = fg.s[screen_name];

			fg.PBaseISOSprite.init.apply(this, arguments);

			// If the animation has not been defined, force
			// the animation to null in order to resize and move
			// the sprite inside setAnimation
			if (new_options.animation === undefined) {
				new_options.animation = null;
			}

			// If the reference is not specified it defaults to the center of the image
			if (referencex === undefined) {
				my_options.referencex = 'halfWidth';
			} else if (typeof referencex === 'string') {
				my_options.referencex = referencex;

				if (window.console) {
					if (!((referencex === 'halfWidth') || (referencex === 'width'))) {
						console.error('Invalid referencex: ' + referencex);
						console.trace();
					}
				}
			} else {
				my_options.referencex = round(new_options.referencex) || 0;
			}

			if (referencey === undefined) {
				my_options.referencey = 'halfHeight';
			} else if (typeof referencey === 'string') {
				my_options.referencey = referencey;

				if (window.console) {
					if (!((referencey === 'halfHeight') || (referencey === 'height'))) {
						console.error('Invalid referencey: ' + referencey);
						console.trace();
					}
				}
			} else {
				my_options.referencey = round(new_options.referencey) || 0;
			}

			this.elevation = round(new_options.elevation) || 0;

			// Call setAnimation in order to place the screen object correctly
			this.setAnimation(new_options);
		},

		// Public functions

		remove: function () {
			var
				screen_name = this.screen_name
			;

			if (fg.s[screen_name]) {
				fg.s[screen_name].remove();
			}

			fg.PBaseISOSprite.remove.apply(this, arguments);
		},

		resize: function (options) {
			fg.PBaseISOSprite.resize.apply(this, arguments);

			// The screen object cannot be resized

			return this;
		},

		setAnimation: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				originx = new_options.originx,
				originy = new_options.originy,
				update_originy = false,
				animation,
				animation_redefined = new_options.animation !== undefined,
				sprite_options = Object.create(new_options),
				screen_obj = fg.s[this.screen_name],
				that = this,
				old_callback,
				round = fg.truncate
			;

			// The animation callback associated with the screen sprite is bound to the isometric object
			if (new_options.callback) {
				old_callback = new_options.callback;
				new_options.callback = function () {
					old_callback.call(that, that);
				};
			}

			screen_obj.setAnimation(sprite_options);

			// The setAnimation might have modified the sprite origin point, so it must be updated here
			if (animation_redefined) {
				animation = fg.r[new_options.animation];
			} else {
				animation = screen_obj.options.animation;
			}

			if (originx !== undefined) {
				if (typeof originx === 'string') {
					my_options.originx = originx;

					if (window.console) {
						if (!((originx === 'halfWidth') || (originx === 'width'))) {
							console.error('Invalid originx: ' + originx);
							console.trace();
						}
					}
				} else {
					my_options.originx = round(originx) || 0;
				}
			} else {
				if (animation_redefined) {
					if (animation) {
						my_options.originx = animation.originx;
					} else {
						my_options.originx = 'halfWidth';
					}
				}
			}

			if (originy !== undefined) {
				update_originy = true;
				if (typeof originy === 'string') {
					if (window.console) {
						if (!((originy === 'halfHeight') || (originy === 'height'))) {
							console.error('Invalid originy: ' + originy);
							console.trace();
						}
					}
				} else {
					originy = round(originy) || 0;
				}
			} else {
				if (animation_redefined) {
					update_originy = true;
					if (animation) {
						originy = animation.originy;
					} else {
						originy = 'height';
					}
				}
			}

			if (update_originy) {
				my_options.originy = originy;

				if (typeof originy === 'string') {
					originy = screen_obj[originy];
				}

				screen_obj.originy(originy + this.elevation);
			}

			// Call the resize method with all the options in order to update the position
			this.resize(new_options);

			return this;
		}
	});

	fg.ISOSprite = fg.Maker(fg.PISOSprite);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PISOSpriteGroup = Object.create(fg.PBaseISOSprite);
	fg.extend(fg.PISOSpriteGroup, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {},
				originx = new_options.originx,
				originy = new_options.originy,
				referencex = new_options.referencex,
				referencey = new_options.referencey,
				sprite_options = Object.create(new_options),
				parent_obj,
				screen_name = SCREEN_PREFIX + name + SCREEN_POSTFIX,
				screen_obj,
				round = fg.truncate
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			this.screen_name = screen_name;

			// If the origin is not specified it defaults to the top left of the image
			if (originx === undefined) {
				originx = 0;
				new_options.originx = originx;
			}

			if (originy === undefined) {
				originy = 0;
				new_options.originy = originy;
			}

			// The screen sprite group must be created in the screen layer
			parent_obj = fg.s[parent];
			if (parent_obj.screen_name) {
				parent_obj = fg.s[parent_obj.screen_name];
			}

			// Create the screen sprite group
			if (new_options.method === 'insert') {
				parent_obj.insertSortedGroup(screen_name, sprite_options);
			} else {
				parent_obj.addSortedGroup(screen_name, sprite_options);
			}

			screen_obj = fg.s[screen_name];

			this.layers = [];
			fg.PBaseISOSprite.init.apply(this, arguments);

			this.updateList = [];

			this.clearing = false;

			my_options.originx = originx;
			my_options.originy = originy;

			// If the reference is not specified it defaults to the top left of the image
			if (referencex === undefined) {
				my_options.referencex = 0;
			} else if (typeof referencex === 'string') {
				my_options.referencex = referencex;

				if (window.console) {
					if (!((referencex === 'halfWidth') || (referencex === 'width'))) {
						console.error('Invalid referencex: ' + referencex);
						console.trace();
					}
				}
			} else {
				my_options.referencex = round(new_options.referencex) || 0;
			}

			if (referencey === undefined) {
				my_options.referencey = 0;
			} else if (typeof referencey === 'string') {
				my_options.referencey = referencey;

				if (window.console) {
					if (!((referencey === 'halfHeight') || (referencey === 'height'))) {
						console.error('Invalid referencey: ' + referencey);
						console.trace();
					}
				}
			} else {
				my_options.referencey = round(new_options.referencey) || 0;
			}

			this.elevation = round(new_options.elevation) || 0;

			// Call resize in order to place the screen object correctly
			this.resize(new_options);
		},

		// Public functions

		remove: function () {
			var
				screen_name = this.screen_name
			;

			this.clear();

			if (fg.s[screen_name]) {
				fg.s[screen_name].remove();
			}

			fg.PBaseISOSprite.remove.apply(this, arguments);
		},

		clear: function () {
			var
				layers = this.layers,
				len_layers = layers.length,
				screen_name = this.screen_name,
				layer,
				i
			;

			this.clearing = true;

			for (i = 0; i < len_layers; i += 1) {
				layer = layers[i];

				// This if is necessary, as the userData.remove() function may
				// do anything, including removing another sprite from this group
				if (fg.s[layer.name]) {
					layer.obj.remove();
				}
			}

			this.clearing = false;

			this.layers.splice(0, len_layers);
			this.updateList.splice(0, this.updateList.length);

			this.checkUpdate();

			if (fg.s[screen_name]) {
				fg.s[screen_name].clear();
			}

			return this;
		},

		children: function (callback) {
			var
				layers = this.layers,
				len_layers = layers.length,
				layer,
				layer_obj,
				retval,
				i
			;

			if (callback) {
				for (i = 0; i < len_layers; i += 1) {
					layer = layers[i];
					if (layer) {
						layer_obj = layer.obj;
						retval = callback.call(layer_obj, layer_obj);
						if (retval) {
							break;
						}
					}
				}
			}

			return this;
		},

		resize: function (options) {
			// !! DANGER !! Resize as if it was a sprite group,
			// even if this object does not derive directly from
			// a sprite group
			fg.PSpriteGroup.resize.apply(this, arguments);

			// TO DO -- Is it of any use to resize also the screen object?
			//fg.s[this.screen_name].resize(options);

			return this;
		},

		addISOSprite: function (name, options) {
			var
				new_options = options || {},
				sprite
			;

			new_options.method = 'add';
			sprite = fg.ISOSprite(name, new_options, this.name);

			this.layers.push({name: name, obj: sprite});

			this.checkUpdate();

			return this;
		},

		insertISOSprite: function (name, options) {
			var
				new_options = options || {},
				sprite
			;

			new_options.method = 'insert';
			sprite = fg.ISOSprite(name, new_options, this.name);

			this.layers.unshift({name: name, obj: sprite});

			this.checkUpdate();

			return this;
		},

		end: function () {
			var
				parent = this.parent
			;

			if (!parent) {
				parent = this.name;
			}

			return fg.s[parent];
		},

		// Implementation details

		checkUpdate: function () {
			var
				oldNeedsUpdate = this.needsUpdate
			;

			if ((this.callbacks.length === 0) && (this.layers.length === 0)) {
				this.needsUpdate = false;
			} else {
				this.needsUpdate = true;
			}

			this.updateNeedsUpdate(oldNeedsUpdate);
		},

		update: function () {
			var
				update_list = this.updateList,
				len_update_list = update_list.length,
				i
			;

			fg.PBaseISOSprite.update.apply(this, arguments);

			for (i = 0; i < len_update_list; i += 1) {
				if (update_list[i]) {
					update_list[i].obj.update();
				}
			}
		}
	});

	fg.ISOSpriteGroup = fg.Maker(fg.PISOSpriteGroup);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PISOTilemap = Object.create(fg.PISOSpriteGroup);
	fg.extend(fg.PISOTilemap, {
		init: function (name, tileDescription, animationList, options, parent) {
			var
				my_options,
				new_options = options || {},
				sizex = tileDescription.sizex,
				sizey = tileDescription.sizey,
				tileSize = tileDescription.tileSize,
				data = tileDescription.data,
				len_data = data.length,
				animation_options,
				sprite_options,
				sprite_name,
				sprite_obj,
				row = 0,
				col = 0,
				left = 0,
				top = 0,
				i
			;

			// tileDescription
			// {
			// sizex: 8 # Num tiles
			// sizey: 8 # Num tiles
			// tileSize: 50 # Pixel
			// data: [1,0,0,0,0,0,0,3,] # (sizex * sizey) members, indices of animationList
			// }

			// animationList
			// {
			// 1: {animation: name} # The object literal passed to setAnimation (MUST have at least animation: name)
			// 3: {animation: name, createCallback: func} # The object literal passed to setAnimation (MUST have at least animation: name)
			// }

			// sprite_name
			// name + '_' + row + '_' + col

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			new_options.width = sizex * tileSize;
			new_options.height = sizey * tileSize;

			fg.PISOSpriteGroup.init.call(this, name, new_options, parent);

			for (i = 0; i < len_data; i += 1) {
				animation_options = animationList[data[i]];
				if (animation_options) {
					sprite_options = Object.create(animation_options);
					fg.extend(sprite_options, {
						left: left,
						top: top,
						width: tileSize,
						height: tileSize
					});

					sprite_name = name + '_' + row + '_' + col;

					this.addISOSprite(sprite_name, sprite_options);

					if (animation_options.createCallback) {
						sprite_obj = fg.s[sprite_name];
						animation_options.createCallback.call(sprite_obj, sprite_obj);
					}
				}

				left += tileSize;
				col += 1;
				if (col >= sizex) {
					col = 0;
					left = 0;
					row += 1;
					top += tileSize;
				}
			}
		}
	});

	fg.ISOTilemap = fg.Maker(fg.PISOTilemap);

	isoGroupMakers = {
		addISOGroup: function (name, options) {
			var
				new_options = options || {},
				group
			;

			new_options.method = 'add';
			group = fg.ISOSpriteGroup(name, new_options, this.name);

			this.layers.push({name: name, obj: group});

			this.checkUpdate();

			return group;
		},

		insertISOGroup: function (name, options) {
			var
				new_options = options || {},
				group
			;

			new_options.method = 'insert';
			group = fg.ISOSpriteGroup(name, new_options, this.name);

			this.layers.unshift({name: name, obj: group});

			this.checkUpdate();

			return group;
		},

		addISOTilemap: function (name, tileDescription, animationList, options) {
			var
				new_options = options || {},
				tilemap
			;

			new_options.method = 'add';
			tilemap = fg.ISOTilemap(name, tileDescription, animationList, new_options, this.name);

			this.layers.push({name: name, obj: tilemap});

			this.checkUpdate();

			return tilemap;
		},

		insertISOTilemap: function (name, tileDescription, animationList, options) {
			var
				new_options = options || {},
				tilemap
			;

			new_options.method = 'add';
			tilemap = fg.ISOTilemap(name, tileDescription, animationList, new_options, this.name);

			this.layers.unshift({name: name, obj: tilemap});

			this.checkUpdate();

			return tilemap;
		}
	};

	fg.extend(fg.PISOSpriteGroup, isoGroupMakers);
	fg.extend(fg.PSpriteGroup, isoGroupMakers);

	if (fg.fx) {
		fg.extend(fg.fx.hooks, {
			elevation: {
				get: function (s) {
					return s.elevation;
				},
				set: function (s, value) {
					s.move({elevation: value});
				}
			},
			reference: {
				get: function (s) {
					var
						reference = s.reference()
					;

					if (typeof reference === 'string') {
						reference = s[reference];
					}

					return reference;
				},
				set: function (s, value) {
					s.reference(value);
				}
			},
			referencex: {
				get: function (s) {
					var
						reference = s.referencex()
					;

					if (typeof reference === 'string') {
						reference = s[reference];
					}

					return reference;
				},
				set: function (s, value) {
					s.referencex(value);
				}
			},
			referencey: {
				get: function (s) {
					var
						reference = s.referencey()
					;

					if (typeof reference === 'string') {
						reference = s[reference];
					}

					return reference;
				},
				set: function (s, value) {
					s.referencey(value);
				}
			}
		});
	}
}(friGame));

