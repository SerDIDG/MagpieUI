Com['SliderMovable'] = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),		// Slider container
			'time' : 500,					// Fade time
			'delay' : 4000,
			'fadePrevious' : false,			// Fade out previous slide, needed when using transparency slides
			'speed' : 20					// Pixels in second
		}, o),
		nodes = {},
		slides = [],
		count = 0,
		current;
		
	var init = function(){
		// Render slider
		render();
		// Set first slide
		set(0);
	};
	
	var render = function(){
		var lines;
		// Render slides, buttons, nav
		lines = cm.getByClass('slides', config['node'])[0].getElementsByTagName('li');
		count = lines.length;
		for(var i = 0; i < count; i++){
			renderSlide(i, lines[i]);
		}
	};
	
	var renderSlide = function(i, item){
		var slide = slides[i] = {};
		// Add slide node to array
		slide['node'] = item;
		slide['node'].style.display = 'none';
		slide['node'].style.zIndex = '1';
		cm.setOpacity(slide['node'], 0);
		slide['animFade'] = new cm.Animation(slide['node']);
		slide['animMove'] = new cm.Animation(slide['node']);
	};
	
	var previous = function(){
		var i = (current == 0)? (count - 1) : (current - 1);
		set(i);
	};
	
	var next = function(){
		var i = ((current + 1) == count)? 0 : (current + 1);
		set(i);
	};
	
	var set = function(item){
		// Hide previous slide
		if(slides[current]){
			(function(){
				var slide = slides[current];
				slide['node'].style.zIndex = 1;
				setTimeout(function(){
					slide['node'].style.display = 'none';
					cm.setOpacity(slide['node'], 0);
				}, config['time']);
			})();
		}
		// Fade In
		with(slides[item]['node'].style){
			zIndex = 2;
			left = 0;
			display = 'block';
		}
		slides[item]['animFade'].go({'style' : {'opacity' : 1}, 'duration' : config['time']});
		// Moove
		var left = slides[item]['node'].offsetWidth - config['node'].offsetWidth,
			duration = (left / config['speed']) * 1000;
		slides[item]['animMove'].go({'style':{'left': ['-', left, 'px'].join('')}, 'duration' : duration, 'onStop' : next});
		// Set current active slide
		current = item;
	};
	
	init();
};