cm.define('Com.DialogContainer', {
    'extend' : 'Com.AbstractContainer',
    'params' : {
        'constructor' : 'Com.Dialog',
        'container' : 'document.body',
        'destructOnClose' : false,
        'renderButtons' : false,
        'renderButtonsPositions' : false,
        'renderTitle' : true,
        'renderHelp' : false,
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

cm.getConstructor('Com.DialogContainer', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        that.buttons = {};
    };

    classProto.onValidateParams = function(){
        var that = this;
        // Set Content
        if(cm.isObject(that.params['content'])){
            that.params['params']['title'] = that.params['content']['title'] || that.params['params']['title'];
            that.params['params']['content'] = that.params['content']['content'] || that.params['params']['content'];
            that.params['params']['buttons'] = that.params['content']['buttons'] || that.params['params']['buttons'];
            that.params['params']['help'] = that.params['content']['help'] || that.params['params']['help'];
        }
        that.params['params']['showTitle'] = that.params['renderTitle'];
        that.params['params']['showHelp'] = that.params['renderHelp'];
    };

    classProto.constructController = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['params'], {
                'opener' : that,
                'container' : that.params['container'],
                'title' : that.nodes['title'] || that.params['params']['title'] || that.params['title'],
                'content' : that.nodes['content'] || that.params['params']['content'] || that.params['content'],
                'buttons' : that.nodes['buttons'] || that.params['params']['buttons'] || that.params['buttons'],
                'help' : that.nodes['help'] || that.params['params']['help'] || that.params['help']
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
        that.components['controller'].addEvent('onOpenEnd', that.afterOpenControllerEndHandler);
        that.components['controller'].addEvent('onCloseEnd', that.afterCloseControllerHandler);
    };

    classProto.renderButtonsView = function(){
        var that = this;
        // Structure
        that.nodes['buttons'] = cm.node('div', {'class' : 'pt__buttons is-adaptive'},
            that.nodes['buttonsHolder'] = cm.node('div', {'class' : 'inner'})
        );
        if(that.params['renderButtonsPositions']){
            that.nodes['buttonsHolderLeft'] = cm.node('div', {'class' : 'left'});
            that.nodes['buttonsHolderRight'] = cm.node('div', {'class' : 'right'});
            cm.appendChild(that.nodes['buttonsHolderLeft'], that.nodes['buttonsHolder']);
            cm.appendChild(that.nodes['buttonsHolderRight'], that.nodes['buttonsHolder']);
        }
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
            'justify' : 'auto',
            'embed' : false,
            'callback' : function(){}
        }, item);
        // Validate
        item['justify'] = that.params['renderButtonsPositions'] ? item['justify'] : 'auto';
        // Structure
        item['node'] = cm.node('button', {'class' : ['button', item['style']].join(' ')}, item['label']);
        cm.addEvent(item['node'], 'click', item['callback']);
        // Embed
        that.buttons[item['name']] = item;
        that.embedButton(item);
        return item;
    };

    classProto.embedButton = function(item){
        var that = this;
        switch(item['justify']){
            case 'right':
                if(that.nodes['buttonsHolderRight']){
                    item['embed'] = true;
                    cm.appendChild(item['node'], that.nodes['buttonsHolderRight']);
                }
                break;

            case 'left':
                if(that.nodes['buttonsHolderLeft']){
                    item['embed'] = true;
                    cm.appendChild(item['node'], that.nodes['buttonsHolderLeft']);
                }
                break;

            case 'auto':
            default:
                if(that.nodes['buttonsHolder']){
                    item['embed'] = true;
                    cm.appendChild(item['node'], that.nodes['buttonsHolder']);
                }
                break;
        }
        return that;
    };

    classProto.renderButton = function(item){
        var that = this;
        // Configure
        if(that.getButton(item['name'])){
            item = that.getButton(item['name']);
        }else{
            item = that.addButton(item);
        }
        // TODO: Check this moment
        // Embed
        if(!item['embed']){
            that.embedButton(item);
        }
        return that;
    };

    classProto.getButton = function(name){
        var that = this;
        return that.buttons[name];
    };
});
