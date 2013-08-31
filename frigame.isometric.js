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

// Function.prototype.bind by Mozilla
if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== 'function') {
			// closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		}

		var
			aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
			}
		;

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}

(function ($, fg) {
	var
		baseAnimation = fg.PAnimation,
		baseSprite = fg.PSprite,
		baseSpriteGroup = fg.PSpriteGroup,
		SCREEN_PREFIX = 'friGame_iso_',
		SCREEN_POSTFIX = '_screen'
	;

	function screenFromGrid(x, y) {
		var
			screen_x = x - y,
			screen_y = (x + y) / 2
		;

		return [screen_x, screen_y];
	}

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

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	function compareOrigins(a, b) {
		var
			a_obj = a.obj,
			b_obj = b.obj,
			ya = a_obj.top + a_obj.originy + a_obj.elevation,
			yb = b_obj.top + b_obj.originy + b_obj.elevation
		;

		return (ya - yb);
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

		addISOGroup: function (name, options) {
			var
				new_options = options || {},
				group
			;

			new_options.method = 'add';
			group = fg.ISOSpriteGroup(name, options, this.name);

			this.layers.push({name: name, obj: group});

			return group;
		},

		insertISOGroup: function (name, options) {
			var
				new_options = options || {},
				group
			;

			new_options.method = 'insert';
			group = fg.ISOSpriteGroup(name, options, this.name);

			this.layers.unshift({name: name, obj: group});

			return group;
		},

		sortLayers: function () {
			this.layers.sort(compareOrigins);

			return this;
		}
	});

	fg.SpriteGroup = fg.Maker(fg.PSpriteGroup);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PISOSprite = Object.create(fg.PBaseSprite);
	$.extend(fg.PISOSprite, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {},
				sprite_options = Object.create(new_options),
				parent_obj,
				screen_name = [SCREEN_PREFIX, name, SCREEN_POSTFIX].join(''),
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

			if (parent) {
				parent_obj = fg.sprites[parent];
			} else {
				parent_obj = fg.sprites.playground;
			}

			// The screen sprite must be created in the screen layer
			if (parent_obj.screen_name) {
				parent_obj = fg.sprites[parent_obj.screen_name];
			}

			// Create the screen sprite
			if (new_options.method === 'add') {
				parent_obj.addSprite(screen_name, sprite_options);
			} else {
				parent_obj.insertSprite(screen_name, sprite_options);
			}

			this.screen_name = screen_name;

			fg.PBaseSprite.init.apply(this, arguments);

			// If the animation has not been defined, force
			// the animation to null in order to resize and move
			// the sprite inside setAnimation
			if (new_options.animation === undefined) {
				new_options.animation = null;
			}

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
			fg.sprites[this.screen_name].remove();

			fg.PBaseSprite.remove.apply(this, arguments);
		},

		resize: function (options) {
			fg.PBaseSprite.resize.call(this, options);

			// TO DO -- What should I do with the screen object?

			return this;
		},

		move: function (options) {
			var
				new_options = options || {},
				elevation,
				screen,
				screen_x,
				screen_y,
				screen_obj = fg.sprites[this.screen_name]
			;

			fg.PBaseSprite.move.call(this, options);

			if (new_options.elevation !== undefined) {
				elevation = new_options.elevation;
				this.elevation = elevation;
				screen_obj.elevation = elevation;
			} else {
				elevation = this.elevation;
			}

			// Step 1: Calculate the screen object position
			screen = screenFromGrid(this.left + this.referencex, this.top + this.referencey);
			screen_x = screen[0];
			screen_y = screen[1];

			// Step 2: Move the screen object
			screen_obj.move({
				left: screen_x - screen_obj.originx,
				top: screen_y - screen_obj.originy - elevation
			});

			// Step 3: Sort the screen object parent layer
			if (screen_obj.parent) {
				fg.sprites[screen_obj.parent].sortLayers();
			}

			return this;
		},

		setAnimation: function (options) {
			var
				new_options = options || {},
				sprite_options = Object.create(new_options)
			;

			// The animation callback associated with the screen sprite is bound to the isometric object
			// Note however that the node parameter still refers to the screen object
			if (new_options.callback !== undefined) {
				new_options.callback = new_options.callback.bind(this);
			}

			fg.sprites[this.screen_name].setAnimation(sprite_options);

			// Call the resize method with all the options in order to update the position
			this.resize(new_options);

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

			return this;
		},

		setReferencex: function (referencex) {
			this.referencex = fg.truncate(referencex);

			return this;
		},

		setReferencey: function (referencey) {
			this.referencey = fg.truncate(referencey);

			return this;
		},

		// Proxy functions

		hide: function () {
			fg.sprites[this.screen_name].hide();

			return this;
		},

		show: function () {
			fg.sprites[this.screen_name].show();

			return this;
		},

		toggle: function (showOrHide) {
			fg.sprites[this.screen_name].toggle(showOrHide);

			return this;
		},

		opacity: function (alpha) {
			if (alpha === undefined) {
				return fg.sprites[this.screen_name].opacity();
			}

			fg.sprites[this.screen_name].opacity(alpha);

			return this;
		},

		// Implementation details

		draw: function () {
			// The drawing is performed only on the screen objects
		}
	});

	fg.ISOSprite = fg.Maker(fg.PISOSprite);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PISOSpriteGroup = Object.create(fg.PBaseSprite);
	$.extend(fg.PISOSpriteGroup, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {},
				sprite_options = Object.create(new_options),
				parent_obj,
				screen_name = [SCREEN_PREFIX, name, SCREEN_POSTFIX].join(''),
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

			if (parent) {
				parent_obj = fg.sprites[parent];
			} else {
				parent_obj = fg.sprites.playground;
			}

			// The screen sprite group must be created in the screen layer
			if (parent_obj.screen_name) {
				parent_obj = fg.sprites[parent_obj.screen_name];
			}

			// Create the screen sprite group
			if (new_options.method === 'add') {
				parent_obj.addGroup(screen_name, sprite_options);
			} else {
				parent_obj.insertGroup(screen_name, sprite_options);
			}

			this.screen_name = screen_name;
			this.layers = [];

			fg.PBaseSprite.init.apply(this, arguments);

			// If the reference is not specified it defaults to the top left of the image
			this.referencex = round(new_options.referencex || 0);
			this.referencey = round(new_options.referencey || 0);

			this.elevation = round(new_options.elevation || 0);

			// Call resize in order to place the screen object correctly
			this.resize(new_options);
		},

		// Public functions

		remove: function () {
			fg.sprites[this.screen_name].remove();

			this.clear();

			fg.PBaseSprite.remove.apply(this, arguments);
		},

		resize: function (options) {
			// !! DANGER !! Resize as if it was a sprite group,
			// even if this object does not derive directly from
			// a sprite group
			fg.PSpriteGroup.resize.call(this, options);

			// TO DO -- Is it of any use to resize also the screen object?
			//fg.sprites[this.screen_name].resize(options);

			return this;
		},

		move: function (options) {
			var
				new_options = options || {},
				elevation,
				screen,
				screen_x,
				screen_y,
				screen_obj = fg.sprites[this.screen_name]
			;

			fg.PBaseSprite.move.call(this, options);

			if (new_options.elevation !== undefined) {
				elevation = new_options.elevation;
				this.elevation = elevation;
				screen_obj.elevation = elevation;
			} else {
				elevation = this.elevation;
			}

			// Step 1: Calculate the screen object position
			screen = screenFromGrid(this.left + this.referencex, this.top + this.referencey);
			screen_x = screen[0];
			screen_y = screen[1];

			// Step 2: Move the screen object
			screen_obj.move({
				left: screen_x - screen_obj.originx,
				top: screen_y - screen_obj.originy - elevation
			});

			// Step 3: Sort the screen object parent layer
			if (screen_obj.parent) {
				fg.sprites[screen_obj.parent].sortLayers();
			}

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

			return this;
		},

		setReferencex: function (referencex) {
			this.referencex = fg.truncate(referencex);

			return this;
		},

		setReferencey: function (referencey) {
			this.referencey = fg.truncate(referencey);

			return this;
		},

		clear: function () {
			var
				layers = this.layers
			;

			fg.sprites[this.screen_name].clear();

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

		addISOSprite: function (name, options) {
			var
				new_options = options || {},
				sprite
			;

			new_options.method = 'add';
			sprite = fg.ISOSprite(name, options, this.name);

			this.layers.push({name: name, obj: sprite});

			return this;
		},

		insertISOSprite: function (name, options) {
			var
				new_options = options || {},
				sprite
			;

			new_options.method = 'insert';
			sprite = fg.ISOSprite(name, options, this.name);

			this.layers.unshift({name: name, obj: sprite});

			return this;
		},

		addISOGroup: function (name, options) {
			var
				new_options = options || {},
				group
			;

			new_options.method = 'add';
			group = fg.ISOSpriteGroup(name, options, this.name);

			this.layers.push({name: name, obj: group});

			return group;
		},

		insertISOGroup: function (name, options) {
			var
				new_options = options || {},
				group
			;

			new_options.method = 'insert';
			group = fg.ISOSpriteGroup(name, options, this.name);

			this.layers.unshift({name: name, obj: group});

			return group;
		},

		end: function () {
			var
				parent = this.parent
			;

			if (!parent) {
				parent = this.name;
			}

			return fg.sprites[parent];
		},

		// Implementation details

		update: function () {
			var
				layers = this.layers,
				len_layers = layers.length,
				i
			;

			fg.PBaseSprite.update.call(this);

			for (i = 0; i < len_layers; i += 1) {
				if (layers[i]) {
					layers[i].obj.update();
				}
			}
		},

		draw: function () {
			// The drawing is performed only on the screen objects
		}
	});

	fg.ISOSpriteGroup = fg.Maker(fg.PISOSpriteGroup);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //


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

	$.extend(fg.PISOSpriteGroup, {
		addISOTilemap: function (name, tileDescription, animationList, options) {
			var
				tilemap = fg.ISOTilemap(name, tileDescription, animationList, options, this.name)
			;

			this.layers.push({name: name, obj: tilemap});

			return this;
		},

		insertISOTilemap: function (name, tileDescription, animationList, options) {
			var
				tilemap = fg.ISOTilemap(name, tileDescription, animationList, options, this.name)
			;

			this.layers.unshift({name: name, obj: tilemap});

			return this;
		}
	});
}(jQuery, friGame));

