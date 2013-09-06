var TextShadowFix = function(node){
	var that = this;
	
	var init = function(){
		if(is('IE9') || is('IE8') || is('IE7')){
			if(!node){
				render(document.body);
			}else if(node.constructor == Array){
				for(var i = 0, l = node.length; i < l; i++){
					render(node[i]);
				}
			}else{
				render(node);
			}
		}
	};
	
	var render = function(node){
		cm.getChilds(node, function(child){
			var styles = cm.getCSSStyle(child, (is('IE')? 'text-shadow' : 'textShadow'));
			if(styles && styles != 'none'){
				cm.getTextNodes(child, function(node){
					var text = node.innerText || node.textContent || node.nodeValue;
					if(!/^\s*$/gi.test(text)){
						set(node, styles, text);
					}
				});
			}
		});
	};
	
	var set = function(node, styles, text){
		var container,
			textNode,
			shadowNode;
		// Insert new nodes
		container = cm.Node('span',
			textNode = cm.Node('span', text),
			shadowNode = cm.Node('span')
		);
		cm.insertBefore(container, node);
		cm.remove(node);
		// Set styles
		container.style.position = 'relative';
		container.style.display = 'inline-block';
		textNode.style.position = 'relative';
		textNode.style.zIndex = 2;
		shadowNode.style.position = 'absolute';
		shadowNode.style.zIndex = 1;
		shadowNode.style.top = 0;
		shadowNode.style.right = 0;
		shadowNode.style.bottom = 0;
		shadowNode.style.left = 0;
		// Parse styles
		styles = rgba2hex(styles).replace(/\n|\t|\r/gi, ' ').replace(/[ ]{1,}/gi, ' ').split(', ');
		if( -1 != styles[0].indexOf( 'NaN' ) )
			return;
		for(var i = 0, l = styles.length; i < l; i++){
			if(i < 4){
				var line = styles[i].split(' '),
					x = parseInt(line[0].toString().replace('px', '')),
					y = parseInt(line[1].toString().replace('px', '')),
					node;
				// Insert shadow node and set color
				shadowNode.appendChild(
					node = cm.Node('span', text)
				)
				node.style.color = line[3];
				node.style.position = 'absolute';
				// Set coordinates 
				if(x < 0){
					shadowNode.style.left = -Math.abs(x) + 'px';
					node.style.left = 0;
				}else if(x > 0){
					shadowNode.style.right = -Math.abs(x) + 'px';
					node.style.right = 0;
				}
				if(y < 0){
					shadowNode.style.top = -Math.abs(y) + 'px';
					node.style.top = 0;
				}else if(y > 0){
					shadowNode.style.bottom = -Math.abs(y) + 'px';
					node.style.bottom = 0;
				}
				// Set shadow opacity
				line[4] && cm.setOpacity(shadowNode, line[4]);
			}
		}
	};
	
	var rgba2hex = function(str){
		return str.replace(/(rgba\([\d|\.|,|\s]+\))/gi, function(s, p1){
			p1 = p1.replace(/rgba\(|\)/gi, '').split(', ');
			return [cm.rgb2hex(p1[0], p1[1], p1[2]), p1[3]].join(' ');
		});
	};
	
	init();
};