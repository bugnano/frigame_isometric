/*global jQuery, friGame */
/*jslint sloppy: true, white: true, browser: true */

// Copyright (c) 2011-2013 Franco Bugnano

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

(function ($, fg) {
	var
		baseAnimation = fg.PAnimation,
		baseBaseSprite = fg.PBaseSprite,
		baseSprite = fg.PSprite,
		baseSpriteGroup = fg.PSpriteGroup,
		myBaseISOSprite,
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
	$.extend(fg, {
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
	fg.PAnimation = Object.create(baseAnimation);
	$.extend(fg.PAnimation, {
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

			baseAnimation.init.apply(this, arguments);

			// Set default options
			$.extend(my_options, {
				// Public options
				originx: null,
				originy: null

				// Implementation details
			});

			new_options = $.extend(my_options, fg.pick(new_options, [
				'originx',
				'originy'
			]));
		},

		onLoad: function () {
			var
				options = this.options,
				round = fg.truncate
			;

			baseAnimation.onLoad.apply(this, arguments);

			// If the origin is not specified it defaults to the center of the image
			if (options.originx === null) {
				options.originx = options.halfWidth;
			}

			if (options.originy === null) {
				options.originy = options.halfHeight;
			}

			this.originx = round(options.originx);
			this.originy = round(options.originy);
		}
	});

	fg.Animation = fg.Maker(fg.PAnimation);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	// Extend the Sprite object in order to support originx and originy
	fg.PSprite = Object.create(baseSprite);
	$.extend(fg.PSprite, {
		init: function (name, options, parent) {
			var
				new_options = options || {},
				round = fg.truncate
			;

			this.originx = round(new_options.originx || 0);
			this.originy = round(new_options.originy || 0);
			this.elevation = round(new_options.elevation || 0);

			baseSprite.init.apply(this, arguments);
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

			baseSprite.setAnimation.apply(this, arguments);
		}
	});

	fg.Sprite = fg.Maker(fg.PSprite);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	// Functions for depth sorting of the sprites in the isometric views
	function compareOrigins(a, b) {
		var
			a_obj = a.obj,
			b_obj = b.obj,
			ya = a_obj.top + a_obj.originy + a_obj.elevation,
			yb = b_obj.top + b_obj.originy + b_obj.elevation
		;

		return (ya - yb);
	}

	function sortLayers() {
		this.layers.sort(compareOrigins);

		return this;
	}

	// Extend the Sprite Group object in order to know whether a new group is added or inserted
	fg.PSpriteGroup = Object.create(baseSpriteGroup);
	$.extend(fg.PSpriteGroup, {
		init: function (name, options, parent) {
			var
				new_options = options || {},
				round = fg.truncate
			;

			baseSpriteGroup.init.apply(this, arguments);

			// If the origin is not specified it defaults to the top left of the image
			this.originx = round(new_options.originx || 0);
			this.originy = round(new_options.originy || 0);
			this.elevation = round(new_options.elevation || 0);
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
		},

		sortLayers: function () {
			// sortLayers is a dummy function for regular sprite groups
			return this;
		}
	});

	fg.SpriteGroup = fg.Maker(fg.PSpriteGroup);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	myBaseISOSprite = Object.create(baseBaseSprite);
	fg.PBaseISOSprite = myBaseISOSprite;
	$.extend(fg.PBaseISOSprite, {
		// Public functions

		move: function (options) {
			var
				new_options = options || {},
				elevation,
				screen,
				screen_x,
				screen_y,
				screen_name = this.screen_name,
				screen_obj = fg.s[screen_name],
				round = fg.truncate
			;

			baseBaseSprite.move.call(this, options);

			if (new_options.elevation !== undefined) {
				elevation = new_options.elevation;
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
			fg.s[screen_obj.parent].sortLayers(screen_name);

			return this;
		},

		moveFirst: function () {
			baseBaseSprite.moveFirst.call(this);

			fg.s[this.screen_name].moveFirst();

			return this;
		},

		moveLast: function () {
			baseBaseSprite.moveLast.call(this);

			fg.s[this.screen_name].moveLast();

			return this;
		},

		moveTo: function (index) {
			baseBaseSprite.moveTo.call(this, index);

			fg.s[this.screen_name].moveTo(index);

			return this;
		},

		moveBefore: function (name) {
			var
				screen_obj = fg.s[name] || {}
			;

			baseBaseSprite.moveBefore.call(this, name);

			fg.s[this.screen_name].moveBefore(screen_obj.screen_name);

			return this;
		},

		moveAfter: function (name) {
			var
				screen_obj = fg.s[name] || {}
			;

			baseBaseSprite.moveAfter.call(this, name);

			fg.s[this.screen_name].moveAfter(screen_obj.screen_name);

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

		draw: function () {
			// The drawing is performed only on the screen objects
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PISOSprite = Object.create(myBaseISOSprite);
	$.extend(fg.PISOSprite, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {},
				sprite_options = Object.create(new_options),
				parent_obj,
				screen_name = [SCREEN_PREFIX, name, SCREEN_POSTFIX].join(''),
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
			$.extend(my_options, {
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

			myBaseISOSprite.init.apply(this, arguments);

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

			this.elevation = fg.truncate(new_options.elevation || 0);

			// Call setAnimation in order to place the screen object correctly
			this.setAnimation(new_options);
		},

		// Public functions

		remove: function () {
			fg.s[this.screen_name].remove();

			myBaseISOSprite.remove.apply(this, arguments);
		},

		resize: function (options) {
			myBaseISOSprite.resize.call(this, options);

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
			if (new_options.callback !== undefined) {
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
		}
	});

	fg.ISOSprite = fg.Maker(fg.PISOSprite);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PISOSpriteGroup = Object.create(myBaseISOSprite);
	$.extend(fg.PISOSpriteGroup, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {},
				sprite_options = Object.create(new_options),
				parent_obj,
				screen_name = [SCREEN_PREFIX, name, SCREEN_POSTFIX].join(''),
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
			$.extend(my_options, {
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

			myBaseISOSprite.init.apply(this, arguments);

			this.layers = [];

			this.originx = screen_obj.originx;
			this.originy = screen_obj.originy;

			// If the reference is not specified it defaults to the top left of the image
			this.referencex = round(new_options.referencex || 0);
			this.referencey = round(new_options.referencey || 0);

			this.elevation = fg.truncate(new_options.elevation || 0);

			// Call resize in order to place the screen object correctly
			this.resize(new_options);
		},

		// Public functions

		remove: function () {
			fg.s[this.screen_name].remove();

			this.clear();

			myBaseISOSprite.remove.apply(this, arguments);
		},

		clear: function () {
			var
				layers = this.layers
			;

			fg.s[this.screen_name].clear();

			while (layers.length) {
				layers[0].obj.remove();
			}

			return this;
		},

		children: function (callback) {
			var
				layers = this.layers,
				len_layers = layers.length,
				layer,
				retval,
				i
			;

			if (callback) {
				for (i = 0; i < len_layers; i += 1) {
					layer = layers[i];
					if (layer) {
						retval = callback.call(layer.obj, layer.name);
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

		update: function () {
			var
				layers = this.layers,
				len_layers = layers.length,
				i
			;

			myBaseISOSprite.update.call(this);

			for (i = 0; i < len_layers; i += 1) {
				if (layers[i]) {
					layers[i].obj.update();
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
	$.extend(fg.PISOTilemap, {
		init: function (name, tileDescription, animationList, options, parent) {
			var
				my_options,
				new_options = options || {},
				round = fg.truncate,
				sizex = tileDescription.sizex,
				sizey = tileDescription.sizey,
				tileSize = tileDescription.tileSize,
				data = tileDescription.data,
				len_data = data.length,
				halfSize = round(tileSize / 2),
				animation_options,
				sprite_options,
				sprite_name,
				referencex,
				referencey,
				row = 0,
				col = 0,
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
			// 3: {animation: name} # The object literal passed to setAnimation (MUST have at least animation: name)
			// }

			// sprite_name
			// name + '_' + col + '_' + row

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
					if (animation_options.referencex !== undefined) {
						referencex = round(animation_options.referencex);
					} else {
						referencex = halfSize;
					}

					if (animation_options.referencey !== undefined) {
						referencey = round(animation_options.referencey);
					} else {
						referencey = halfSize;
					}

					sprite_options = Object.create(animation_options);
					$.extend(sprite_options, {
						left: (col * tileSize) + (halfSize - referencex),
						top: (row * tileSize) + (halfSize - referencey),
						width: tileSize,
						height: tileSize
					});

					sprite_name = [name, col, row].join('_');

					this.addISOSprite(sprite_name, sprite_options);
				}

				col += 1;
				if (col >= sizex) {
					col = 0;
					row += 1;
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

			return tilemap;
		}
	};

	$.extend(fg.PISOSpriteGroup, isoGroupMakers);
	$.extend(fg.PSpriteGroup, isoGroupMakers);
}(jQuery, friGame));

