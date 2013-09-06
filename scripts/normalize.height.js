var normalizeHeight = function(container, widgetClass){
    var nodes, maxHeight, height, block, descr,
		widgetClass = widgetClass || 'widget';
    if(container){
        nodes = cm.getByClass(widgetClass, container);
        maxHeight = 0;
        for(var i = 0, l = nodes.length; i < l; i++){
			descr = cm.getByClass('descr', nodes[i])[0];
			if(descr){
				 height = descr.offsetHeight - cm.getCSSStyle(descr, 'paddingTop', true) - cm.getCSSStyle(descr, 'paddingBottom', true);
				if(height > maxHeight){
					maxHeight = height;
				}
			}
        }
        for(var i = 0, l = nodes.length; i < l; i++){
			descr = cm.getByClass('descr', nodes[i])[0];
			if(descr){
				block = descr;
				block.style.height = maxHeight+'px';
			}
        }
    }
};