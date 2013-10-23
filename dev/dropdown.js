var DropDown = function(node){
	var that = this,
		node = node;
	
	var init = function(){
		node = node || document.body;
		// Get parent nodes
		var parents = cm.getByClass('has-dropdown');
		// Add event
		for(var i = 0, l = parents.length; i < l; i++){
			first(parents[i]);
		}
	};
	
	var first = function(parent){
		var child = cm.getByClass('dropdown', parent)[0],
			anim = new cm.Animation(child),
			height;
		// Get real dropdown menu height
		child.style.height = 'auto';
		height = child.offsetHeight;
		child.style.height = '0px';
		// Show
		parent.onmouseover = function(e){
			var e = cm.getEvent(e),
				target = e.relatedTarget || e.fromElement;
				
			if(!cm.isParent(parent, target)){
				anim.go({'style' : {'height': height+'px'}, 'duration' : 300, 'anim' : 'acceleration', 'onStop' : function(){
					child.style.overflow = 'visible';
				}});
			}
		};
		parent.onmouseout = function(e){
			var e = cm.getEvent(e),
				target = e.relatedTarget || e.toElement;
				
			if(!cm.isParent(parent, target)){
				child.style.overflow = 'hidden';
				anim.go({'style' : {'height': '0px'}, 'duration' : 300, 'anim' : 'inhibition'});
			}
		};
		// Child menus
		var parents = cm.getByClass('has-second-dropdown', child);
		// Add event
		for(var i = 0, l = parents.length; i < l; i++){
			second(parents[i]);
		}
	};
	
	var second = function(parent){
		var child = cm.getByClass('dropdown', parent)[0],
			anim = new cm.Animation(child),
			width;
		// Get real dropdown menu width
		child.style.width = 'auto';
		width = child.offsetWidth;
		child.style.width = '0px';
		// Show
		parent.onmouseover = function(e){
			var e = cm.getEvent(e),
				target = e.relatedTarget || e.fromElement;
				
			if(!cm.isParent(parent, target)){
				anim.go({'style' : {'width': width+'px'}, 'duration' : 200, 'anim' : 'acceleration', 'onStop' : function(){
					child.style.overflow = 'visible';
				}});
			}
		};
		parent.onmouseout = function(e){
			var e = cm.getEvent(e),
				target = e.relatedTarget || e.toElement;
				
			if(target != parent && !cm.isParent(parent, target)){
				child.style.overflow = 'hidden';
				anim.go({'style' : {'width': '0px'}, 'duration' : 200, 'anim' : 'inhibition'});
			}
		};
	};
	
	init();
};