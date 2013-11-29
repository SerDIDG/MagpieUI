Com['ToggleBox'] = function(o){
	var that = this,
		config = cm.merge({
			'button' : cm.Node('div'),
			'block' : cm.Node('div'),
			'onShow' : function(){},
			'onHide' : function(){},
			'time' : 500,
			'useLangs' : false,
			'titleNode' : false,			// If 'false' - script uses DT tag element, else - put title's dom node
			'langs' : {
				'showTitle' : 'Show',
				'hideTitle' : 'Hide'
			}
		},o),
		anim,
		isHide;
		
	var init = function(){
		anim = new cm.Animation(config['block']);
		isHide = config['block'].offsetHeight === 0;
		
		cm.addEvent(config['button'], 'click', function(){
			if(isHide){
				show();
				isHide = false;
			}else{
				hide();
				isHide = true;
			}
		});
		
	};
	
	var show = that.show = function(){
		if(isHide){
			var height,
				currentHeight;
			isHide = false;
			// Set title
			if(config['useLangs']){
				if(config['titleNode']){
					config['titleNode'].innerHTML = config['langs']['hideTitle'];
				}else{
					config['button'].innerHTML = config['langs']['hideTitle'];
				}
			}
			// Event
			config['onShow'](that);
			// Get real block height
			currentHeight =  config['block'].offsetHeight + 'px';
			config['block'].style.height = 'auto';
			height = config['block'].offsetHeight + 'px';
			config['block'].style.height = currentHeight;
			// Animate
			anim.go({'style' : {'height' : height}, 'anim' : 'smooth', 'duration' : config['time'], 'onStop' : function(){
				config['block'].style.height = 'auto';
				config['block'].style.overflow = 'visible';
			}});
		}
		return that;
	};
	
	var hide = that.hide = function(){
		if(!isHide){
			isHide = true;
			// Set title
			if(config['useLangs']){
				if(config['titleNode']){
					config['titleNode'].innerHTML = config['langs']['showTitle'];
				}else{
					config['button'].innerHTML = config['langs']['showTitle'];
				}
			}
			// Event
			config['onHide'](that);
			// Animate
			config['block'].style.overflow = 'hidden';
			anim.go({'style' : {'height' : '0px'}, 'anim' : 'smooth', 'duration' : config['time']});
		}
		return that;
	};
	
	init();
};

Com['ToggleBoxWidget'] = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),
			'onShow' : function(){},
			'onHide' : function(){},
			'time' : 500,
			'useLangs' : false,
			'langs' : {
				'showTitle' : 'Show',
				'hideTitle' : 'Hide'
			}
		}, o);
		
	var init = function(){
		config['button'] = config['node'].getElementsByTagName('dt')[0],
		config['block'] = config['node'].getElementsByTagName('dd')[0];
		config['titleNode'] = cm.getByAttr('data-togglebox-titlenode', 'true', config['node'])[0];
		
		if(config['button'] && config['block']){
			new Com.ToggleBox(config);
		}
	};
	
	init();
};

Com['ToggleBoxCollector'] = function(node){
	var that = this;
	
	var init = function(){
		if(!node){
			render(document.body);
		}else if(node.constructor == Array){
			for(var i = 0, l = node.length; i < l; i++){
				render(node[i]);
			}
		}else{
			render(node);
		}
	};
	
	var render = function(node){
		var nodes = cm.getByAttr('data-togglebox', 'true', node);
		for(var i = 0, l = nodes.length; i < l; i++){
			var langShow = nodes[i].getAttribute('data-togglebox-show'),
				langHide = nodes[i].getAttribute('data-togglebox-hide');
				
			new Com.ToggleBox({
				'button' : nodes[i].getElementsByTagName('dt')[0],
				'block' : nodes[i].getElementsByTagName('dd')[0],
				'titleNode' : cm.getByAttr('data-togglebox-titlenode', 'true', nodes[i])[0],
				'useLangs' : langShow && langHide,
				'langs' : {
					'showTitle' : langShow,
					'hideTitle' : langHide
				}
			});
		}
	};
	
	init(node);
};

