Com['SlideX'] = function(o){
	var config = cm.merge({
			'node' : cm.Node('div'),
			'step' : 300,
			'time' : 200
		}, o),
		nodes = {},
		anim;
		
	var init = function(){
		nodes['scroll'] = cm.getByClass('c', config['node'])[0];
		nodes['left'] = cm.getByClass('l', config['node'])[0];
		nodes['right'] = cm.getByClass('r', config['node'])[0];
		
		anim = new cm.Animation(nodes['scroll']);
		nodes['scroll'].scrollLeft = 0;
		nodes['left'].onclick = moveLeft;
		nodes['right'].onclick = moveRight;
	};
	
	var moveLeft = function(){
		var left = (nodes['scroll'].scrollLeft - config['step'] < 0) ? 0 : (nodes['scroll'].scrollLeft - config['step']);
		anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['time']});
	};
	
	var moveRight = function(){
		var left = (nodes['scroll'].scrollLeft + config['step'] > nodes['scroll'].scrollWidth)? (nodes['scroll'].scrollWidth - nodes['scroll'].scrollLeft) : (nodes['scroll'].scrollLeft + config['step']);
		anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['time']});
	};
	
	init();
};