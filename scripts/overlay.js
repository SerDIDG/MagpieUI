Com['Overlay'] = function(o){
	var that = this,
		config = cm.merge({
			'openTime' : 300,
			'opacity' : 0.6,
			'autoOpen' : true,
			'node' : document.body,
			'position' : 'fixed'
		}, o),
		nodes = {},
		anim;
		
	var init = function(){
		// Structure
		config['node'].appendChild(
			nodes['container'] = cm.Node('div', {'class' : 'cm-overlay'},
				nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
				cm.Node('div', {'class' : 'inner'})
			)
		);
		nodes['container'].style.position = config['position'];
		// Set opacity
		cm.setOpacity(nodes['bg'], config['opacity']);
		// Init animation
		anim = new cm.animation(nodes['container']);
		// Auto Open
		config['autoOpen'] && open();
	};
		
	/* Main */
	
	var open = that.open = function(){
		nodes['container'].style.display = 'block';
		// Animate
		anim.go({'style' : {'opacity' : '1'}, 'duration' : config['openTime']});
		return that;
	};
	
	var close = that.close = function(){
		// Animate
		anim.go({'style' : {'opacity' : '0'}, 'duration' : config['openTime'], 'onStop' : function(){
			nodes['container'].style.display = 'none';
			cm.remove(nodes['container']);
		}});
		return that;
	};
	
	init();
};