// ToDO: rewrite

Com['UA'] = {
    'hash' : {'ie':'MSIE','edge':'Edge','opera':'Opera','ff':'Firefox','firefox':'Firefox','webkit':'AppleWebKit','safari':'Safari','chrome':'Chrome','steam':'Steam'},
    'fullname' : {'Edge':'Microsoft Edge','MSIE':'Microsoft Internet Explorer','Firefox':'Mozilla Firefox','Chrome':'Google Chrome','Safari':'Apple Safari','Opera':'Opera','Opera Mini':'Opera Mini','Opera Mobile':'Opera Mobile','IE Mobile':'Internet Explorer Mobile','Steam':'Valve Steam Game Overlay'},
    'os' : {
        'Windows':{'NT 5.0':'2000','NT 5.1':'XP','NT 5.2':'Server 2003','NT 6.0':'Vista','NT 6.1':'7','NT 6.2':'8','NT 6.3':'8.1','NT 10.0':'10'},
        'Mac OSX':{'10.0':'Cheetah','10.1':'Puma','10.2':'Jaguar','10.3':'Panther','10.4':'Tiger','10.5':'Leopard','10.6':'Snow Leopard','10.7':'Lion','10.8':'Mountain Lion','10.9':'Mavericks','10.10':'Yosemite','10.11':'El Capitan'}
    },
    'str' : navigator.userAgent,
    'get' : function(str){
        var that = this,
            arr = {};
        str = (str)? str : that.str;
        // Check browser
        if(str.indexOf('IEMobile') > -1){
            arr['browser'] = 'IE Mobile';
            arr['hash'] = 'ie-mobile';
            arr['engine'] = 'Trident';
            arr['type'] = 'mobile';
            arr['full_version'] = str.replace(/^(?:.+)(?:IEMobile)(?:[\s\/]{0,})([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1].slice(0, 1) : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('MSIE') > -1 || str.indexOf('Trident') > -1){
            arr['browser'] = 'MSIE';
            arr['hash'] = 'ie';
            arr['engine'] = 'Trident';
            if(str.indexOf('MSIE') > -1){
                arr['full_version'] = str.replace(/^(?:.+)(?:MSIE)(?:[\s\/]{0,})([0-9\.]{1,})(?:.+)$/, '$1');
            }else{
                arr['full_version'] = str.replace(/^(?:.+)(?:rv:)(?:[\s\/]{0,})([0-9\.]{1,})(?:.+)$/, '$1');
            }
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1].slice(0, 1) : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Opera Mobi') > -1){
            arr['browser'] = 'Opera Mobile';
            arr['hash'] = 'opera-mobile';
            arr['engine'] = 'Presto';
            arr['type'] = 'mobile';
            arr['version'] = arr['full_version'] = (str.indexOf('Version') > -1)? str.replace(/^(?:.+)(?:Version\/)([0-9\.]{1,})$/, '$1') : '';
            arr['short_version'] = arr['version'].split('.')[0];
        }else if(str.indexOf('Opera Mini') > -1){
            arr['browser'] = 'Opera Mini';
            arr['hash'] = 'opera-mini';
            arr['engine'] = 'Presto';
            arr['type'] = 'mobile';
            arr['full_version'] = str.replace(/^(?:.+)(?:Opera Mini\/)([0-9\.]{0,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1].slice(0, 1) : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Opera') > -1){
            arr['browser'] = 'Opera';
            arr['hash'] = 'opera';
            arr['engine'] = 'Presto';
            arr['version'] = arr['full_version'] = (str.indexOf('Version') > -1)? str.replace(/^(?:.+)(?:Version\/)([0-9\.]{0,})(?:.{0,})$/, '$1') : str.replace(/^(?:Opera\/)([0-9\.]{1,})\s(?:.+)$/, '$1');
            arr['short_version'] = arr['version'].split('.')[0];
        }else if(str.indexOf('OPR') > -1){
            arr['browser'] = 'Opera';
            arr['hash'] = 'opera';
            arr['engine'] = 'Blink';
            arr['full_version'] = str.replace(/^(?:.+)(?:OPR\/)([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Fennec') > -1){
            arr['browser'] = 'Fennec';
            arr['hash'] = 'fennec';
            arr['engine'] = 'Gecko';
            arr['type'] = 'mobile';
            arr['full_version'] = str.replace(/^(?:.+)(?:Fennec)(?:[\/]{0,})([0-9\.]{0,})(?:.{0,})$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Firefox') > -1){
            arr['browser'] = 'Firefox';
            arr['hash'] = 'firefox';
            arr['engine'] = 'Gecko';
            arr['full_version'] = str.replace(/^(?:.+)(?:Firefox)(?:[\/]{0,})([0-9\.]{0,})(?:.{0,})$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Edge') > -1){
            arr['browser'] = 'Edge';
            arr['hash'] = 'edge';
            arr['engine'] = 'EdgeHTML';
            arr['full_version'] = str.replace(/^(?:.+)(?:Edge)(?:[\/]{0,})([0-9\.]{0,})(?:.{0,})$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Valve Steam GameOverlay') > -1){
            arr['browser'] = 'Steam';
            arr['hash'] = 'steam';
            arr['engine'] = 'Blink';
            arr['full_version'] = str.replace(/^(?:.+)(?:Chrome\/)([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Chrome') > -1){
            arr['browser'] = 'Chrome';
            arr['hash'] = 'chrome';
            arr['engine'] = 'Blink';
            arr['full_version'] = str.replace(/^(?:.+)(?:Chrome\/)([0-9\.]{1,})(?:.+)$/, '$1');
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else if(str.indexOf('Safari') > -1){
            arr['browser'] = 'Safari';
            arr['hash'] = 'safari';
            arr['engine'] = 'AppleWebKit';
            arr['full_version'] = (str.indexOf('Version') > -1)? str.replace(/^(?:.+)(?:Version\/)([0-9\.]{1,})(?:.+)$/, '$1') : '2';
            var sp = arr['full_version'].toString().split('.');
            arr['version'] = sp[0]+((sp[1])? '.'+sp[1] : '');
            arr['short_version'] = sp[0];
        }else{
            arr['version'] = arr['browser'] = 'unknown';
        }
        // Browser fullname
        arr['full_name'] = ((that.fullname[arr['browser']])? that.fullname[arr['browser']] : 'unknown');
        arr['browser_name'] = arr['full_name'] + ((arr['version'].length > 0 && arr['version'] != 'unknown')? ' '+arr['version'] : '');
        // Ckeck browser engine
        if(!arr['engine']){
            if(str.indexOf('AppleWebKit') > -1){
                arr['engine'] = 'AppleWebKit';
            }else if(str.indexOf('Trident') > -1){
                arr['engine'] = 'Trident';
            }else if(str.indexOf('Gecko') > -1){
                arr['engine'] = 'Gecko';
            }else{
                arr['engine'] = 'unknown';
            }
        }
        // Check OS
        if(str.indexOf('Windows Phone') > -1){
            arr['os'] = 'Windows Phone';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.+)(?:Windows Phone)(?:[\s]{0,1})([a-zA-Z\s0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Windows Phone OS') > -1){
            arr['os'] = 'Windows Phone OS';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.+)(?:Windows Phone OS)(?:[\s]{0,1})([a-zA-Z\s0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Windows CE') > -1){
            arr['os'] = 'Windows Mobile';
            arr['os_type'] = 'mobile';
            arr['os_version'] = '';
        }else if(str.indexOf('Windows') > -1){
            arr['os'] = 'Windows';
            arr['os_version'] = str.replace(/^(?:.+)(?:Windows)(?:[\s]{0,1})([a-zA-Z\s0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Android') > -1){
            arr['os'] = 'Android';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.+)(?:Android)(?:[\s]{0,})([0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('Linux') > -1){
            arr['os'] = 'Linux';
            arr['os_version'] = str.replace(/^(?:.+)(?:Linux)(?:[\s]{0,1})([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('iPhone') > -1){
            arr['device'] = 'iPhone';
            arr['device_name'] = 'Apple iPhone';
            arr['os'] = 'iOS';
            arr['os_type'] = 'mobile';
            arr['os_version'] =  str.replace(/^(?:.+)(?:CPU[ iPhone]{0,} OS )([a-zA-Z0-9\._]{0,})(?:.+)$/, '$1').replace(/_/gi,'.');
        }else if(str.indexOf('iPad') > -1){
            arr['device'] = 'iPad';
            arr['device_name'] = 'Apple iPad';
            arr['os'] = 'iOS';
            arr['os_type'] = 'mobile';
            arr['os_version'] =  str.replace(/^(?:.+)(?:CPU[ iPhone]{0,} OS )([a-zA-Z0-9\._]{0,})(?:.+)$/, '$1').replace(/_/gi,'.');
        }else if(str.indexOf('iPod') > -1){
            arr['device'] = 'iPod';
            arr['device_name'] = 'Apple iPod';
            arr['os'] = 'iOS';
            arr['os_type'] = 'mobile';
            arr['os_version'] =  str.replace(/^(?:.+)(?:CPU[ iPhone]{0,} OS )([a-zA-Z0-9\._]{0,})(?:.+)$/, '$1').replace(/_/gi,'.');
        }else if(str.indexOf('Macintosh') > -1){
            if(navigator.xr?.isSessionSupported("immersive-vr")) {
                arr['device'] = 'Vision Pro';
                arr['device_name'] = 'Apple Vision Pro';
                arr['os'] = 'iOS';
                arr['os_type'] = 'mobile';
                arr['os_version'] = str.replace(/^(?:.+)(?:Version\/)([0-9\.]{1,})(?:.+)$/, '$1').replace(/_/gi,'.');
            }else if((str.indexOf('Mac OS X') > -1)){
                arr['os'] = 'Mac OSX';
                arr['os_version'] =  str.replace(/^(?:.+)(?:Mac OS X)(?:[\s]{0,1})([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1').replace(/_/gi,'.');
            }else{
                arr['os'] = 'Mac OS';
                arr['os_version'] = 'Classic';
            }
        }else if(str.indexOf('BlackBerry') > -1){
            arr['os'] = 'BlackBerry';
            arr['os_type'] = 'mobile';
            arr['os_version'] = str.replace(/^(?:.{0,})(?:BlackBerry)(?:[\s]{0,})([0-9\.]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('FreeBSD') > -1){
            arr['os'] = 'FreeBSD';
            arr['os_version'] = str.replace(/^(?:.+)(?:FreeBSD )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('NetBSD') > -1){
            arr['os'] = 'NetBSD';
            arr['os_version'] = str.replace(/^(?:.+)(?:NetBSD )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('OpenBSD') > -1){
            arr['os'] = 'OpenBSD';
            arr['os_version'] = str.replace(/^(?:.+)(?:OpenBSD )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else if(str.indexOf('SunOS') > -1){
            arr['os'] = 'SunOS';
            arr['os_version'] = str.replace(/^(?:.+)(?:SunOS )([a-zA-Z0-9\.\s_]{0,})(?:.+)$/, '$1');
        }else{
            arr['os'] = arr['os_version'] = 'unknown';
        }
        // Check OS Name
        if(!arr['os_name']){
            if(arr['os'] != 'unknown'){
                var os = that.os[arr['os']];
                arr['os_name'] =  arr['os'] + ((arr['os_version'].length > 0 && arr['os_version'] != 'unknown')? ' '+((os && os[arr['os_version']])? os[arr['os_version']] : arr['os_version']) : '');
            }
            else{
                arr['os_name'] = 'unknown';
            }
        }
        return arr;
    },
    'setBrowserClass' : function(){
        var user = Com.UA.get();
        var classes = [];
        if(user['browser']){
            classes.push(user['browser'].toLowerCase());
        }
        if(user['os']){
            classes.push(user['os'].toLowerCase());
        }
        if(user['os_device']){
            classes.push(user['os_device'].toLowerCase());
        }
        cm.addClass(cm.getDocumentHtml(), classes);
    },
    'setEngineClass' : function(){
        cm.errorLog({type: 'error', name: 'Com.UA.setEngineClass', message: 'Deprecated!'});
    },
    'is' : function(str){
        var that = this,
            ver = str.replace(/[^0-9\.\,]/g,''),
            app = that.hash[str.replace(/[0-9\.\,\s]/g,'').toLowerCase()],
            user = that.get();
        return (app == user.browser && ((ver && ver.length > 0)? parseFloat(ver) == parseFloat(user.version) : true));
    },
    'isVersion' : function(){
        var that = this,
            user = that.get();
        return parseFloat(user.version);
    },
    'isMobile' : function(){
        var that = this,
            user = that.get();
        return user['os_type'] == 'mobile';
    }
};

/* Deprecated */

var is = function(str){
    cm.log('Warning. Method "is()" is deprecated. Please use "Com.UA.is()"');
    return Com.UA.is(str);
};

var isVersion = function(){
    cm.log('Warning. Method "isVersion()" is deprecated. Please use "Com.UA.isVersion()"');
    return Com.UA.isVersion();
};