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
        'onClose',
        'onReset'
    ],
    'params' : {
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'data' : [],
        'maxSingleTagLength': 255,
        'max' : 0,                                      // Not implemented
        'autocomplete' : false,
        'icons' : {
            'add' : 'icon default linked',
            'remove' : 'icon default linked'
        },
        'Com.Autocomplete' : {
            'clearOnEmpty' : false
        }
    },
    'strings' : {
        'tags' : 'Tags',
        'add' : 'Add',
        'remove' : 'Remove',
        'placeholder' : 'Add tags...'
    }
},
function(params){
    var that = this,
        nodes = {},
        tags = [],
        items = {};

    that.isDestructed = null;
    that.value = null;
    that.components = {};
    that.isAutocomplete = false;

    var init = function(){
        var sourceTags, splitTags;
        preValidateParams();
        // Init modules
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        // Render
        validateParams();
        render();
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender');
        // Set tags
        splitTags = that.params['node'].value.split(',');
        sourceTags = cm.extend(that.params['data'], splitTags);
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
        nodes['container'] = cm.node('div', {'class' : 'com__tags-input'},
            nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            nodes['inner'] = cm.node('div', {'class' : 'inner input'},
                nodes['tags'] = cm.node('div', {'class' : 'tags'})
            )
        );
        renderInput();
        // Attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Events
        cm.addEvent(nodes['container'], 'click', function(e){
            var target = cm.getEventTarget(e);
            if(!cm.isParent(nodes['tags'], target, true)){
                nodes['input'].focus();
            }
        });
        // Append
        that.embedStructure(nodes['container']);

    };

    var renderInput = function(){
        // Structure
        nodes['input'] = cm.node('input', {'type' : 'text', 'maxlength' : that.params['maxSingleTagLength'], 'class' : 'adder', 'placeholder' : that.lang('placeholder')});
        cm.appendChild(nodes['input'], nodes['inner']);
        // Autocomplete
        if(that.isAutocomplete){
            cm.getConstructor('Com.Autocomplete', function(classConstructor){
                that.components['autocomplete'] = new classConstructor(cm.merge(that.params['Com.Autocomplete'], {
                    'events' : {
                        'onClickSelect' : function(){
                            addAdderTags(true);
                        }
                    }
                }));
            });
            that.components['autocomplete'].setTarget(nodes['input']);
            that.components['autocomplete'].setInput(nodes['input']);
        }
        // Add new tag on comma
        cm.addEvent(nodes['input'], 'keypress', function(e){
            if(e.charCode === 44 || e.charCode === 59){
                cm.preventDefault(e);
                addAdderTags(true);
                that.isAutocomplete && that.components['autocomplete'].hide();
            }
        });
        // Add new tag on enter or escape
        cm.addEvent(nodes['input'], 'keydown', function(e){
            if(cm.inArray(['Enter', 'Escape'], e.code)){
                cm.preventDefault(e);
                addAdderTags(true);
                that.isAutocomplete && that.components['autocomplete'].hide();
            }
        });
        cm.addEvent(nodes['input'], 'focus', function(){
            cm.addClass(nodes['container'], 'active');
            cm.addClass(nodes['inner'], 'input-focus');
        });
        cm.addEvent(nodes['input'], 'blur', function(){
            addAdderTags(true);
            cm.removeClass(nodes['container'], 'active');
            cm.removeClass(nodes['inner'], 'input-focus');
        });
    };

    var addAdderTags = function(execute){
        var sourceTags = nodes['input'].value.split(',');
        cm.forEach(sourceTags, function(tag){
            addTag(tag, execute);
        });
        nodes['input'].value = '';
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
        item['container'] = cm.node('div', {'class' : 'item'},
            cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'text', 'title' : tag}, tag),
                item['button'] = cm.node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove')})
            )
        );
        item['anim'] = new cm.Animation(item['container']);
        // Append
        cm.appendChild(item['container'], nodes['tags']);
        // Add click event on "Remove Tag" button
        cm.addEvent(item['button'], 'click', function(){
            removeTag(item);
        });
        // Push to global array
        items[tag] = item;
    };

    var removeTag = function(item){
        // Remove tag from data
        tags = cm.arrayRemove(tags, item['tag']);
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
        // Hide
        cm.remove(item['container']);
        item = null;
    };

    var setHiddenInputData = function(){
        that.value = tags.join(',');
        nodes['hidden'].value = that.value;
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(){
        return !cm.isEmpty(that.value) ? that.value : '';
    };

    that.set = function(value){
        that.add(value);
        return that;
    };

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

    that.reset = function(){
        cm.forEach(items, function(item){
            removeTag(item, true);
        });
        that.triggerEvent('onReset');
        return that;
    };

    that.getAutocomplete = function(){
        return that.components['autocomplete'];
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('tags', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.TagsInput'
});