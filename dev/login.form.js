Com['LoginForm'] = function(o){
	var that = this,
		config = cm.merge({
			'button' : cm.Node('div'),
			'block' : cm.Node('div'),
			'direction' : 'right'
		}, o),
		anim = new cm.Animation(config['block']),
		isOpen = false,
		pageWidth = 0,
		loginHeight = 0;

	config['button'].onclick = function(){
		if(!isOpen){
			pageWidth = cm.getPageSize('width');
			// Set Styles
			with(config['block'].style){
				display = 'block';
				top = [cm.getY(config['button']) + config['button'].offsetHeight + 20, 'px'].join('');
				height = 'auto';
				loginHeight = [config['block'].offsetHeight, 'px'].join('');
				height = '0px';
				// Set Direction
				switch(config['direction']){
					case 'right' :
						right = [(pageWidth - (cm.getX(config['button']) + config['button'].offsetWidth)), 'px'].join('');
					break;
					case 'left' :
						left = [cm.getX(config['button']), 'px'].join('');
					break;
				}
			}
			anim.go({'style' : {'opacity' : 1, 'height' : loginHeight}, 'anim' : 'acceleration', 'duration' : 300, 'onStop' : function(){
				config['block'].style.overflow = 'visible';
			}});
		}else{
			config['block'].style.overflow = 'hidden';
			anim.go({'style' : {'opacity' : 0, 'height' : '0px'}, 'anim' : 'acceleration', 'duration' : 300, 'onStop' : function(){
				config['block'].style.display = 'none';
			}});
		}
		isOpen = !isOpen;
		return false;
	};
};