$ = jQuery
fg = friGame

$(() ->
	fg.resourceManager
		.addAnimation('floor', 'tile.png', {originx: 64, originy: 32})
		.addAnimation('ice-floor', 'ice.png', {originx: 64, originy: 54})
		.addAnimation('block', 'tile.png', {originx: 64, originy: 96})
		.addAnimation('ice', 'ice.png', {originx: 64, originy: 118})
		.addAnimation('knight', 'knight_se.png', {
			originx: 64
			originy: 128
			numberOfFrame: 8
		})


	animationList = {
		1: {animation: 'floor'}
		2: {animation: 'ice-floor'}
		3: {animation: 'block'}
		4: {animation: 'ice', createCallback: () ->
			@.opacity(0.8)
		}
	}

	floorTiles = {
		sizex: 8
		sizey: 8
		tileSize: 64
		data: [
			1,1,1,1,1,1,1,1,
			1,1,1,1,2,2,2,1,
			1,1,1,1,2,1,2,1,
			1,1,1,1,1,1,2,1,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1
		]
	}

	objectTiles = {
		sizex: 8
		sizey: 8
		tileSize: 64
		data: [
			4,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,
			0,0,0,0,0,3,0,0,
			0,0,0,0,0,3,0,0,
			0,0,0,0,0,0,0,0,
			0,0,0,0,0,4,0,0,
			0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0
		]
	}

	fg.startGame(() ->
		fg.playground()
			.addGroup('my-group', {left: 512, top: 64})
				.addISOTilemap('floor-tilemap', floorTiles, animationList)
				.end()
				.addISOTilemap('object-tilemap', objectTiles, animationList)
					.addISOSprite('knight', {
						centerx: 256
						centery: 256
						radius: 32
						animation: 'knight'
						rate: 100
					})
				.end()
			.end()

		$('#playground').mousedown((e) ->
			playground_offset = $('#playground').offset()
			clicked_x = e.pageX - playground_offset.left
			clicked_y = e.pageY - playground_offset.top
			iso_offsetx = fg.s['my-group'].left
			iso_offsety = fg.s['my-group'].top

			[iso_x, iso_y] = fg.gridFromScreen(clicked_x - iso_offsetx, clicked_y - iso_offsety)
			fg.s.knight.move({centerx: iso_x, centery: iso_y})
		)
	)
)

