Com['TextStreaming'] = function(o){
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
			cm.forEach(nodes['items'], function(item){
				items.push(item);
			});
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

Com['TextStreamingCollector'] = function(node){
	var elements;
	
	var init = function(node){
		if(!node){
			render(document.body);
		}else if(node.constructor == Array){
            cm.forEach(item, render);
		}else{
			render(node);
		}
	};
	
	var render = function(node){
		elements = (node.getAttribute('data-streaming-text') == 'true') ? [node] : cm.getByAttr('data-streaming-text', 'true', node);
		cm.forEach(elements, function(item){
			new Com.TextStreaming({'node' : item});
		});
	};
	
	init(node);
};