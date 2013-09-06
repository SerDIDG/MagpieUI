var initSiteMap = function(o){
	var that = this,
		config = cm.merge({
			'button' : cm.Node('div'),
			'map' : cm.Node('div'),
			'scroll' : true,
			'time' : 500,
			'langs' : {
				'open' : 'Show Sitemap',
				'hide' : 'Hide Sitemap'
			}
		}, o),
		anim = new cm.Animation(config['map']),
		text = config['button'].getElementsByTagName('span')[0],
		isOpen = false,
		height;
		
	config['button'].onclick = function(){
		if(!isOpen){
			// Button
			text.innerHTML = config['langs']['close'];
			cm.addClass(config['button'], 'open');
			// Map
			config['map'].style.height = 'auto';
			height = config['map'].offsetHeight+'px';
			config['map'].style.height = 0;
			anim.go({'style' : {'height' : height}, 'anim' : 'smooth', 'duration' : config['time'], 'onStop' : function(){
				config['map'].style.height = 'auto';
			}});
			// Scroll to document bottom
			config['scroll'] && new cm.Animation(document.body).go({'style' : {'docScrollTop' : cm.getPageSize('height')}, 'anim' : 'smooth', 'duration' : config['time']});
		}else{
			// Button
			text.innerHTML = config['langs']['open'];
			cm.removeClass(config['button'], 'open');
			// Map
			anim.go({'style' : {'height' : '0px'}, 'anim' : 'acceleration', 'duration' : config['time']});
		}
		isOpen = !isOpen;
	}
};


