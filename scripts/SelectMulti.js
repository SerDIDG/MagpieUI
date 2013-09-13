Com['SelectMulti'] = function(o){
	var that = this,
		config = cm.merge({
			'container' : cm.Node('div'),
			'name' : 'multiselect',
			'width' : 'auto',
			'data' : []						// value, text
		}, o),
		nodes = {},
		items = [];
		
	var init = function(){
		// Structure
		nodes['container'] = cm.Node('div', {'class' : 'com-multiselect'},
			nodes['inner'] = cm.Node('div', {'class' : 'inner'},
				nodes['scroll'] = cm.Node('div', {'class' : 'scroll'},
					nodes['list'] = cm.Node('ul')
				)
			)
		);
		// Set select width
		nodes['container'].style.width = config['width'];
		// Render Items
		for(var i = 0, l = config['data'].length; i < l; i++){
			items.push(renderOption(config['data'][i], i));
		}
		// Append
		config['container'].appendChild(nodes['container']);
	};
	
	var renderOption = function(option){
		var item = cm.merge({
				'value' : '',
				'text' : '',
				'checked' : false
			}, option);
		// Structure
		nodes['list'].appendChild(
			item['node'] = cm.Node('li', option['text'])
		);
		// Onclick event
		item['node'].onclick = function(){
			if(item['checked']){
				cm.removeClass(item['node'], 'selected');
				item['checked'] = false;
			}else{
				cm.addClass(item['node'], 'selected');
				item['checked'] = true;
			}
		};
		// Add to array
		return item;
	};
		
	/* Main */
	
	that.get = function(){
		var data = [];
		for(var i = 0, l = items.length; i <  l; i++){
			items[i]['checked'] && data.push(items[i]['value']);
		}
		return data.join(',') || 0;
	};
	
	that.set = function(){
		var ids = arguments[0]? arguments[0].toString().split(',') : 0;
		for(var i1 = 0, l1 = items.length; i1 < l1; i1++){
			for(var i2 = 0, l2 = ids.length; i2 < l2; i2++){
				if(ids[i2] == items[i1]['value']){
					cm.addClass(items[i1]['node'], 'selected');
					items[i1]['checked'] = true;
				}
			}
		}
		return that;
	};
	
	init();
};