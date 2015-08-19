var util = {

    //Register some functions for use in scope
    registerHelperFunctions:function($scope, helpersWanted){
        for(var i in helpersWanted){
            if(helpersWanted[i]){
                $scope[helpersWanted[i]] = helpersWanted[i];
            } else {
                throw new Error("No helper under that name");
            }
        }
    },

    RAD:(Math.PI / 180),

    isOpera:!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,
    
    isFirefox:typeof InstallTrigger !== 'undefined',   // Firefox 1.0+

    isSafari:Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    
    isChrome:!!window.chrome && !this.isOpera,              // Chrome 1+
    
    isIE:/*@cc_on!@*/false || !!document.documentMode, // At least IE6
    
    noop:function(){},

    checkExtends:function(a, b){
        return a.prototype instanceof b;
    },

    objLength:function(obj){
        return Object.keys(obj).length;
    },

    preventBackspace:function(){
        $(function(){
            /*
             * this swallows backspace keys on any non-input element.
             * stops backspace -> back
             */
            var rx = /INPUT|SELECT|TEXTAREA/i;

            $(document).bind("keydown keypress", function(e){
                if( e.which == 8 ){ // 8 == backspace
                    if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                        e.preventDefault();
                    }
                }
            });
        });
    },

    saneWatch:function(fn){
        return function(newVal, oldVal){
            if(oldVal != newVal){
                fn(newVal, oldVal);
            }
        }
    },

    tpush:function(col, val){
        if (col.indexOf(val) == -1){
            col.push(val);
        }
    },

    emptyOut:function(collection){
        while(collection.pop()){
        }
    },

    passReject:function(){
        return new Promise(function(a,b){b()});
    },

    RResolve:function(){
        console.log("Resolve: ", arguments);
    },

    RReject:function(){
        console.log("Reject: ", arguments);
    },

    isFunction:function(val){
        return this.getType(val) == "[object Function]";
    },

    isArray:function(val){
        return this.getType(val) == "[object Array]";
    },

    isObject:function(val){
        return this.getType(val) == "[object Object]";
    },

    isBoolean:function(value){
        return value === true || value === false || value === "true" || value === "false";
    },

    isNumber:function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },


    isEmpty:function(collection){
        for(var i in collection){
            return false;
        }
        return true;
    },

    textMatch:function(opts){
        //{string:"", values:"", contains:false, all:false}
        //Can't just check for ! values, because 0 could be a thing
        if(opts.needles === undefined || opts.haystack === undefined || opts.haystack === null || opts.needles.toString() === ""){
            return undefined;
        }

        if(this.getType(opts.needles) !== "[object Array]"){
            opts.needles = [opts.needles];
        }

        var match;
        var misMatch;
        var matcher;

        function matcher(a,b){
            if(b[0] === "/"){
                return RegExp(b.substring(1, b.length)).test(a.trim());
            } else {
                return a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) != -1
            }
        }

        for(var i in opts.needles){
            if(matcher(opts.haystack, opts.needles[i])){
               match = true; //atleast one matches
            } else {
                misMatch = true; //atleast one mismatches
            }
        }

        if(opts.all && match && misMatch){
            return false;
        }

        if( (!opts.reverse && match) || (opts.reverse && misMatch) ){
            return true;
        }

        return false;
    },

    Mum:function(cb){
        this.children = 0;

        this.onDone = cb;

        this.results = [];

        this.registerStart = function(name, deps, cb){
            this.children++

            return this.registerFinish;
        }.bind(this);

        this.registerFinish = function(result){
            this.children--;

            result && this.results.push(result);

            if(this.children <= 0){
                this.onDone(this.results)
            }
        }.bind(this);



        this.lastToken = 0;
        this.getToken = function(){
            return this.lastToken++;
        }.bind(this);
    },

    lock:function(obj, prop, value){
        var store = value || obj[prop];

        obj.__defineSetter__(prop, function(input) {
            throw new Error(prop + " is immutable and cannot be modified.");
        })

        obj.__defineGetter__(prop, function() {
          return store;
        })
    },

    indexBy:function(collection, indexProp){
        var obj = {};

        for(var i = 0; i < collection.length; i++){
            obj[collection[i][indexProp]] = collection[i];
        }

        return obj;
    },

    byIndex:function(obj, idx) {
        return obj[Object.keys(obj)[idx]];
    },

    duplicates:function(array){
        var sorted_arr = array.sort();

        for (var i = 0; i < array.length - 1; i++) {
            if (sorted_arr[i + 1] == sorted_arr[i]) {
                return true;
            }
        }
        return false;
    },

    diff:function(a, b) {
        if(!b){
            return a;
        }

        if(!a){
            return b;
        }
        
        return a.filter(function(i) {return b.indexOf(i) < 0;});
    },

    cycle:function(obj, type){
        if(this.getType(obj) == "[object Object]"){
            var index = (Object.keys(obj).indexOf(type) + 1) % (Object.keys(obj).length);
            return Object.keys(obj)[index];   
        } else {
            return obj[(obj.indexOf(type) + 1) % obj.length]
        }
    },

    sortBy:function(collection, field) {
        collection.sort(function(a,b){
            if (a[field] < b[field])
                return -1;
            if (a[field] > b[field])
                return 1;
            return 0;
        })
    },

    equal:function(a, b){
        if(typeof(a) == "object"){
            return this.objectsEqual(a,b);
        } else {
            return a === b;
        }
    },

    objectsEqual:function(a, b){
        return JSON.stringify(a) == JSON.stringify(b);
    },

    //
    gets:function(collection, indexes){
        var items = [];
        var obj = {missing:false};

        for(var i in indexes){
            if(collection[indexes[i]] !== undefined){
                items.push(collection[indexes[i]]);
            } else {
                obj.missing = obj.missing || false;
                obj.missing.push(indexes[i]); 
            }
        }

        obj.found = items;
        return obj;
    },

    cloneObject:function(obj, ignored){
        var newObj = {};

        for(var i in obj){
            if(!this.contains(ignored, i)){
                newObj[i] = obj[i];
            }
        }

        return newObj;
    },    

    incChar:function(char){
        return String.fromCharCode(char.charCodeAt(char) + 1)
    },

    //Select one object from array by value
    select:function(collection, field, value){
        if(typeof(value) == "object"){
            for (var i in collection){
                if(typeof(collection[i]) == "object" && this.contains(value, collection[i][field])){
                    return collection[i]
                }
            }
        } else {   
            for (var i in collection){
                if(typeof(collection[i]) == "object" && collection[i][field] == value){
                    return collection[i]
                }
            }
        }
        return undefined;
    },

    //Returns a list of objects that match
    selects:function(collection, field, value){
        var toReturn = [];

        if(typeof(value) == "object"){
            for (var i in collection){
                if(typeof(collection[i]) == "object" && this.contains(value, collection[i][field])){
                    toReturn.push(collection[i]);
                }
            }
        } else {   
            for (var i in collection){
                if(collection[i][field] == value){
                    toReturn.push(collection[i]);
                }
            }
        }

        
        return toReturn;
    },

    setCookie:function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    },

    getCookie:function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
        }
        return "";
    },

    choose:function(list, choice){
        for(var i in list){
            list[i].chosen = false;
        }
        choice.chosen = true;
    },

    chosen:function(list){
        return this.select(list, "chosen", true);
    },

    extractArray:function(items, prop){
        var toReturn = [];
        for(var i in items){
            toReturn.push(items[i][prop]);
        }
        return toReturn;
    },

    getType:function(obj){
        return Object.prototype.toString.call(obj);
    },

    contains:function(haystack, needle){
        if(!haystack || !needle){
            return false
        }
        if(typeof(haystack) == "object"){
            for(var i in haystack){
                if(haystack.hasOwnProperty(i)){
                    if(haystack[i] == needle){
                        return true;
                    }
                }
            }
            return false;
        }

        //Guess it's a string

        if(haystack.toString().toLowerCase().indexOf(needle.toString().toLowerCase()) != -1){
            return true;
        } else {
            return false;
        }
    },

    remove:function(array, item){
        if(this.contains(array, item)){
            return array.splice(array.indexOf(item), 1);
        } else {
            return null
        }
    },

    launchFullscreen:function() {
        if(document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if(document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if(document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if(document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    },

    exitFullscreen:function() {
        if(document.exitFullscreen) {
            document.exitFullscreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    },

    guid:   (function() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return function() {
                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                        s4() + '-' + s4() + s4() + s4();
                };
            })()
}