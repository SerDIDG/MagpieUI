cm.define('Com.CalendarEvents', {
    'modules' : [
        'Params',
        'Structure',
        'Stack',
        'DataConfig',
        'Langs'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'embedStructure' : 'append',
        'name' : '',
        'data' : {},
        'format' : 'cm._config.displayDateFormat',
        'startYear' : 1950,
        'endYear' : new Date().getFullYear() + 10,
        'startWeekDay' : 0,
        'target' : '_blank',
        'Com.Tooltip' : {
            'className' : 'module__calendar-events__tooltip'
        }
    },
    'strings' : {
        'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.getDataConfig(that.params['node']);
        // Render
        render();
        setMiscEvents();
        that.addToStack(that.nodes['container']);
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'module__calendar-events'});
        // Render calendar
        that.components['calendar'] = new Com.Calendar({
            'node' : that.nodes['container'],
            'renderMonthOnInit' : false,
            'startYear' : that.params['startYear'],
            'endYear' : that.params['endYear'],
            'startWeekDay' : that.params['startWeekDay'],
            'langs' : that.params['langs']
        });
        // Render tooltip
        that.components['tooltip'] = new Com.Tooltip(that.params['Com.Tooltip']);
        // Append
        that.embedStructure(that.nodes['container']);
    };

    var setMiscEvents = function(){
        // Add events on calendars day
        that.components['calendar']
            .addEvent('onDayOver', renderTooltip)
            .addEvent('onMonthRender', markMonthDays)
            .renderMonth();
    };

    var markMonthDays = function(calendar, params){
        var data, day;
        if((data = that.params['data'][params['year']]) && (data = data[(params['month'] + 1)])){
            cm.forEach(data, function(value, key){
                if(day = params['days'][key]){
                    cm.addClass(day['container'], 'active');
                }
            });
        }
    };

    var renderTooltip = function(calendar, params){
        var data,
            myNodes = {};

        if((data = that.params['data'][params['year']]) && (data = data[(params['month'] + 1)]) && (data = data[params['day']])){
            // Structure
            myNodes['content'] = cm.node('div', {'class' : 'pt__listing module__calendar-events-listing'},
                myNodes['list'] = cm.node('ul', {'class' : 'list'})
            );
            // Foreach events
            cm.forEach(data, function(value){
                myNodes['list'].appendChild(
                    cm.node('li',
                        cm.node('a', {'href' : value['url'], 'target' : that.params['target']}, value['title'])
                    )
                );
            });
            // Show tooltip
            that.components['tooltip']
                .setTarget(params['node'])
                .setTitle(cm.dateFormat(params['date'], that.params['format'], that.lang()))
                .setContent(myNodes['content'])
                .show();
        }
    };

    /* ******* MAIN ******* */

    that.addData = function(data){
        that.params['data'] = cm.merge(that.params['data'], data);
        that.components['calendar'].renderMonth();
        return that;
    };

    that.replaceData = function(data){
        that.params['data'] = data;
        that.components['calendar'].renderMonth();
        return that;
    };

    init();
});