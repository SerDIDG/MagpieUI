Com['SlideY'] = function(o){
	var config = cm.merge({
			'scroll' : cm.Node('div'),
			'up' : cm.Node('div'),
			'down' : cm.Node('div'),
			'step' : 18,
			'time' : 50
		}, o),
		anim,
		animInterval,
		top;
		
	var init = function(){
		if(config['scroll'] && config['up'] && config['down']){
			// Init animation
			anim = new cm.Animation(config['scroll']);
			config['scroll'].scrollTop = 0;
			// Add events
			cm.addEvent(config['up'], 'mousedown', startMoveUp);
			cm.addEvent(config['up'], 'mouseup', endAnimation);
			cm.addEvent(config['up'], 'mouseout', endAnimation);
			cm.addEvent(config['down'], 'mousedown', startMoveDown);
			cm.addEvent(config['down'], 'mouseup', endAnimation);
			cm.addEvent(config['down'], 'mouseout', endAnimation);
		}
	};
	
	var startMoveUp = function(){
		endAnimation();
		animInterval = setInterval(moveUp, config['time']);
		moveUp();
	};
	
	var startMoveDown = function(){
		endAnimation();
		animInterval = setInterval(moveDown, config['time']);
		moveDown();
	};
	
	var endAnimation = function(){
		animInterval && clearInterval(animInterval);
	};
	
	var moveUp = function(){
		top = (config['scroll'].scrollTop - config['step'] < 0) ? 0 : (config['scroll'].scrollTop - config['step']);
		anim.go({'style' : {'scrollTop' : top}, 'duration' : config['time']});
	};
	
	var moveDown = function(){
		top = (config['scroll'].scrollTop + config['step'] > config['scroll'].scrollHeight)? (config['scroll'].scrollHeight - config['scroll'].scrollTop) : (config['scroll'].scrollTop + config['step']);
		anim.go({'style' : {'scrollTop' : top}, 'duration' : config['time']});
	};
	
	init();
};