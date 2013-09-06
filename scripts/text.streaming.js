var TextStreaming = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),
			'speed' : 8						// ms per pixel
		}, o),
		nodes = {
			'items' : []
		},
		items = [],
		itemsCount,
		anim;
	
	var init = function(){
		nodes['scroll'] = config['node'].getElementsByTagName('ul')[0];
		if(nodes['scroll']){
			nodes['items'] = nodes['scroll'].getElementsByTagName('li');
			itemsCount = nodes['items'].length;
			for(var i = 0; i < itemsCount; i++){
				items.push(nodes['items'][i]);
			}
			// Start Animation
			anim = new cm.Animation(config['node']);
			(function animate(){
				if(items[itemsCount]){
					cm.remove(items[0]);
					items.shift();
				}
				config['node'].scrollLeft = 0;
				items.push(
					nodes['scroll'].appendChild(
						items[0].cloneNode(true)
					)
				);
				var width = items[0].offsetWidth;
				if(width){
					anim.go({
						'style' : {'scrollLeft' : width},
						'duration' : (width * config['speed']),
						'anim' : 'simple',
						'onStop' : animate
					});
				}else{
					setTimeout(animate, 0);
				}
			})();
		}
	};
	
	init();
};

var TextStreamingCollector = function(node){
	var that = this,
		elements;
	
	var init = function(node){
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
		elements = cm.getByAttr('data-streaming-text', 'true', node);
		for(var i = 0, l = elements.length; i < l; i++){
			new TextStreaming({'node' : elements[i]});
		}
	};
	
	init(node);
};