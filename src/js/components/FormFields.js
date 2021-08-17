/* ******* COMPONENT: FORM FIELD ******* */

Com.FormFields = (function(){
		var stack = {};

		return {
				'add' : function(type, params){
						stack[type] = cm.merge({
								'node' : cm.node('div'),
								'fieldConstructor' : null,
								'constructor' : null,
								'type' : type,
								'field' : true,
								'system' : false
						}, params);
				},
				'get' : function(type){
						return stack[type]? cm.clone(stack[type], true) : null;
				}
		};
})();

cm.define('Com.FormField', {
		'modules' : [
				'Params',
				'Events',
				'DataConfig',
				'Stack',
				'Callbacks'
		],
		'events' : [
				'onRender'
		],
		'params' : {
				'node' : cm.node('div'),
				'container' : cm.node('div'),
				'form' : false,
				'name' : '',
				'value' : null,
				'dataValue' : null,
				'type' : false,
				'label' : '',
				'help' : null,
				'placeholder' : '',
				'visible' : true,
				'options' : [],
				'className' : '',                   // is-box
				'constructor' : false,
				'constructorParams' : {},
				'helpConstructor' : 'Com.HelpBubble',
				'helpParams' : {
						'renderStructure' : true
				}
		}
},
function(params){
		var that = this;

		that.nodes = {};
		that.components = {};
		that.form = null;
		that.controller = null;
		that.value = null;

		var init = function(){
				that.setParams(params);
				that.convertEvents(that.params.events);
				that.getDataConfig(that.params.node);
				that.callbacksProcess();
				validateParams();
				render();
				that.addToStack(that.params.node);
				that.triggerEvent('onRender');
		};

		var validateParams = function(){
				if(that.params.constructor){
						cm.getConstructor(that.params.constructor, function(classConstructor){
								that.params.constructor = classConstructor;
						});
				}
				that.params.constructorParams.node = that.params.node;
				that.params.constructorParams.name = that.params.name;
				that.params.constructorParams.options = that.params.options;
				that.params.constructorParams.value = that.params.dataValue || that.params.value;
				that.params.helpParams.content = that.params.help;
				that.params.helpParams.name = that.params.name;
				that.form = that.params.form;
		};

		var render = function(){
				// Render structure
				that.nodes = that.callbacks.render(that) || {};
				// Append
				that.params.container.appendChild(that.nodes.container);
				// Construct
				that.callbacks.construct(that);
		};

		/* ******* CALLBACKS ******* */

		that.callbacks.construct = function(that){
				that.controller = that.callbacks.controller(that, that.params.constructorParams);
		};

		that.callbacks.controller = function(that, params){
				if(that.params.constructor){
						return new that.params.constructor(params);
				}
		};

		that.callbacks.render = function(that){
				var nodes = {};
				// Structure
				nodes.container = cm.node('dl', {'class' : 'pt__field is-adaptive'},
						nodes.label = cm.node('dt',
								cm.node('label', that.params.label)
						),
						nodes.value = cm.node('dd', that.params.node)
				);
				!that.params.visible && cm.addClass(nodes.container, 'is-hidden');
				// Style
				cm.addClass(nodes.container, that.params.className);
				// Attributes
				if(!cm.isEmpty(that.params.name)){
						that.params.node.setAttribute('name', that.params.name);
				}
				if(!cm.isEmpty(that.params.value)){
						that.params.node.setAttribute('value', that.params.value);
				}
				if(!cm.isEmpty(that.params.dataValue)){
						that.params.node.setAttribute('data-value', JSON.stringify(that.params.dataValue));
				}
				if(!cm.isEmpty(that.params.placeholder)){
						that.params.node.setAttribute('placeholder', that.params.placeholder);
				}
				if(!cm.isEmpty(that.params.help)){
						cm.getConstructor(that.params.helpConstructor, function(classConstructor){
								that.components.help = new classConstructor(
										cm.merge(that.params.helpParams, {
												'container' : nodes.label
										})
								);
						});
				}
				return nodes;
		};

		that.callbacks.clearError = function(that){
				cm.removeClass(that.nodes.container, 'error');
				cm.remove(that.nodes.errors);
		};

		that.callbacks.renderError = function(that, message){
				that.callbacks.clearError(that);
				cm.addClass(that.nodes.container, 'error');
				that.nodes.errors = cm.node('ul', {'class' : 'pt__field__error pt__field__hint'},
						cm.node('li', {'class' : 'error'}, message)
				);
				cm.appendChild(that.nodes.errors, that.nodes.value);
		};

		that.callbacks.set = function(that, value){
				that.controller && cm.isFunction(that.controller.set) && that.controller.set(value);
				return value;
		};

		that.callbacks.get = function(that){
				return that.controller && cm.isFunction(that.controller.get) ? that.controller.get() : null;
		};

		that.callbacks.reset = function(that){
				that.controller && cm.isFunction(that.controller.reset) && that.controller.reset();
		};

		that.callbacks.destruct = function(that){
				that.controller && cm.isFunction(that.controller.destruct) && that.controller.destruct();
		};

		/* ******* PUBLIC ******* */

		that.set = function(value){
				that.value = that.callbacks.set(that, value);
				return that;
		};

		that.get = function(){
				that.value = that.callbacks.get(that);
				return that.value;
		};

		that.reset = function(){
				that.callbacks.reset(that);
				return that;
		};

		that.destruct = function(){
				that.callbacks.destruct(that);
				that.removeFromStack();
				return that;
		};

		that.renderError = function(errors, message){
				that.callbacks.renderError(that, errors, message);
				return that;
		};

		that.clearError = function(){
				that.callbacks.clearError(that);
				return that;
		};

		init();
});

/* ******* COMPONENT: FORM FIELD: DECORATORS ******* */

Com.FormFields.add('empty', {
		'field' : false,
		'fieldConstructor' : 'Com.AbstractFormField'
});

Com.FormFields.add('buttons', {
		'node' : cm.node('div', {'class' : 'pt__buttons pull-right'}),
		'field' : false,
		'system' : true,
		'callbacks' : {
				'render' : function(that){
						var nodes = {};
						nodes.container = that.params.node;
						nodes.inner = cm.node('div', {'class' : 'inner'});
						cm.appendChild(nodes.inner, nodes.container);
						return nodes;
				},
				'controller' : function(that){
						var buttons = {},
								node;
						cm.forEach(that.params.options, function(item){
								node = cm.node('button', item.text);
								switch(item.value){
										case 'submit':
												node.type = 'submit';
												cm.addClass(node, 'button-primary');
												cm.addEvent(node, 'click', function(e){
														cm.preventDefault(e);
														that.form.send();
												});
												break;

										case 'reset':
												node.type = 'reset';
												cm.addClass(node, 'button-secondary');
												cm.addEvent(node, 'click', function(e){
														cm.preventDefault(e);
														that.form.reset();
												});
												break;

										case 'clear':
												cm.addClass(node, 'button-secondary');
												cm.addEvent(node, 'click', function(e){
														cm.preventDefault(e);
														that.form.clear();
												});
												break;

										default:
												break;
								}
								buttons[item.value] = node;
								that.params.node.appendChild(node);
						});
						return buttons;
				}
		}
});
