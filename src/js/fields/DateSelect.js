cm.define('Com.DateSelect', {
    'modules' : [
        'Params',
        'DataConfig',
        'Langs',
        'Events',
        'Structure',
        'Stack'
    ],
    'events' : [
        'onSelect',
        'onChange'
    ],
    'params' : {
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'name' : '',
        'embedStructure' : 'replace',
        'container' : null,
        'fields' : ['year', 'month', 'day'],
        'format' : 'cm._config.dateFormat',
        'startYear' : 1950,                             // number | current
        'endYear' : 'current + 10',                     // number | current
        'renderSelectsInBody' : true,
        'fieldSizes' : {
            'year' : 'small',
            'month' : 'medium',
            'day' : 'x-small'
        }
    },
    'strings' : {
        'Day' : 'Day',
        'Month' : 'Month',
        'Year' : 'Year',
        'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {},
        defaultDate = {
            'day' : '00',
            'month' : '00',
            'year' : '0000'
        };

    that.isDestructed = false;
    that.previous = cm.clone(defaultDate);
    that.selected = cm.clone(defaultDate);

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(nodes['container']);
        // Set selected date
        set(that.params['node'].value);
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
        if(that.params['value'] === 'now'){
            that.params['value'] = new Date();
        }
        if(/current/.test(that.params['startYear'])){
            that.params['startYear'] = eval(cm.strReplace(that.params['startYear'], {'current' : new Date().getFullYear()}));
        }
        if(/current/.test(that.params['endYear'])){
            that.params['endYear'] = eval(cm.strReplace(that.params['endYear'], {'current' : new Date().getFullYear()}));
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__dateselect'},
            nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            cm.node('div', {'class' : 'pt__toolbar bottom'},
                cm.node('div', {'class' : 'inner clear'},
                    nodes['fields'] = cm.node('ul', {'class' : 'group'})
                )
            )
        );
        renderFields();
        // Attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Append
        that.embedStructure(nodes['container']);
    };

    var renderFields = function(){
        cm.forEach(that.params['fields'], function(item){
            switch(item){
                case 'year':
                    renderYearField();
                    break;
                case 'month':
                    renderMonthField();
                    break;
                case 'day':
                    renderDayField();
                    break;
            }
        });
    };

    var renderYearField = function(){
        // Structure
        nodes['year'] = cm.node('li', {'class' : 'is-field'});
        cm.addClass(nodes['year'], that.params['fieldSizes']['year']);
        cm.appendChild(nodes['year'], nodes['fields']);
        // Render component
        var data = [
            {'value' : '0000', 'text' : that.lang('Year')}
        ], i;
        for(i = that.params['endYear']; i >= that.params['startYear']; i--){
            data.push({'value' : i, 'text' : i});
        }
        components['year'] = new Com.Select({
            'container' : nodes['year'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
            'events' : {
                'onChange' : function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['year'] = item;
                    setMisc(true);
                }
            }
        });
    };

    var renderMonthField = function(){
        // Structure
        nodes['month'] = cm.node('li', {'class' : 'is-field'});
        cm.addClass(nodes['month'], that.params['fieldSizes']['month']);
        cm.appendChild(nodes['month'], nodes['fields']);
        // Render component
        var data = [
            {'value' : '00', 'text' : that.lang('Month')}
        ];
        cm.forEach(that.lang('months'), function(month, i){
            data.push({'value' : cm.addLeadZero(parseInt(i + 1)), 'text' : month});
        });
        components['month'] = new Com.Select({
            'container' : nodes['month'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
            'events' : {
                'onChange' : function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['month'] = item;
                    setMisc(true);
                }
            }
        });
    };

    var renderDayField = function(){
        // Structure
        nodes['day'] = cm.node('li', {'class' : 'is-field'});
        cm.addClass(nodes['day'], that.params['fieldSizes']['day']);
        cm.appendChild(nodes['day'], nodes['fields']);
        // Render component
        var data = [
            {'value' : '00', 'text' : that.lang('Day')}
        ], i;
        for(i = 1; i <= 31; i++){
            data.push({'value' : cm.addLeadZero(i), 'text' : i});
        }
        components['day'] = new Com.Select({
            'container' : nodes['day'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
            'events' : {
                'onChange' :  function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['day'] = item;
                    setMisc(true);
                }
            }
        });
    };

    var set = function(str, execute){
        that.previous = cm.clone(that.selected);
        if(!str || str == toStr(defaultDate)){
            that.selected = cm.clone(defaultDate);
        }else{
            if(str instanceof Date){
                that.selected = fromStr(cm.parseDate(str));
            }else{
                that.selected = fromStr(str);
            }
        }
        components['day'] && components['day'].set(that.selected['day'], false);
        components['month'] && components['month'].set(that.selected['month'], false);
        components['year'] && components['year'].set(that.selected['year'], false);
        setMisc(execute);
    };

    var setMisc = function(execute){
        nodes['hidden'].value = toStr(that.selected);
        if(execute){
            // API onSelect event
            that.triggerEvent('onSelect', toStr(that.selected));
            // API onChange event
            if(toStr(that.selected) != toStr(that.previous)){
                that.triggerEvent('onChange', toStr(that.selected));
            }
        }
    };

    var fromStr = function(str, format){
        var o = {},
            convertFormats = {
                '%Y' : 'YYYY',
                '%m' : 'mm',
                '%d' : 'dd'
            },
            formats = {
                'YYYY' : function(value){
                    o['year'] = value;
                },
                'mm' : function(value){
                    o['month'] = value;
                },
                'dd' : function(value){
                    o['day'] = value;
                }
            },
            fromIndex = 0;
        format = format || that.params['format'];
        // Parse
        cm.forEach(convertFormats, function(item, key){
            format = format.replace(key, item);
        });
        cm.forEach(formats, function(item, key){
            fromIndex = format.indexOf(key);
            while(fromIndex != -1){
                item(str.substr(fromIndex, key.length));
                fromIndex = format.indexOf(key, fromIndex + 1);
            }
        });
        return o;
    };

    var toStr = function(o, format){
        var str = format || that.params['format'],
            formats = function(o){
                return {
                    '%Y' : function(){
                        return o['year'];
                    },
                    '%m' : function(){
                        return o['month'];
                    },
                    '%d' : function(){
                        return o['day'];
                    }
                };
            };
        cm.forEach(formats(o), function(item, key){
            str = str.replace(key, item);
        });
        return str;
    };

    /* ******* PUBLIC ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(format){
        format = format || that.params['format'];
        return toStr(that.selected, format);
    };

    that.getDate = function(){
        return that.selected;
    };

    that.set = function(str){
        set(str, true);
        return that;
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('date-select', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.DateSelect'
});
