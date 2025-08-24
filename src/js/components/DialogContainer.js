cm.define('Com.DialogContainer', {
    'extend' : 'Com.AbstractContainer',
    'events' : [
        'onScroll',
    ],
    'params' : {
        'container' : 'document.body',
        'destructOnClose' : false,
        'renderTitle' : true,
        'titleAlign' : null,
        'renderHelp' : false,
        'renderButtons' : false,
        'renderButtonsPositions' : false,
        'buttonsAdaptive': true,
        'buttonsClasses': [],
        'justifyButtons' : 'right',
        'constructor' : 'Com.Dialog',
        'constructorParams' : {
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
            that.params['constructorParams']['title'] = that.params['content']['title'] || that.params['constructorParams']['title'];
            that.params['constructorParams']['content'] = that.params['content']['content'] || that.params['constructorParams']['content'];
            that.params['constructorParams']['buttons'] = that.params['content']['buttons'] || that.params['constructorParams']['buttons'];
            that.params['constructorParams']['help'] = that.params['content']['help'] || that.params['constructorParams']['help'];
        }
        that.params['constructorParams']['showTitle'] = that.params['renderTitle'];
        that.params['constructorParams']['showHelp'] = that.params['renderHelp'];
        that.params['constructorParams']['titleAlign'] = that.params['constructorParams']['titleAlign'] || that.params['titleAlign'];
    };

    classProto.constructController = function(classConstructor){
        var that = this;
        return new classConstructor(
            cm.merge(that.params['constructorParams'], {
                'opener' : that,
                'container' : that.params['container'],
                'title' : that.nodes['title'] || that.params['constructorParams']['title'] || that.params['title'],
                'content' : that.nodes['content'] || that.params['constructorParams']['content'] || that.params['content'],
                'buttons' : that.nodes['buttons'] || that.params['constructorParams']['buttons'] || that.params['buttons'],
                'help' : that.nodes['help'] || that.params['constructorParams']['help'] || that.params['help']
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
        that.components['controller'].addEvent('onCloseStart', that.afterCloseControllerStartHandler);
        that.components['controller'].addEvent('onCloseEnd', that.afterCloseControllerHandler);
        that.components['controller'].addEvent('onScroll', that.afterScroll.bind(that));
    };

    /******* CONTENT *******/

    classProto.setTitle = function(title){
        var that = this;
        that.params['constructorParams']['title'] = title;
        that.components['controller'] && cm.isFunction(that.components['controller'].setTitle) && that.components['controller'].setTitle(title);
        return that;
    };

    classProto.setSize = function(data) {
        var that = this;
        var params = ['width', 'height', 'minHeight', 'maxHeight'];
        cm.forEach(params, function(key) {
            if (!cm.isEmpty(data[key])) {
                that.params['constructorParams'][key] = data[key];
            }
        });
        that.components['controller'] && cm.isFunction(that.components['controller'].setSize) && that.components['controller'].setSize(data);
    };

    /******* BUTTONS *******/

    classProto.renderButtonsView = function(){
        var that = this;

        // Structure
        that.nodes['buttons'] = cm.node('div', {'class' : 'pt__buttons'},
            that.nodes['buttonsHolder'] = cm.node('div', {'class' : 'inner'})
        );

        // Classes
        cm.addClass(that.nodes['buttons'], that.params['buttonsClasses']);
        that.setButtonsJustify(that.params['justifyButtons']);

        if(that.params['buttonsAdaptive']){
            if(that.params['buttonsAdaptive'] === 'reverse'){
                cm.addClass(that.nodes['buttons'], 'is-adaptive-reverse');
            }else{
                cm.addClass(that.nodes['buttons'], 'is-adaptive');
            }
        }

        // Positions
        if(that.params['renderButtonsPositions']){
            that.nodes['buttonsHolderLeft'] = cm.node('div', {'class' : 'left'});
            that.nodes['buttonsHolderRight'] = cm.node('div', {'class' : 'right'});
            cm.appendChild(that.nodes['buttonsHolderLeft'], that.nodes['buttonsHolder']);
            cm.appendChild(that.nodes['buttonsHolderRight'], that.nodes['buttonsHolder']);
        }

        // Render buttons
        cm.forEach(that.buttons, item => that.renderButton(item));
        return that;
    };

    classProto.addButton = function(item){
        var that = this;

        // Config
        item = cm.merge({
            'name' : '',
            'label' : '',
            'classes': ['button-primary'],
            'justify' : 'right',
            'visible' : true,
            'focus': false,
            'embed' : false,
            'callback' : function(){}
        }, item);

        // Validate
        item['justify'] = that.params['renderButtonsPositions'] ? item['justify'] : 'auto';
        if(!cm.isArray(item['classes'])){
            item['classes'] = [item['classes']];
        }
        if(!item['visible']){
            item['classes'].push('is-hidden');
        }
        item['classes'].unshift('button');

        // Structure
        if (!item['node']) {
            item['node'] = cm.node('button', {'class' : item['classes']}, item['label']);
        }
        if (cm.isFunction(item['callback'])) {
            cm.click.add(item['node'], item['callback']);
        }

        // Append
        that.buttons[item['name']] = item;
        that.embedButton(item);

        // Set focus
        if(item['focus']){
            item['node'].focus();
        }
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

    classProto.removeButton = function(name) {
        var that = this;
        var item = that.getButton(name);
        if (item) {
            cm.remove(item['node']);
            delete that.buttons[item['name']];
        }
        return that;
    };

    classProto.removeButtons = function() {
        var that = this;
        cm.forEach(that.buttons, (item, name) => that.removeButton(name));
        return that;
    };

    classProto.toggleButtonVisibility = function(name, value){
        var that = this;
        var item = that.getButton(name);
        if (item) {
            item['visible'] = value;
            cm.toggleClass(item['node'], 'is-hidden', !value);
        }
        return that;
    };

    classProto.setButtonsJustify = function(value) {
        var that = this;
        cm.removeClass(that.nodes['buttons'], ['pull', that.params['justifyButtons']].join('-'));
        cm.addClass(that.nodes['buttons'], ['pull', value].join('-'));
        that.params['justifyButtons'] = value;
        return that;
    };

    /****** AFTER EVENTS *******/

    classProto.afterScroll = function(controller, event){
        var that = this;
        that.triggerEvent('onScroll', event);
    };
});
