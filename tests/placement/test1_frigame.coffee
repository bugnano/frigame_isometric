$ = jQuery
fg = friGame

$(() ->
	fg.resourceManager
		.addAnimation('beach', 'beach.png', {originx: 50, originy: 25})
		.addAnimation('grass', 'grass.png')
		.addAnimation('water', 'water.png', {originx: 50, originy: 25})


	animationList = {
		1: {animation: 'beach'}
		2: {animation: 'grass', originx: 50, originy: 25}
		3: {animation: 'water'}
	}

	tileDescription = {
		sizex: 8
		sizey: 8
		tileSize: 50
		data: [
			3,1,1,1,1,1,1,2,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1,
			1,1,1,1,1,1,1,1,
			2,1,1,1,1,1,1,3,
		]
	}

	fg.startGame(() ->
		fg.playground()
			.addGroup('my-group', {left: 400, referencex: 0, referencey: 0, originx: 0, originy: 0})
				.addISOGroup('iso-group', {referencex: 0, referencey: 0, originx: 0, originy: 0})
					.addISOTilemap('tilemap', tileDescription, animationList)
					.end()
				.end()
			.end()
	)
)

