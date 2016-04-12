cm.define('Com.TagsInput', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'require' : [
        'Com.Autocomplete'
    ],
    'events' : [
        'onRender',
        'onAdd',
        'onRemove',
        'onChange',
        'onOpen',
        'onClose'
    ],
    'params' : {
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'data' : [],
        'maxSingleTagLength': 255,
        'autocomplete' : false,
        'icons' : {
            'add' : 'icon default linked',
            'remove' : 'icon default linked'
        },
        'langs' : {
            'tags' : 'Tags',
            'add' : 'Add Tag',
            'remove' : 'Remove Tag'
        },
        'Com.Autocomplete' : {
            'clearOnEmpty' : false
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        tags = [],
        items = {},
        isOpen = false;

    that.components = {};
    that.isAutocomplete = false;

    var init = function(){
        var sourceTags;
        preValidateParams();
        // Init modules
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        // Render
        validateParams();
        render();
        setLogic();
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender');
        // Set tags
        sourceTags = that.params['data'].concat(
            that.params['node'].value.split(',')
        );
        cm.forEach(sourceTags, function(tag){
            addTag(tag);
        });
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.isAutocomplete = that.params['autocomplete'];
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__tags-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render add button
        renderAddButton();
        // Attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Append
        that.embedStructure(nodes['container']);

    };

    var setLogic = function(){
        // Autocomplete
        cm.getConstructor('Com.Autocomplete', function(classConstructor){
            that.components['autocomplete'] = new classConstructor(
                cm.merge(that.params['Com.Autocomplete'], {
                    'events' : {
                        'onClickSelect' : function(){
                            addAdderTags(true);
                        }
                    }
                })
            );
        });
    };

    var renderAddButton = function(){
        nodes['inner'].appendChild(
            nodes['addButtonContainer'] = cm.Node('div', {'class' : 'item'},
                nodes['addButton'] = cm.Node('div', {'class' : that.params['icons']['add'], 'title' : that.lang('add')})
            )
        );
        // Add event on "Add Tag" button
        cm.addEvent(nodes['addButton'], 'click', openAdder);
    };

    var openAdder = function(){
        var item = {};
        if(!isOpen){
            isOpen = true;
            // Structure
            item['container'] = cm.Node('div', {'class' : 'item adder'},
                item['input'] = cm.Node('input', {'type' : 'text', 'maxlength' : that.params['maxSingleTagLength'], 'class' : 'input'})
            );
            cm.insertBefore(item['container'], nodes['addButtonContainer']);
            // Show
            item['anim'] = new cm.Animation(item['container']);
            item['anim'].go({'style' : {'width' : [cm.getRealWidth(item['container']), 'px'].join(''), 'opacity' : 1}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
                item['container'].style.overflow = 'visible';
                item['input'].focus();
                // API onOpen Event
                that.triggerEvent('onOpen');
            }});
            // Bind autocomplete
            if(that.isAutocomplete){
                that.components['autocomplete'].setTarget(item['input']);
                that.components['autocomplete'].setInput(item['input']);
            }
            // Set new tag on enter or on comma
            cm.addEvent(item['input'], 'keypress', function(e){
                e = cm.getEvent(e);
                if(e.keyCode == 13 || e.charCode == 44){
                    cm.preventDefault(e);
                    addAdderTags(true);
                    that.isAutocomplete && that.components['autocomplete'].hide();
                }
                if(e.keyCode == 27){
                    cm.preventDefault(e);
                    addAdderTags(true);
                    closeAdder(nodes['adder']);
                }
            });
            // Hide adder on document click
            cm.addEvent(document, 'mousedown', bodyEvent);
            // Add to nodes array
            nodes['adder'] = item;
        }else{
            addAdderTags(true);
        }
    };

    var closeAdder = function(item){
        cm.removeEvent(document, 'mousedown', bodyEvent);
        nodes['adder']['input'].blur();
        that.isAutocomplete && that.components['autocomplete'].hide();
        item['container'].style.overflow = 'hidden';
        item['anim'].go({'style' : {'width' : '0px', 'opacity' : 0}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
            cm.remove(item['container']);
            nodes['adder'] = null;
            isOpen = false;
            // API onClose Event
            that.triggerEvent('onClose');
        }});
    };

    var addAdderTags = function(execute){
        var sourceTags = nodes['adder']['input'].value.split(',');
        cm.forEach(sourceTags, function(tag){
            addTag(tag, execute);
        });
        nodes['adder']['input'].value = '';
        nodes['adder']['input'].focus();
        that.isAutocomplete && that.components['autocomplete'].clear();
    };

    var addTag = function(tag, execute){
        tag = tag.trim();
        if(tag && tag.length && !/^[\s]*$/.test(tag) && !cm.inArray(tags, tag)){
            tags.push(tag);
            renderTag(tag);
            setHiddenInputData();
            // Execute events
            if(execute){
                // API onChange Event
                that.triggerEvent('onChange', {'tag' : tag});
                // API onAdd Event
                that.triggerEvent('onAdd', {'tag' : tag});
            }
        }
    };

    var renderTag = function(tag){
        var item = {
            'tag' : tag
        };
        // Structure
        item['container'] = cm.Node('div', {'class' : 'item'},
            cm.Node('div', {'class' : 'text', 'title' : tag}, tag),
            item['button'] = cm.Node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove')})
        );
        item['anim'] = new cm.Animation(item['container']);
        // Append
        if(isOpen){
            cm.addClass(item['container'], 'closed');
            cm.insertBefore(item['container'], nodes['adder']['container']);
            // Show
            item['anim'].go({'style' : {'width' : [cm.getRealWidth(item['container']), 'px'].join(''), 'opacity' : 1}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
                cm.removeClass(item['container'], 'closed');
            }});
        }else{
            cm.insertBefore(item['container'], nodes['addButtonContainer']);
        }
        // Add click event on "Remove Tag" button
        cm.addEvent(item['button'], 'click', function(){
            if(isOpen){
                nodes['adder']['input'].focus();
            }
            removeTag(item);
        });
        // Push to global array
        items[tag] = item;
    };

    var removeTag = function(item){
        // Remove tag from data
        tags = tags.filter(function(tag){
            return item['tag'] != tag;
        });
        delete items[item['tag']];
        setHiddenInputData();
        // API onChange Event
        that.triggerEvent('onChange', {
            'tag' : item['tag']
        });
        // API onRemove Event
        that.triggerEvent('onRemove', {
            'tag' : item['tag']
        });
        // Animate
        item['anim'].go({'style' : {'width' : '0px', 'opacity' : 0}, 'duration' : 200, 'anim' : 'smooth', 'onStop' : function(){
            cm.remove(item['container']);
            item = null;
        }});
    };

    var setHiddenInputData = function(){
        nodes['hidden'].value = tags.join(',');
    };

    var bodyEvent = function(e){
        if(isOpen){
            e = cm.getEvent(e);
            var target = cm.getEventTarget(e);
            if(!cm.isParent(nodes['container'], target, true) && !that.components['autocomplete'].isOwnNode(target)){
                addAdderTags(true);
                closeAdder(nodes['adder']);
            }
        }
    };

    /* ******* MAIN ******* */

    that.add = function(tag /* or tags comma separated or array */){
        var sourceTags;
        if(!tag){
            sourceTags = [];
        }else if(cm.isArray(tag)){
            sourceTags = tag;
        }else{
            sourceTags = tag.split(',');
        }
        cm.forEach(sourceTags, function(tag){
            addTag(tag, true);
        });
        return that;
    };

    that.remove = function(tag){
        var sourceTags;
        if(!tag){
            sourceTags = [];
        }else if(cm.isArray(tag)){
            sourceTags = tag;
        }else{
            sourceTags = tag.split(',');
        }
        cm.forEach(sourceTags, function(tag){
            if(cm.inArray(tags, tag)){
                removeTag(items[tag]);
            }
        });
        return that;
    };

    that.getAutocomplete = function(){
        return that.components['autocomplete'];
    };

    init();
});