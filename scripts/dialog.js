Com.Elements['Dialog'] = {}; 
 
Com['GetDialog'] = function(id){  
	return Com.Elements.Dialog[id] || null; 
}; 
 
Com['SetDialog'] = function(id, dialog){  
	if(id && dialog){
		Com.Elements.Dialog[id] = dialog; 
		return dialog;
	}
	return false;
};

Com['RemoveDialog'] = function(id){  
	if(Com.Elements.Dialog[id]){
		delete Com.Elements.Dialog[id]; 
	}
};

Com['Dialog'] = function(o){
	var that = this,
		config = cm.merge({
			'id' : null,
			'width' : 700,
            'minHeight' : 0,
            'maxHeight' : 'auto',
			'position' : 'fixed',
			'container' : document.body,
			'content' : cm.Node('div'),
			'title' : '',
			'closeButton' : true,
			'closeTitle' : true,
			'openTime' : 200,
			'autoOpen' : true,
			'removeOnClose' : true,
            'scroll' : true,
			'onOpen' : function(dialog){},
			'onClose' : function(dialog){},
			'langs' : {
				'closeTitle' : 'Close',
				'close' : 'x'
			}
		},o),
		overlayPadding = 10,
		height,
		width,
		innerHeight,
		resizeInt,
		nodes = {},
		anim = {};
		
	var init = function(){
		// Add to global array
		Com['SetDialog'](config['id'], that);
		// Structure
		config['container'].appendChild(
			nodes['container'] = cm.Node('div', {'class' : 'dialog'},
				nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
				nodes['window'] = cm.Node('div', {'class' : 'window'})
			)
		);
		// Set title
		renderTitle(config['title']);
		// Embed content
		renderContent(config['content']);
		// Render close button
		if(config['closeButton']){
			nodes['window'].appendChild(
				nodes['close'] = cm.Node('div', {'class' : 'close'}, config['langs']['close'])
			);
			if(config['closeTitle']){
				nodes['close'].title = config['langs']['closeTitle'];
			}
			nodes['close'].onclick = close;
		}
		// Set window dimention and position
		nodes['container'].style.position = config['position'];
		nodes['window'].style.width = config['width'] + 'px';
		// Init animation
		anim['container'] = new cm.Animation(nodes['container']);
		// Auto open
		config['autoOpen'] && open();
	};
	
	var renderTitle = function(title){
		if(!cm.isEmpty(title)){
			// Remove old nodes
			cm.remove(nodes['title']);
			// Render new nodes
			nodes['title'] = cm.Node('div', {'class' : 'title'}, 
				cm.Node('h1', title)
			);
			cm.insertFirst(nodes['title'], nodes['window']);
		}
	};
	
	var renderContent = function(node){
		if(!nodes['descr']){
            if(config['scroll']){
                nodes['window'].appendChild(
                    nodes['descr'] = cm.Node('div', {'class' : 'descr'},
                        nodes['scroll'] = cm.Node('div', {'class' : 'scroll'},
                            nodes['inner'] = cm.Node('div', {'class' : 'inner'})
                        )
                    )
                );
            }else{
                nodes['window'].appendChild(
                    nodes['descr'] = cm.Node('div', {'class' : 'descr'},
                        nodes['scroll'] = nodes['inner'] = cm.Node('div', {'class' : 'inner'})
                    )
                );
            }
		}
		if(node){
			cm.clearNode(nodes['inner']).appendChild(node);
		}
	};
	
	var resizeHandler = function(){
		// Set scroll height if dialog height > window height
		var winHeight = nodes['container'].offsetHeight - overlayPadding,
			winWidth = nodes['container'].offsetWidth - overlayPadding,
			freeHeight = winHeight - (nodes['title'] && nodes['title'].offsetHeight || 0) - cm.getStyle(nodes['descr'], 'paddingTop', true) - cm.getStyle(nodes['descr'], 'paddingBottom', true),
			insetHeight = nodes['inner'].offsetHeight,
            maxHeight = !config['maxHeight'] || config['maxHeight'] == 'auto' ? insetHeight : Math.min(config['maxHeight'], insetHeight),
			setHeight = Math.min(Math.max(maxHeight, config['minHeight']), freeHeight),
			windowHeight = nodes['window'].offsetHeight,
			windowWidth = nodes['window'].offsetWidth,
			setWidth = Math.min(config['width'], winWidth);
		// Set or remove scroll if needs
		if(innerHeight != setHeight){
			innerHeight = setHeight;
			nodes['scroll'].style.height = [innerHeight, 'px'].join('');
			if(maxHeight <= freeHeight && insetHeight <= maxHeight){
				cm.removeClass(nodes['scroll'], 'isScroll');
			}else{
				cm.addClass(nodes['scroll'], 'isScroll');
			}
			windowHeight = nodes['window'].offsetHeight;
		}
		// Set window width
		if(windowWidth != setWidth){
			windowWidth = setWidth;
			nodes['window'].style.width = [setWidth, 'px'].join('')
		}
		// Set new align if needs
		if(height != windowHeight){
			height = windowHeight;
			nodes['window'].style.marginTop = [-(windowHeight / 2), 'px'].join('');
		}
		if(width != windowWidth){
			width = windowWidth;
			nodes['window'].style.marginLeft = [-(windowWidth / 2), 'px'].join('');
		}
	};
	
	/* Main */
	
	var set = that.set = function(title, content){
		renderTitle(title);
		renderContent(content);
		
		return that;
	};
	
	var open = that.open = function(){
		nodes['container'].style.display = 'block';
		// Set window position
		nodes['window'].style.marginTop = -(nodes['window'].offsetHeight / 2) + 'px';
		nodes['window'].style.marginLeft = -(config['width'] / 2) + 'px';
		// Resize interval, removed on close
		resizeInt = setInterval(resizeHandler, 5);
		// Animate
		anim['container'].go({'style' : {'opacity' : '1'}, 'duration' : config['openTime'], 'onStop' : function(){
			// Open Event
			config['onOpen'](that);
		}});
		
		return that;
	};
	
	var close = that.close = function(){
		// Remove resize interval
		resizeInt && clearInterval(resizeInt);
		// Animate
		anim['container'].go({'style' : {'opacity' : '0'}, 'duration' : config['openTime'], 'onStop' : function(){
			nodes['container'].style.display = 'none';
			// Close Event
			config['onClose'](that);
			// Remove Window
			config['removeOnClose'] && remove();
		}});
		
		return that;
	};
	
	var remove = that.remove = function(){
		// Remove resize interval
		resizeInt && clearInterval(resizeInt);
		// Remove dialog container node
		cm.remove(nodes['container']);
		// Remove dialog from global array
		Com['RemoveDialog'](config['id']);
		return that;
	};
	
	that.getNodes = function(){
		return nodes;
	};
	
	init();
};