Com['ToggleBoxAccordion'] = function(node){
	var that = this,
		boxes = [];
	
	var init = function(){
		if(!node){
			render(document.body);
		}else if(node.constructor == Array){
			for(var i = 0, l = node.length; i < l; i++){
				render(node[i]);
			}
		}else{
			render(node);
		}
	};
	
	var render = function(node){
		var nodes = cm.getByAttr('data-togglebox', 'true', node);
		
		for(var i = 0, l = nodes.length; i < l; i++){
			var langShow = nodes[i].getAttribute('data-togglebox-show'),
				langHide = nodes[i].getAttribute('data-togglebox-hide');
				
			new Com.ToggleBox({
				'button' : nodes[i].getElementsByTagName('dt')[0],
				'block' : nodes[i].getElementsByTagName('dd')[0],
				'onShow' : hide,
				'titleNode' : cm.getByAttr('data-togglebox-titlenode', 'true', nodes[i])[0],
				'useLangs' : langShow && langHide,
				'langs' : {
					'showTitle' : langShow,
					'hideTitle' : langHide
				}
			});
		}
	};
	
	var hide = function(me){
		boxes.forEach(function(item){
			if(me !== item){
				item.hide();
			}
		});
	};
	
	init();
};

Com['ToggleBoxGridlist'] = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),
			'useLangs' : false,
			'langs' : {
				'showTitle' : 'Show',
				'hideTitle' : 'Hide'
			}
		}, o),
		buttons = [],
		boxes = {};
		
	var init = function(){
		// Get buttons
		buttons = cm.getByAttr('data-togglebox-button', 'true', config['node']);
		// Get blocks
		for(var i = 0, l = buttons.length; i < l; i++){
			renderItem(buttons[i]);
		}
	};
	
	var renderItem = function(button){
		var id = button.getAttribute('data-gridlist-for'),
			blocks = cm.getByAttr('data-gridlist-id', id, config['node']),
			subs = cm.getByAttr('data-gridlist-parent-id', id, config['node']);
		// Add event
		cm.addEvent(button, 'click', function(){
			if(boxes[id]['isHide']){
				show(id);
			}else{
				hide(id);
			}
		});
		// Collect
		boxes[id] = {
			'id' : id,
			'item' : cm.getByAttr('data-gridlist-item', id, config['node'])[0],
			'button' : button,
			'blocks' : blocks,
			'subs' : subs,
			'isHide' : cm.isClass(blocks[0], 'display-none')
		};
	};
	
	var show = function(id){
		boxes[id]['isHide'] = false;
		for(var i = 0, l = boxes[id]['blocks'].length; i < l; i++){
			cm.removeClass(boxes[id]['blocks'][i], 'display-none');
			cm.addClass(boxes[id]['blocks'][i], 'gridlist-grey');
		}
		cm.addClass(boxes[id]['item'], 'gridlist-grey');
		if(config['useLangs']){
			boxes[id]['button'].innerHTML = config['langs']['hideTitle'];
		}
	};
	
	var hide = function(id){
		boxes[id]['isHide'] = true;
		if(boxes[id]['subs']){
			for(var i = 0, l = boxes[id]['subs'].length; i < l; i++){
				var subId = boxes[id]['subs'][i].getAttribute('data-gridlist-id');
				if(subId != id){
					hide(subId);
				}
			}
		}
		for(var i = 0, l = boxes[id]['blocks'].length; i < l; i++){
			cm.addClass(boxes[id]['blocks'][i], 'display-none');
			cm.removeClass(boxes[id]['blocks'][i], 'gridlist-grey');
		}
		cm.removeClass(boxes[id]['item'], 'gridlist-grey');
		if(config['useLangs']){
			boxes[id]['button'].innerHTML = config['langs']['showTitle'];
		}
	};
	
	init();
};


