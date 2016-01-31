Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

cm.define('Com.Datepicker', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Structure',
        'Langs',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onClear',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'input' : null,                      // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'renderInBody' : true,
        'format' : 'cm._config.dateFormat',
        'displayFormat' : 'cm._config.displayDateFormat',
        'isDateTime' : false,
        'dateTimeFormat' : 'cm._config.dateTimeFormat',
        'displayDateTimeFormat' : 'cm._config.displayDateTimeFormat',
        'minutesInterval' : 1,
        'startYear' : 1950,                                                 // number | current
        'endYear' : 'current + 10',                                         // number | current
        'startWeekDay' : 0,
        'showTodayButton' : true,
        'showClearButton' : false,
        'showTitleTooltip' : true,
        'showPlaceholder' : true,
        'title' : '',
        'placeholder' : '',
        'menuMargin' : 4,
        'value' : 0,
        'disabled' : false,
        'icons' : {
            'datepicker' : 'icon default linked',
            'clear' : 'icon default linked'
        },
        'langs' : {
            'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            'Clear date' : 'Clear date',
            'Today' : 'Today',
            'Now' : 'Now',
            'Time' : 'Time:'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__datepicker__tooltip',
            'top' : 'cm._config.tooltipTop'
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {};

    that.date = null;
    that.value = null;
    that.previousValue = null;
    that.format = null;
    that.displayFormat = null;
    that.disabled = false;

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
        // Add to stack
        that.addToStack(nodes['container']);
        // Set selected date
        if(that.params['value']){
            that.set(that.params['value'], that.format, false);
        }else{
            that.set(that.params['node'].value, that.format, false);
        }
        // Trigger events
        that.triggerEvent('onRender', that.value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['disabled'] = that.params['node'].disabled || that.params['disabled'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        if(that.params['value'] == 'now'){
            that.params['value'] = new Date();
        }
        if(/current/.test(that.params['startYear'])){
            that.params['startYear'] = eval(cm.strReplace(that.params['startYear'], {'current' : new Date().getFullYear()}));
        }
        if(/current/.test(that.params['endYear'])){
            that.params['endYear'] = eval(cm.strReplace(that.params['endYear'], {'current' : new Date().getFullYear()}));
        }
        that.format = that.params['isDateTime']? that.params['dateTimeFormat'] : that.params['format'];
        that.displayFormat = that.params['isDateTime']? that.params['displayDateTimeFormat'] : that.params['displayFormat'];
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com__datepicker-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['target'] = cm.Node('div', {'class' : 'form-field has-icon-right'},
                nodes['input'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'}),
                nodes['icon'] = cm.Node('div', {'class' : that.params['icons']['datepicker']})
            ),
            nodes['menuContainer'] = cm.Node('div', {'class' : 'form'},
                nodes['calendarContainer'] = cm.Node('div', {'class' : 'calendar-holder'})
            )
        );
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTooltip'] && !cm.isEmpty(that.params['title'])){
            nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['node'].id){
            nodes['container'].id = that.params['node'].id;
        }
        // Set hidden input attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Placeholder
        if(that.params['showPlaceholder'] && !cm.isEmpty(that.params['placeholder'])){
            nodes['input'].setAttribute('placeholder', that.params['placeholder']);
        }
        // Clear Button
        if(that.params['showClearButton']){
            cm.addClass(nodes['container'], 'has-clear-button');
            nodes['container'].appendChild(
                nodes['clearButton'] = cm.Node('div', {'class' : that.params['icons']['clear'], 'title' : that.lang('Clear date')})
            );
        }
        // Today / Now Button
        if(that.params['showTodayButton']){
            nodes['menuContainer'].appendChild(
                nodes['todayButton'] = cm.Node('div', {'class' : 'button today is-wide'}, that.lang(that.params['isDateTime']? 'Now' : 'Today'))
            );
        }
        // Time Select
        if(that.params['isDateTime']){
            nodes['timeHolder'] = cm.Node('div', {'class' : 'time-holder'},
                cm.Node('dl', {'class' : 'form-box'},
                    cm.Node('dt', that.lang('Time')),
                    nodes['timeContainer'] = cm.Node('dd')
                )
            );
            cm.insertAfter(nodes['timeHolder'], nodes['calendarContainer']);
        }
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes['container']);
    };

    var setLogic = function(){
        // Add events on input to makes him clear himself when user wants that
        cm.addEvent(nodes['input'], 'keydown', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            if(e.keyCode == 8){
                that.clear();
                components['menu'].hide(false);
            }
        });
        // Clear Button
        if(that.params['showClearButton']){
            cm.addEvent(nodes['clearButton'], 'click', function(){
                that.clear();
                components['menu'].hide(false);
            });
        }
        // Today / Now Button
        if(that.params['showTodayButton']){
            cm.addEvent(nodes['todayButton'], 'click', function(){
                that.set(new Date());
                components['menu'].hide(false);
            });
        }
        // Render tooltip
        components['menu'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['renderInBody'] ? document.body : nodes['container'],
                'content' : nodes['menuContainer'],
                'target' : nodes['target'],
                'events' : {
                    'onShowStart' : show,
                    'onHideStart' : hide
                }
            })
        );
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'node' : nodes['calendarContainer'],
            'renderSelectsInBody' : false,
            'className' : 'com__datepicker-calendar',
            'startYear' : that.params['startYear'],
            'endYear' : that.params['endYear'],
            'startWeekDay' : that.params['startWeekDay'],
            'langs' : that.params['langs'],
            'renderMonthOnInit' : false,
            'events' : {
                'onMonthRender' : function(){
                    if(that.date){
                        components['calendar'].selectDay(that.date);
                    }
                },
                'onDayClick' : function(calendar, params){
                    if(!that.date){
                        that.date = new Date();
                    }
                    components['calendar'].unSelectDay(that.date);
                    that.date.setDate(params['day']);
                    components['calendar'].selectDay(that.date);
                    set(true);
                    if(!that.params['isDateTime']){
                        components['menu'].hide(false);
                    }
                }
            }
        });
        // Render Time Select
        if(that.params['isDateTime']){
            components['time'] = new Com.TimeSelect({
                    'container' : nodes['timeContainer'],
                    'renderSelectsInBody' : false,
                    'minutesInterval' : that.params['minutesInterval']
                })
                .onChange(function(){
                    if(!that.date){
                        that.date = new Date();
                    }
                    components['calendar'].set(that.date.getFullYear(), that.date.getMonth(), false);
                    components['calendar'].selectDay(that.date);
                    set(true);
                });
        }

        // Enable / Disable
        if(that.disabled){
            that.disable();
        }else{
            that.enable();
        }
    };

    var show = function(){
        // Render calendar month
        if(that.date){
            components['calendar'].set(that.date.getFullYear(), that.date.getMonth())
        }
        components['calendar'].renderMonth();
        // Set classes
        cm.addClass(nodes['container'], 'active');
        that.triggerEvent('onFocus', that.value);
    };

    var hide = function(){
        nodes['input'].blur();
        cm.removeClass(nodes['container'], 'active');
        that.triggerEvent('onBlur', that.value);
    };

    var set = function(triggerEvents){
        that.previousValue = that.value;
        if(that.date){
            // Set date
            that.date.setFullYear(components['calendar'].getFullYear());
            that.date.setMonth(components['calendar'].getMonth());
            // Set time
            if(that.params['isDateTime']){
                that.date.setHours(components['time'].getHours());
                that.date.setMinutes(components['time'].getMinutes());
                that.date.setSeconds(0);
            }
            // Set value
            that.value = cm.dateFormat(that.date, that.format, that.lang());
            nodes['input'].value = cm.dateFormat(that.date, that.displayFormat, that.lang());
            nodes['hidden'].value = that.value;
        }else{
            that.value = cm.dateFormat(false, that.format, that.lang());
            nodes['input'].value = '';
            nodes['hidden'].value = cm.dateFormat(false, that.format, that.lang());
        }
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
    };
    
    var onChange = function(){
        if(!that.previousValue || (!that.value && that.previousValue) || (that.value != that.previousValue)){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* ******* MAIN ******* */

    that.get = function(format){
        format = typeof format != 'undefined'? format : that.format;
        return cm.dateFormat(that.date, format, that.lang());
    };

    that.getDate = function(){
        return that.date;
    };

    that.getFullYear = function(){
        return that.date? that.date.getFullYear() : null;
    };

    that.getMonth = function(){
        return that.date? that.date.getMonth() : null;
    };

    that.getDay = function(){
        return that.date? that.date.getDate() : null;
    };

    that.getHours = function(){
        return that.date? that.date.getHours() : null;
    };

    that.getMinutes = function(){
        return that.date? that.date.getMinutes() : null;
    };

    that.set = function(str, format, triggerEvents){
        format = typeof format != 'undefined'? format : that.format;
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Get date
        if(cm.isEmpty(str) || typeof str == 'string' && new RegExp(cm.dateFormat(false, format, that.lang())).test(str)){
            that.clear();
            return that;
        }else if(typeof str == 'object'){
            that.date = str;
        }else{
            that.date = cm.parseDate(str, format);
        }
        // Set parameters into components
        components['calendar'].set(that.date.getFullYear(), that.date.getMonth(), false);
        if(that.params['isDateTime']){
            components['time'].set(that.date, null, false);
        }
        // Set date
        set(triggerEvents);
        return that;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Clear date
        that.date = null;
        // Clear components
        components['calendar'].clear(false);
        if(that.params['isDateTime']){
            components['time'].clear(false);
        }
        // Set date
        set(false);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            onChange();
        }
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(nodes['container'], 'disabled');
        nodes['input'].disabled = true;
        components['menu'].disable();
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        cm.removeClass(nodes['container'], 'disabled');
        nodes['input'].disabled = false;
        components['menu'].enable();
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});