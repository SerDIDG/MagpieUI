cm.define('Com.Toolbar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onProcessEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'adaptive' : true
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.groups = {};
    that.items = [];
    that.isHidden = true;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__toolbar is-hidden'},
            that.nodes['toolbar'] = cm.node('div', {'class' : 'pt__toolbar'},
                that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                    that.nodes['left'] = cm.node('div', {'class' : 'left'}),
                    that.nodes['right'] = cm.node('div', {'class' : 'right'})
                )
            )
        );
        that.params['adaptive'] && cm.addClass(that.nodes['toolbar'], 'is-adaptive');
        // Append
        that.embedStructure(that.nodes['container']);
    };

    /* ******* PUBLIC ******* */

    that.clear = function(){
        cm.forEach(that.groups, function(group){
            that.removeGroup(group);
        });
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.addGroup = function(item){
        item = cm.merge({
            'name' : '',
            'position' : 'left',            // left | center | right | justify
            'hidden' : false,
            'container' : cm.node('ul', {'class' : 'group'}),
            'node' : null,
            'adaptive' : true,
            'flex' : false,
            'items' : {}
        }, item);
        if(!that.groups[item['name']]){
            if(!item['node']){
                item['node'] = item['container'];
            }
            item['adaptive'] && cm.addClass(item['container'], 'is-adaptive');
            item['flex'] && cm.addClass(item['container'], 'is-flex');
            item['hidden'] && cm.addClass(item['container'], 'is-hidden');
            // Position
            if(/left|right/.test(item['position'])){
                cm.appendChild(item['container'], that.nodes[item['position']]);
            }else if(item['position'] === 'justify'){
                cm.appendChild(item['container'], that.nodes['inner']);
            }
            that.groups[item['name']] = item;
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.removeGroup = function(name){
        var item;
        if(cm.isObject(arguments[0])){
            item = name;
        }else{
            item = that.getGroup(name);
        }
        if(item){
            cm.remove(item['container']);
            delete that.groups[item['name']];
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.getGroup = function(name){
        return that.groups[name];
    };

    that.showGroup = function(name){
        var item = that.getGroup(name);
        if(item){
            item['hidden'] = false;
            cm.removeClass(item['container'], 'is-hidden');
        }
        return that;
    };

    that.hideGroup = function(name){
        var item = that.getGroup(name);
        if(item){
            item['hidden'] = true;
            cm.addClass(item['container'], 'is-hidden');
        }
        return that;
    };

    that.isGroupEmpty = function(name){
        var item = that.getGroup(name);
        if(item){
            return cm.getLength(item.items) === 0;
        }
        return true;
    };

    that.toggleGroupVisibility = function(name){
        if(that.isGroupEmpty(name)){
            that.hideGroup(name);
        }else{
            that.showGroup(name);
        }
        return that;
    };

    that.addField = function(item){
        var group;
        item = cm.merge({
            'name' : '',
            'hidden' : false,
            'container' : cm.node('li'),
            'node' : null,
            'size' : null,
            'group' : null,
            'constructor' : false,
            'constructorParams' : {}
        }, item);
        group = that.groups[item['group']];
        // Render
        if(group && !group.items[item['name']]){
            // Styles
            item['size'] && cm.addClass(item['container'], item['size']);
            item['hidden'] && cm.addClass(item['container'], 'is-hidden');
            // Controller
            if(item['constructor']){
                cm.getConstructor(item['constructor'], function(classConstructor){
                    item['controller'] = new classConstructor(
                        cm.merge(item['constructorParams'], {
                            'container' : item['container']
                        })
                    );
                });
            }
            // Embed
            if(cm.isNode(item['node'])){
                cm.appendChild(item['node'], item['container']);
            }
            cm.appendChild(item['container'], group['node']);
            group.items[item['name']] = item;
            that.items = cm.arrayAdd(that.items, item);
            that.toggleVisibility();
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.showField = function(name, groupName){
        var item = that.getField(name, groupName);
        if(item){
            item['hidden'] = false;
            cm.removeClass(item['container'], 'is-hidden');
        }
        return that;
    };

    that.hideField = function(name, groupName){
        var item = that.getField(name, groupName);
        if(item){
            item['hidden'] = true;
            cm.addClass(item['container'], 'is-hidden');
        }
        return that;
    };

    that.addButton = function(item){
        var group;
        item = cm.merge({
            'container' : cm.node('li'),
            'node' : null,
            'type' : 'primary',             // primary, secondary, success, danger, warning
            'name' : '',
            'label' : '',
            'title' : '',
            'group' : '',
            'access' : true,
            'disabled' : false,
            'hidden' : false,
            'className' : '',
            'attr' : {},
            'preventDefault' : true,
            'constructor' : false,
            'constructorParams' : {},
            'callback' : function(){}
        }, item);
        group = that.groups[item['group']];
        // Validate
        if(cm.isEmpty(item['name'])){
            item['name'] = item['label'];
        }
        // Render
        if(item['access'] && group && !group.items[item['name']]){
            // Structure
            item['node'] = cm.node('a', item['attr']);
            // Styles
            cm.addClass(item['node'], 'button');
            cm.addClass(item['node'], ['button', item['type']].join('-'));
            cm.addClass(item['node'], item['className']);
            item['disabled'] && cm.addClass(item['node'], 'button-disabled');
            item['hidden'] && cm.addClass(item['container'], 'is-hidden');
            // Label and title
            item['node'].innerHTML = item['label'];
            item['node'].title = item['title'];
            // Callbacks
            if(item['constructor']){
                cm.getConstructor(item['constructor'], function(classConstructor){
                    item['controller'] = new classConstructor(
                        cm.merge(item['constructorParams'], {
                            'node' : item['node']
                        })
                    );
                });
            }else{
                cm.addEvent(item['node'], 'click', function(e){
                    item['preventDefault'] && cm.preventDefault(e);
                    !item['disabled'] && item['callback'](e, item);
                });
            }
            cm.appendChild(item['node'], item['container']);
            cm.appendChild(item['container'], group['node']);
            group.items[item['name']] = item;
            that.items = cm.arrayAdd(that.items, item);
            that.toggleVisibility();
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.enableButton = function(name, groupName){
        var item = that.getButton(name, groupName);
        if(item){
            item['disabled'] = false;
            cm.removeClass(item['node'], 'button-disabled');
        }
        return that;
    };

    that.disableButton = function(name, groupName){
        var item = that.getButton(name, groupName);
        if(item){
            item['disabled'] = true;
            cm.addClass(item['node'], 'button-disabled');
        }
        return that;
    };

    that.showButton = function(name, groupName){
        var item = that.getButton(name, groupName);
        if(item){
            item['hidden'] = false;
            cm.removeClass(item['container'], 'is-hidden');
        }
        return that;
    };

    that.hideButton = function(name, groupName){
        var item = that.getButton(name, groupName);
        if(item){
            item['hidden'] = true;
            cm.addClass(item['container'], 'is-hidden');
        }
        return that;
    };

    that.addLabel = function(item){
        var group;
        item = cm.merge({
            'container' : cm.node('li', {'class' : 'label'}),
            'node' : null,
            'name' : '',
            'label' : '',
            'size' : null,
            'hidden' : false,
            'group' : null
        }, item);
        group = that.groups[item['group']];
        // Render
        if(group && !group.items[item['name']]){
            // Structure
            item['node'] = cm.node('div', {'innerHTML' : item['label']});
            // Styles
            item['size'] && cm.addClass(item['container'], item['size']);
            item['hidden'] && cm.addClass(item['container'], 'is-hidden');
            // Embed
            if(cm.isNode(item['node'])){
                cm.appendChild(item['node'], item['container']);
            }
            cm.appendChild(item['container'], group['node']);
            group.items[item['name']] = item;
            that.items = cm.arrayAdd(that.items, item);
            that.toggleVisibility();
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.getField = that.getButton = that.getLabel = function(name, groupName){
        var group = that.groups[groupName],
            item;
        if(group){
            item = group.items[name];
        }
        return item;
    };

    that.removeField = that.removeButton = that.removeLabel = function(name, groupName){
        var item, group;
        if(cm.isObject(arguments[0])){
            item = arguments[0];
            group = that.groups[item['group']];
        }else{
            group = that.groups[groupName];
            if(group){
                item = group.items[name];
            }
        }
        if(item){
            cm.remove(item['container']);
            delete group.items[item['name']];
            that.items = cm.arrayRemove(that.items, item);
            that.toggleVisibility();
        }
        that.triggerEvent('onProcessEnd');
        return that;
    };

    that.isEmpty = function(){
        return that.items.length === 0;
    };

    that.hide = function(){
        if(!that.isHidden){
            that.isHidden = true;
            cm.addClass(that.nodes['container'], 'is-hidden');
        }
        return that;
    };

    that.show = function(){
        if(that.isHidden){
            that.isHidden = false;
            cm.removeClass(that.nodes['container'], 'is-hidden');
        }
        return that;
    };

    that.toggleVisibility = function(){
        if(that.isEmpty()){
            that.hide();
        }else{
            that.show();
        }
        return that;
    };

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});
