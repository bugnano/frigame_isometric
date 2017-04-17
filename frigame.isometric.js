/*global friGame */
/*jshint bitwise: true, curly: true, eqeqeq: true, esversion: 3, forin: true, freeze: true, funcscope: true, futurehostile: true, iterator: true, latedef: true, noarg: true, nocomma: true, nonbsp: true, nonew: true, notypeof: false, shadow: outer, singleGroups: false, strict: true, undef: true, unused: true, varstmt: false, eqnull: false, plusplus: true, browser: true, laxbreak: true, laxcomma: true */

// Copyright (c) 2011-2017 Franco Bugnano

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
		overrides = {},
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

	// Extend the Animation object in order to support originx and originy

	overrides.PAnimation = fg.pick(fg.PAnimation, [
		'init',
		'onLoad'
	]);

	fg.extend(fg.PAnimation, {
		init: function (imageURL, options) {
			var
				my_options,
				new_options = options || {}
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			overrides.PAnimation.init.apply(this, arguments);

			// Set default options
			fg.extend(my_options, {
				// Public options
				originx: null,
				originy: null

				// Implementation details
			});

			new_options = fg.extend(my_options, fg.pick(new_options, [
				'originx',
				'originy'
			]));
		},

		onLoad: function () {
			var
				options = this.options,
				round = fg.truncate
			;

			overrides.PAnimation.onLoad.apply(this, arguments);

			// If the origin is not specified it defaults to the bottom center of the frame
			if (options.originx === null) {
				options.originx = options.halfWidth;
			}

			if (options.originy === null) {
				options.originy = options.frameHeight;
			}

			this.originx = round(options.originx);
			this.originy = round(options.originy);
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	// Extend the Sprite object in order to support originx and originy

	overrides.PSprite = fg.pick(fg.PSprite, [
		'init',
		'setAnimation'
	]);

	fg.extend(fg.PSprite, {
		init: function (name, options, parent) {
			var
				new_options = options || {},
				round = fg.truncate
			;

			this.originx = round(new_options.originx || 0);
			this.originy = round(new_options.originy || 0);
			this.elevation = round(new_options.elevation || 0);

			overrides.PSprite.init.apply(this, arguments);
		},

		setAnimation: function (options) {
			var
				new_options = options || {},
				animation,
				animation_redefined = new_options.animation !== undefined,
				round = fg.truncate
			;

			if (animation_redefined) {
				animation = fg.resources[new_options.animation];
			} else {
				animation = this.options.animation;
			}

			// The origin must be updated only if explicitly set, or if the animation gets redefined
			if (new_options.originx !== undefined) {
				this.originx = round(new_options.originx);
			} else {
				if (animation_redefined) {
					if (animation) {
						this.originx = animation.originx;
					} else {
						this.originx = 0;
					}
				}
			}

			if (new_options.originy !== undefined) {
				this.originy = round(new_options.originy);
			} else {
				if (animation_redefined) {
					if (animation) {
						this.originy = animation.originy;
					} else {
						this.originy = 0;
					}
				}
			}

			overrides.PSprite.setAnimation.apply(this, arguments);
		},

		setOrigin: function (originx, originy) {
			var
				round = fg.truncate,
				new_originx = round(originx)
			;

			this.originx = new_originx;

			if (originy === undefined) {
				// If originy isn't specified, it is assumed to be equal to originx.
				this.originy = new_originx;
			} else {
				this.originy = round(originy);
			}

			return this;
		},

		setOriginx: function (originx) {
			this.originx = fg.truncate(originx);

			return this;
		},

		setOriginy: function (originy) {
			this.originy = fg.truncate(originy);

			return this;
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	// Functions for depth sorting of the sprites in the isometric views
	function sortLayers() {
		var
			i,
			j,
			obj1,
			obj2,
			y,
			layers = this.layers,
			len_layers = layers.length,
			len_layers_3 = len_layers / 3,
			gap,
			temp1,
			temp2
		;

		// Save the drawing order of the layers in order to make a stable sort,
		// and the computed y value, in order to speed up sorting
		for (i = 0; i < len_layers; i += 1) {
			obj1 = layers[i].obj;
			y = obj1.top + obj1.originy + obj1.elevation;
			layers[i].obj.sort_y = y;
			layers[i].obj.sort_i = i;
		}

		// Generate Knuth's gap sequence
		gap = 1;
		while (gap < len_layers_3) {
			gap = (3 * gap) + 1;
		}

		// Start with the largest gap and work down to a gap of 1
		while (gap >= 1) {
			// Do a gapped insertion sort for this gap size.
			// The first gap elements a[0..gap-1] are already in gapped order
			// keep adding one more element until the entire array is gap sorted
			for (i = gap; i < len_layers; i += 1)
			{
				// add a[i] to the elements that have been gap sorted
				// save a[i] in temp1 and make a hole at position i
				temp1 = layers[i];
				obj1 = temp1.obj;

				// shift earlier gap-sorted elements up until the correct location for a[i] is found
				j = i;
				while (j >= gap) {
					temp2 = layers[j - gap];
					obj2 = temp2.obj;

					if (!((obj2.sort_y > obj1.sort_y) || ((obj2.sort_y === obj1.sort_y) && (obj2.sort_i > obj1.sort_i)))) {
						break;
					}

					layers[j] = temp2;
					j -= gap;
				}

				// put temp1 (the original a[i]) in its correct location
				layers[j] = temp1;
			}

			gap = (gap - 1) / 3;
		}

		return this;
	}

	// Extend the Sprite Group object in order to know whether a new group is added or inserted

	overrides.PSpriteGroup = fg.pick(fg.PSpriteGroup, [
		'init',
		'draw'
	]);

	fg.extend(fg.PSpriteGroup, {
		init: function (name, options, parent) {
			var
				new_options = options || {},
				round = fg.truncate
			;

			// If the origin is not specified it defaults to the top left of the image
			this.originx = round(new_options.originx || 0);
			this.originy = round(new_options.originy || 0);
			this.elevation = round(new_options.elevation || 0);

			this.needsSorting = false;

			// Call the overridden function last, in order to have the callbacks called once the object has been fully initialized
			overrides.PSpriteGroup.init.apply(this, arguments);
		},

		// Public functions

		setOrigin: function (originx, originy) {
			var
				round = fg.truncate,
				new_originx = round(originx)
			;

			this.originx = new_originx;

			if (originy === undefined) {
				// If originy isn't specified, it is assumed to be equal to originx.
				this.originy = new_originx;
			} else {
				this.originy = round(originy);
			}

			return this;
		},

		setOriginx: function (originx) {
			this.originx = fg.truncate(originx);

			return this;
		},

		setOriginy: function (originy) {
			this.originy = fg.truncate(originy);

			return this;
		},

		sortLayers: function () {
			// sortLayers is a dummy function for regular sprite groups
			return this;
		},

		// Implementation details

		draw: function (interp) {
			if (this.needsSorting) {
				this.needsSorting = false;
				this.sortLayers();
			}

			overrides.PSpriteGroup.draw.apply(this, arguments);
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PBaseISOSprite = Object.create(fg.PBaseSprite);
	fg.extend(fg.PBaseISOSprite, {
		// Public functions

		move: function (options) {
			var
				new_options = options || {},
				elevation,
				screen,
				screen_x,
				screen_y,
				screen_obj = fg.s[this.screen_name],
				round = fg.truncate
			;

			fg.PBaseSprite.move.call(this, options);

			if (new_options.elevation !== undefined) {
				elevation = round(new_options.elevation);
				this.elevation = elevation;
				screen_obj.elevation = elevation;
			} else {
				elevation = this.elevation;
			}

			// Step 1: Calculate the screen object position
			screen = fg.screenFromGrid(this.left + this.referencex, this.top + this.referencey);
			screen_x = round(screen[0]);
			screen_y = round(screen[1]);

			// Step 2: Move the screen object
			screen_obj.move({
				left: screen_x - screen_obj.originx,
				top: screen_y - screen_obj.originy - elevation
			});

			// Step 3: Sort the screen object parent layer
			fg.s[screen_obj.parent].needsSorting = true;

			return this;
		},

		setElevation: function (elevation) {
			var
				old_elevation = this.elevation,
				screen_obj = fg.s[this.screen_name]
			;

			elevation = fg.truncate(elevation);

			this.elevation = elevation;
			screen_obj.elevation = elevation;

			screen_obj.move({
				top: screen_obj.top - (elevation - old_elevation)
			});

			return this;
		},

		drawFirst: function () {
			fg.PBaseSprite.drawFirst.call(this);

			fg.s[this.screen_name].drawFirst();

			return this;
		},

		drawLast: function () {
			fg.PBaseSprite.drawLast.call(this);

			fg.s[this.screen_name].drawLast();

			return this;
		},

		drawTo: function (index) {
			fg.PBaseSprite.drawTo.call(this, index);

			fg.s[this.screen_name].drawTo(index);

			return this;
		},

		drawBefore: function (name) {
			var
				screen_obj = fg.s[name] || {}
			;

			fg.PBaseSprite.drawBefore.call(this, name);

			fg.s[this.screen_name].drawBefore(screen_obj.screen_name);

			return this;
		},

		drawAfter: function (name) {
			var
				screen_obj = fg.s[name] || {}
			;

			fg.PBaseSprite.drawAfter.call(this, name);

			fg.s[this.screen_name].drawAfter(screen_obj.screen_name);

			return this;
		},

		setOrigin: function (originx, originy) {
			var
				screen_obj = fg.s[this.screen_name]
			;

			screen_obj.setOrigin(originx, originy);

			this.originx = screen_obj.originx;
			this.originy = screen_obj.originy;

			this.move();

			return this;
		},

		setOriginx: function (originx) {
			var
				screen_obj = fg.s[this.screen_name]
			;

			screen_obj.setOriginx(originx);

			this.originx = screen_obj.originx;

			this.move();

			return this;
		},

		setOriginy: function (originy) {
			var
				screen_obj = fg.s[this.screen_name]
			;

			screen_obj.setOriginy(originy);

			this.originy = screen_obj.originy;

			this.move();

			return this;
		},

		setReference: function (referencex, referencey) {
			var
				round = fg.truncate,
				new_referencex = round(referencex)
			;

			this.referencex = new_referencex;

			if (referencey === undefined) {
				// If referencey isn't specified, it is assumed to be equal to referencex.
				this.referencey = new_referencex;
			} else {
				this.referencey = round(referencey);
			}

			this.move();

			return this;
		},

		setReferencex: function (referencex) {
			this.referencex = fg.truncate(referencex);

			this.move();

			return this;
		},

		setReferencey: function (referencey) {
			this.referencey = fg.truncate(referencey);

			this.move();

			return this;
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

			// Set default options
			fg.extend(my_options, {
				// Public options

				// Implementation details
			});

			this.screen_name = screen_name;

			if (parent) {
				parent_obj = fg.s[parent];
			} else {
				parent_obj = fg.s.playground;
			}

			// The screen sprite must be created in the screen layer
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

			this.originx = screen_obj.originx;
			this.originy = screen_obj.originy;

			// If the reference is not specified it defaults to the center of the image
			if (new_options.referencex === undefined) {
				new_options.referencex = this.halfWidth;
			}

			if (new_options.referencey === undefined) {
				new_options.referencey = this.halfHeight;
			}

			this.referencex = round(new_options.referencex);
			this.referencey = round(new_options.referencey);

			this.elevation = round(new_options.elevation || 0);

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
			fg.PBaseISOSprite.resize.call(this, options);

			// The screen object cannot be resized

			return this;
		},

		setAnimation: function (options) {
			var
				new_options = options || {},
				sprite_options = Object.create(new_options),
				screen_obj = fg.s[this.screen_name],
				that = this,
				old_callback
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
			this.originx = screen_obj.originx;
			this.originy = screen_obj.originy;

			// Call the resize method with all the options in order to update the position
			this.resize(new_options);

			return this;
		},

		getScreenRect: function () {
			var
				screen_obj = fg.s[this.screen_name],
				screen_rect = fg.Rect(screen_obj)
			;

			screen_rect.originx = screen_obj.originx;
			screen_rect.originy = screen_obj.originy;

			return screen_rect;
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

			// Set default options
			fg.extend(my_options, {
				// Public options

				// Implementation details
			});

			this.screen_name = screen_name;

			if (parent) {
				parent_obj = fg.s[parent];
			} else {
				parent_obj = fg.s.playground;
			}

			// The screen sprite group must be created in the screen layer
			if (parent_obj.screen_name) {
				parent_obj = fg.s[parent_obj.screen_name];
			}

			// Create the screen sprite group
			if (new_options.method === 'insert') {
				parent_obj.insertGroup(screen_name, sprite_options);
			} else {
				parent_obj.addGroup(screen_name, sprite_options);
			}

			screen_obj = fg.s[screen_name];

			// The screen sprite group must depth sort its layers
			screen_obj.sortLayers = sortLayers;

			fg.PBaseISOSprite.init.apply(this, arguments);

			this.layers = [];

			this.needsUpdate = true;
			this.updateList = [];

			this.clearing = false;

			this.originx = screen_obj.originx;
			this.originy = screen_obj.originy;

			// If the reference is not specified it defaults to the top left of the image
			this.referencex = round(new_options.referencex || 0);
			this.referencey = round(new_options.referencey || 0);

			this.elevation = round(new_options.elevation || 0);

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
				i
			;

			this.clearing = true;

			for (i = 0; i < len_layers; i += 1) {
				layers[i].obj.remove();
			}

			this.clearing = false;

			this.layers = [];
			this.updateList = [];

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
			fg.PSpriteGroup.resize.call(this, options);

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

		checkUpdate: fg.noop,

		update: function () {
			var
				update_list = this.updateList,
				len_update_list = update_list.length,
				i
			;

			fg.PBaseISOSprite.update.call(this);

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
			this.updateList.push({name: name, obj: group});

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
			this.updateList.unshift({name: name, obj: group});

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
			this.updateList.push({name: name, obj: tilemap});

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
			this.updateList.unshift({name: name, obj: tilemap});

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
					s.setElevation(value);
				}
			},
			originx: {
				get: function (s) {
					return s.originx;
				},
				set: function (s, value) {
					s.setOriginx(value);
				}
			},
			originy: {
				get: function (s) {
					return s.originy;
				},
				set: function (s, value) {
					s.setOriginy(value);
				}
			},
			referencex: {
				get: function (s) {
					return s.referencex;
				},
				set: function (s, value) {
					s.setReferencex(value);
				}
			},
			referencey: {
				get: function (s) {
					return s.referencey;
				},
				set: function (s, value) {
					s.setReferencey(value);
				}
			}
		});
	}
}(friGame));

