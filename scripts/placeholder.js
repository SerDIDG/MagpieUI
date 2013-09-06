var Placeholder = function(input, phrase){
	var that = this,
		isFocused = false;
	
	var init = function(){
		if(input){
			if(input.value == ''){
				input.value = phrase;
				cm.addClass(input, 'placeholder');
			}
			cm.addEvent(input,'focus',function(){
				if(input.value == phrase){
					input.value = '';
					cm.removeClass(input,'placeholder');
					input.focus();
				}
				isFocused = true
			});
			cm.addEvent(input,'blur',function(){
				if(input.value.length == 0){
					input.value = phrase;
					cm.addClass(input,'placeholder');
				} 
				isFocused = false;
			});
		}
	};
	
	var get = that.get = function(){
		return ((input.value == phrase)? '' : input.value);
	};
	var set = that.set = function(text){
		input.value = text;
		cm.removeClass(input,'placeholder');
		return that;
	};
	var restore = that.restore = function(){
		if(input.value == '' && !isFocused){
			input.value = phrase;
			cm.addClass(input,'placeholder');
		}
		return that;
	};
	var clear = that.clear = function(){
		if(input.value == phrase){
			set('');
		}
		return that;
	};
	
	init();
};

var cmPlaceholderObject = [];

var PlaceholderCollector = function(){
	var that = this,
		forms = document.body.getElementsByTagName('form'),
		inputs = document.body.getElementsByTagName('*');
	
	for(var i = 0, l = inputs.length; i < l; i++){
		if(/input|textarea/i.test(inputs[i].tagName)){
			var placeholder = inputs[i].getAttribute('data-placeholder');
			if(placeholder){
				cmPlaceholderObject.push(new Placeholder(inputs[i], placeholder));
			}
		}
	}
};

var clearPlaceholders = function(){
	for(var i = 0, l = cmPlaceholderObject.length; i < l; i++){
		cmPlaceholderObject[i].clear();
	}
};

var restorePlaceholders = function(){
	for(var i = 0, l = cmPlaceholderObject.length; i < l; i++){
		cmPlaceholderObject[i].restore();
	}
};