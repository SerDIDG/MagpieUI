cm.define('Com.DialogContainer', {
    'extend' : 'Com.AbstractContainer',
    'params' : {
        'constructor' : 'Com.Dialog',
        'container' : 'document.body',
        'renderButtons' : false,
        'justifyButtons' : 'right',
        'params' : {
            'destructOnRemove' : false,
            'autoOpen' : false
        }
    },
    'strings' : {
        'close' : 'Close'
    }
},
function(params){
    var that = this;
    that.buttons = {};
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.DialogContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        // Set Content
        if(cm.isObject(that.params['content'])){
            that.params['params']['title'] = that.params['content']['title'] || that.params['params']['title'];
            that.params['params']['content'] = that.params['content']['content'] || that.params['params']['content'];
            that.params['params']['buttons'] = that.params['content']['buttons'] || that.params['params']['buttons'];
        }
        return that;
    };

    classProto.constructController = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['params'], {
                'container' : that.params['container'],
                'title' : that.nodes['title'] || that.params['params']['title'] || that.params['title'],
                'content' : that.nodes['content'] || that.params['params']['content'] || that.params['content'],
                'buttons' : that.nodes['buttons'] || that.params['params']['buttons'] || that.params['buttons']
            })
        );
    };

    classProto.renderControllerView = function(){
        var that = this;
        that.params['renderButtons'] && that.renderButtonsView();
        return that;
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onOpenStart', that.afterOpenControllerHandler);
        that.components['controller'].addEvent('onCloseEnd', that.afterCloseControllerHandler);
        return that;
    };

    classProto.renderButtonsView = function(){
        var that = this;
        // Structure
        that.nodes['buttons'] = cm.node('div', {'class' : 'pt__buttons'},
            that.nodes['buttonsHolder'] = cm.node('div', {'class' : 'inner'})
        );
        cm.addClass(that.nodes['buttons'], ['pull', that.params['justifyButtons']].join('-'));
        // Render buttons
        cm.forEach(that.buttons, function(item){
            that.renderButton(item);
        });
        return that;
    };

    classProto.addButton = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'name' : '',
            'label' : '',
            'style' : 'button-primary',
            'embed' : false,
            'callback' : function(){}
        }, item);
        // Structure
        item['node'] = cm.node('button', {'class' : ['button', item['style']].join(' ')}, item['label']);
        cm.addEvent(item['node'], 'click', item['callback']);
        // Embed
        that.buttons[item['name']] = item;
        if(that.nodes['buttonsHolder']){
            item['embed'] = true;
            cm.appendChild(item['node'], that.nodes['buttonsHolder']);
        }
        return item;
    };

    classProto.renderButton = function(item){
        var that = this;
        // Configure
        if(that.getButton(item['name'])){
            item = that.getButton(item['name']);
        }else{
            item = that.addButton(item);
        }
        // Embed
        if(!item['embed'] && that.nodes['buttonsHolder']){
            item['embed'] = true;
            cm.appendChild(item['node'], that.nodes['buttonsHolder']);
        }
        return that;
    };

    classProto.getButton = function(name){
        var that = this;
        return that.buttons[name];
    };
});