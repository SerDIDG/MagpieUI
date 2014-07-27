Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

cm.define('Com.Datepicker', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Langs'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'container' : false,
        'input' : cm.Node('input', {'type' : 'text'}),
        'renderInBody' : true,
        'placeholder' : '',
        'format' : cm._config['displayDateFormat'],
        'saveFormat' : cm._config['dateFormat'],
        'startYear' : 1950,
        'endYear' : new Date().getFullYear() + 10,
        'startWeekDay' : 0,
        'showPlaceholder' : true,
        'showTodayButton' : true,
        'showClearButton' : false,
        'showTitleTag' : true,
        'title' : false,
        'menuMargin' : 3,
        'selected' : 0,
        'icons' : {
            'datepicker' : 'icon default linked',
            'clear' : 'icon default linked'
        },
        'langs' : {
            'days' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            'clearButtonTitle' : 'Clear datepicker',
            'todayButton' : 'Today'
        }
    }
},
function(params){
    var that = this,
        nodes = {
            'calendar' : {},
            'menu' : {}
        },
        components = {},
        
        today = new Date(),
        currentSelectedDate,
        previousSelectedDate;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['input']);
        validateParams();
        render();
        setMiscEvents();
        // Set selected date
        if(that.params['selected']){
            set(that.params['selected']);
        }else{
            set(that.params['input'].value);
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['input']) && cm.inDOM(that.params['input'])){
            that.params['placeholder'] = that.params['input'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['title'] = that.params['input'].getAttribute('title') || that.params['title'];
        }
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com-datepicker-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            cm.Node('div', {'class' : 'form-field has-icon-right'},
                nodes['input'] = cm.Node('input', {'type' : 'text'}),
                nodes['icon'] = cm.Node('div', {'class' : that.params['icons']['datepicker']})
            ),
            nodes['menuContainer'] = cm.Node('div',
                nodes['calendarContainer'] = cm.Node('div')
            )
        );
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTag'] && that.params['title']){
            nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['input'].id){
            nodes['container'].id = that.params['input'].id;
        }
        // Set hidden input attributes
        if(that.params['input'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', that.params['input'].getAttribute('name'));
        }
        // Placeholder
        if(that.params['showPlaceholder'] && that.params['placeholder']){
            nodes['input'].setAttribute('placeholder', that.params['placeholder']);
        }
        // Clear Button
        if(that.params['showClearButton']){
            cm.addClass(nodes['container'], 'has-clear-button');
            nodes['container'].appendChild(
                nodes['clearButton'] = cm.Node('div', {'class' : that.params['icons']['clear'], 'title' : that.params['langs']['clearButtonTitle']})
            );
        }
        // Today Button
        if(that.params['showTodayButton']){
            nodes['menuContainer'].appendChild(
                nodes['todayButton'] = cm.Node('div', {'class' : 'button today'}, that.params['langs']['todayButton'])
            );
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }else if(that.params['input'].parentNode){
            cm.insertBefore(nodes['container'], that.params['input']);
        }
        cm.remove(that.params['input']);
    };

    var setMiscEvents = function(){
        // Add events on input to makes him clear himself when user wants that
        cm.addEvent(nodes['input'], 'keydown', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            if(e.keyCode == 8){
                set(0);
                components['menu'].hide(false);
                onChange();
            }
        });
        // Clear Button
        if(that.params['showClearButton']){
            cm.addEvent(nodes['clearButton'], 'click', function(){
                set(0);
                components['menu'].hide(false);
                onChange();
            });
        }
        // Today Button
        if(that.params['showTodayButton']){
            cm.addEvent(nodes['todayButton'], 'click', function(){
                set(today, true);
                components['menu'].hide(false);
            });
        }
        // Render tooltip
        components['menu'] = new Com.Tooltip({
            'container' : that.params['renderInBody'] ? document.body : nodes['container'],
            'className' : 'com-datepicker-tooltip',
            'top' : ['targetHeight', that.params['menuMargin']].join('+'),
            'content' : nodes['menuContainer'],
            'target' : nodes['container'],
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'events' : {
                'onShowStart' : show,
                'onHideStart' : hide
            }
        });
        nodes['menu'] = components['menu'].getNodes();
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'container' : nodes['calendarContainer'],
            'renderSelectsInBody' : false,
            'className' : 'com-datepicker-calendar',
            'startYear' : that.params['startYear'],
            'endYear' : that.params['endYear'],
            'startWeekDay' : that.params['startWeekDay'],
            'langs' : that.params['langs'],
            'renderMonthOnInit' : false,
            'events' : {
                'onMonthRender' : markSelectedDay,
                'onDayClick' : function(calendar, params){
                    set(params['date'], true);
                    components['menu'].hide(false);
                }
            }
        });
        // Trigger events
        that.triggerEvent('onRender', currentSelectedDate);
    };

    var show = function(){
        // Render calendar month
        if(!currentSelectedDate){
            today = new Date();
            components['calendar'].set(today.getFullYear(), today.getMonth()).renderMonth();
        }else{
            components['calendar'].set(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth()).renderMonth();
        }
    };

    var hide = function(){
    };

    var set = function(str, execute){
        previousSelectedDate = currentSelectedDate;
        if(!str || new RegExp(cm.dateFormat(false, that.params['saveFormat'], that.params['langs'])).test(str)){
            currentSelectedDate = null;
            nodes['input'].value = '';
            nodes['hidden'].value = cm.dateFormat(false, that.params['saveFormat'], that.params['langs']);
        }else{
            if(typeof str == 'object'){
                currentSelectedDate = str;
            }else{
                str = str.split(' ')[0].split('-');
                currentSelectedDate = new Date(str[0], (parseInt(str[1], 10) - 1), str[2]);
            }
            nodes['input'].value = cm.dateFormat(currentSelectedDate, that.params['format'], that.params['langs']);
            nodes['hidden'].value = cm.dateFormat(currentSelectedDate, that.params['saveFormat'], that.params['langs']);
        }
        if(execute){
            that.triggerEvent('onSelect', currentSelectedDate);
            onChange();
        }
    };

    var markSelectedDay = function(calendar, params){
        if(currentSelectedDate && params['year'] == currentSelectedDate.getFullYear() && params['month'] == currentSelectedDate.getMonth()){
            cm.addClass(params['days'][currentSelectedDate.getDate()]['container'], 'selected');
        }
    };
    
    var onChange = function(){
        if(!previousSelectedDate || (!currentSelectedDate && previousSelectedDate) || (currentSelectedDate.toString() !== previousSelectedDate.toString())){
            that.triggerEvent('onChange', currentSelectedDate);
        }
    };

    /* ******* MAIN ******* */

    that.get = function(format){
        return cm.dateFormat(currentSelectedDate, (format || that.params['saveFormat']), that.params['langs']);
    };

    that.set = function(str){
        set(str, true);
        return that;
    };

    that.getDate = function(){
        return currentSelectedDate || '';
    };

    that.parseDate = function(o, format){
        return cm.dateFormat(o, (format || that.params['saveFormat']), that.params['langs']);
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});