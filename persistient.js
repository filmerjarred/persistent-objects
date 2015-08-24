"use strict";

var _bind = Function.prototype.bind;
var _slice = Array.prototype.slice;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Persistient;

var loadedItems = {};

var types = {
    "object": Object
};

function registerType(type) {
    types[type.name.toLowerCase()] = type;
}

//babel --watch util.cache.js6 --out-file persistient.js
(function () {

    //Functions for accessing local system cache.
    var cache = {

        //Takes a value and set's it in the local cache. Will break if objects have circular references.
        set: function set(key, value) {
            var party = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            if (key == undefined || key == null) {
                throw new Error("Key cannot be null");
            }

            if (typeof value !== "string") {
                value = JSON.stringify(value);
            }

            localStorage.setItem(key, value);
        },
        //Get's a object from the local cache
        get: function get(key) {
            if (key == undefined || key == null) {
                throw new Error("Key cannot be null");
            }

            var value = localStorage.getItem(key);

            if (value === undefined || value === null) {
                return undefined;
            }

            if (value.charAt(0) === "{" || value.charAt(0) === "[" || _.isNumeric(value) || _.isBoolean(value)) {
                return JSON.parse(value);
            } else {
                return value;
            }
        },

        clear: localStorage.removeItem.bind(localStorage),

        clearAll: localStorage.clear.bind(localStorage),

        push: function push(key, value, checkIfExists) {
            var collection = this.get(key) || [];

            if (checkIfExists && _.includes(collection, key)) {
                throw new Error("Cache array already has this key in it and we care.");
                return;
            }

            collection.push(value);
            this.set(key, collection);
        },

        pull: function pull(collectionKey, item) {
            if (collectionKey == undefined || collectionKey == null) {
                throw new Error("Key cannot be null");
            }

            var collection = this.get(collectionKey);
            collection = _.without(collection, item);
            this.set(collectionKey, collection);
        }
    };

    //================ Cachification ==========================

    function registerType(type) {
        types[type.name.toLowerCase()] = type;
    }

    //Okay, so we need to start the process of alignment with an object.
    //That object may be brand new, or may have stuff in it
    //Either way, different things happen depending on whether we want to map the cache to it, or it to the cache.

    function _load(cid) {
        if (loadedItems[cid]) {
            return loadedItems[cid];
        } else {
            var childInfo = cache.get(cid);
            if (!childInfo) {
                return undefined;
            }
            var child = types[childInfo.type] && new types[childInfo.type]() || {};
            loadedItems[cid] = child;
            return align({ obj: child, cid: cid, source: "CACHE" });
        }
    }

    //Bring the cache and model into alignment. Takes:
    //{
    //  obj:Object of the right type.,
    //  cid:The cache id of the object,
    //  source:"CACHE" || "MODEL";
    //}
    function align(args) {

        var obj = args.obj;

        //Give our object the cache spesific properties
        Object.defineProperty(obj, "cid", { value: args.cid, writeable: false }); //give the object a cid
        Object.defineProperty(obj, "id", { value: _.last(args.cid.split(".")), writeable: false }); //give the object a cid

        obj.disownedIDs = ["childIDs", "cid", "id", "disownedIDs", "adoptedCIDs"].concat(obj.dontCache); //Node of the disowned properties will be cached. THEY ARE NO CHILDREN OF MINE!

        obj.adoptedCIDs = obj.adoptedCIDs || [];

        obj.__defineGetter__("childIDs", function () {
            return _.difference(Object.keys(this), this.disownedIDs.concat(this.adoptedCIDs));
        });

        //If the model is our source, then write the object keys and type. Else, take the key list from the cache and assign them.
        if (args.source === "MODEL") {
            updateObjInfo(obj);
        } else if (args.source === "CACHE") {
            var info = cache.get(obj.cid);

            if (!info) {
                return undefined;
            }

            obj.adoptedCIDs = obj.adoptedCIDs.concat(info.adoptedCIDs);

            for (var i in info.childIDs) {
                //Give the object each key, so that it's obj.info.childIDs getter gives the correct values.
                obj[info.childIDs[i]] = obj[info.childIDs[i]] || undefined;
            }
        } else {
            throw new Error("Invalid source!");
        }

        //Goes through and links each property. If the property value is an object, align it, i
        obj.childIDs.forEach(cacheProperty.bind(null, obj, args.source));

        obj.adoptedCIDs && obj.adoptedCIDs.forEach(function (cid) {
            var child = _load(cid);
            obj[child.id] = child;
        });

        watchForChanges(obj);

        return obj;
    }

    function updateObjInfo(obj) {
        cache.set(obj.cid, { childIDs: obj.childIDs, adoptedCIDs: obj.adoptedCIDs, type: obj.constructor.name.toLowerCase() });
    }

    //Observe the object for any added or deleted keys.
    function watchForChanges(obj) {
        Object.observe(obj, function (changes) {

            changes.forEach(function (change) {
                var childKey = change.name;
                var childValue = change.object[change.name];
                var childCID = obj.cid + "." + childKey;

                if (!_.includes(obj.dontCache, childKey)) {

                    if (change.type == "add") {
                        if (childValue.cid) {
                            obj.adoptedCIDs.push(childValue.cid);
                        } else {
                            cacheProperty(obj, "MODEL", childKey);
                        }
                    }

                    // else if (change.type == "delete"){
                    //     change.oldValue.destroy && change.oldValue.destroy();   //If it was an object(ie, had a destroy function), then take care of it from the cache.
                    // }

                    updateObjInfo(obj); //MAKE SURE IF YOU'RE DESTROYING IT, YOU OBLITERATE THE KEY
                }
            });
        }, ["add", "delete"]);
    }

    //okay, so if you're trying to cache a child that's already a thing, adopt it instead.
    //is a child is already aligned, this won't be called on it.
    function cacheProperty(obj, source, childID) {
        var childCID = obj.cid + "." + childID;

        if (source === "MODEL") {
            var childValue = obj[childID];
            var childIsObject = _.isObject(childValue);
        } else if (source === "CACHE") {
            var childInfo = cache.get(childCID);
            var childIsObject = _.isObject(childInfo);
        }

        //If what's already there is an object, or the source is the cache and there's an obj in the cache in this position.
        if (childIsObject) {
            if (source === "MODEL") {
                obj[childID] = align({ obj: childValue, cid: childCID, source: source });
            } else {
                obj[childID] = _load(childCID);
            }
        } else {

            if (!_.includes(obj.childIDs, childID) || _.includes(obj.disownedIDs, childID)) {
                throw new Error("Unexpected, this key shouldn't be cached!?");
                return;
            }

            if (source === "MODEL") {
                cache.set(childCID, childValue);
            }

            obj.__defineGetter__(childID, function () {
                return cache.get(childCID);
            });

            obj.__defineSetter__(childID, function (value) {
                cache.set(childCID, value);
                return value;
            });
        }
    }

    /**
     *  Persistient(id)
     *
     *  Persistient({id:id, dontCache:[]})
     *
     */

    var _Persistient = (function () {
        function _Persistient(args) {
            _classCallCheck(this, _Persistient);

            return 1;
            // if(!_.isObject(args)){
            //     args = {cid:args, dontCache:this.dontCache};
            // }

            // if(args.dontCache){
            //     Object.defineProperty(this, "dontCache", {value:args.dontCache, writeable:true});
            // }
        }

        //'this' will be whatever the object that called us was.

        _createClass(_Persistient, null, [{
            key: "create",
            value: function create(id) {
                var obj = new (_bind.apply(this, [null].concat(_slice.call(arguments))))();

                align({ obj: obj, cid: id, source: "MODEL" });

                return obj;
            }
        }, {
            key: "load",
            value: function load(id) {
                // var obj = new this();

                // align({obj:obj, cid:id, source:"CACHE"});

                return _load(id);
            }
        }, {
            key: "save",
            value: function save(id, obj) {
                return align({ cid: id, obj: obj, source: "MODEL" });
            }
        }]);

        return _Persistient;
    })();

    Persistient = _Persistient;

    // //============ Redis To Cache ==========================
    // // var connection = io("http://localhost:3000/", {query:"name=asdf", 'force new connection':true});

    // var partying = false;
    // var partyPulse = 2000;

    // //Bassicaly sends a list of changes to the server every {{partyPulse}}
    // function initCountdownToParty(){
    //     if(!partying){
    //         partying = true;

    //         setTimeout(function(){
    //             connection.emit("set", setRecords);
    //             revise("revision");
    //             setRecords = {};
    //             partying = false;
    //         }, partyPulse)
    //     }
    // }
})();

//okay, so what happens when we add an already cached object to a cached object
//so we could keep a global store of cached objects?
//and if it's already in there, just point to that.

// var hermoine = Wizard.load("Hermoine Granger");
// var ron = Wizard.load("Ron Weasly");

// hermoine.befriend(ron);
// ron.befriend(hermoine);

// console.log(hermoine.friends["Ron Weasly"] === ron); //true
// console.log(ron.friends["Hermoine Granger"] === hermoine); //true

// ron.petType = "Lost";
