"use strict";

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Persistient;
(function () {

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

            if (value.charAt(0) === "{" || value.charAt(0) === "[" || util.isNumber(value) || util.isBoolean(value)) {
                return JSON.parse(value);
            } else {
                return value;
            }
        },

        clear: localStorage.removeItem.bind(localStorage),

        clearAll: localStorage.clear.bind(localStorage),

        push: function push(key, value, checkIfExists) {
            var collection = this.get(key) || [];

            if (checkIfExists && util.contains(collection, key)) {
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
            util.remove(collection, item);
            this.set(collectionKey, collection);
        }
    };

    //================ Cachification ==========================

    var types = {
        "object": Object
    };

    function registerType(type) {
        types[type.name.toLowerCase()] = type;
    }

    //Takes a object with data in it and saves it to the cache
    function _save(parentCID, obj) {
        if (parentCID === undefined) parentCID = "";

        if (!obj.id) {
            throw new Error("Objects need ids!");
        }

        Object.defineProperty(obj, "cid", { value: parentCID + "." + obj.id });

        getKeys(obj).forEach(function (childKey) {

            if (util.isObject(obj[childKey])) {
                Object.defineProperty(obj[childKey], "id", { value: childKey });
                _save(obj.cid, obj[childKey]);
            } else {
                cache.set(obj.cid + "." + childKey, obj[childKey]);
                cacheProperty(obj, childKey, obj.cid + "." + childKey);
            }
        });

        saveObjInfo(obj);
        watchForChanges(obj);
    }

    //Takes an id, and returns the corresponding object from the cache
    function _load(cid) {
        var objInfo = util.isObject(cid) ? cid : cache.get(cid);

        if (!objInfo) {
            return false;
        }

        var obj = objInfo.type ? new types[objInfo.type]() : {};

        Object.defineProperty(obj, "cid", { value: objInfo.cid });
        Object.defineProperty(obj, "id", { value: objInfo.id });

        objInfo.keys.forEach(function (key) {
            var childCID = genCID(obj, key);
            var value = cache.get(childCID);

            if (util.isObject(value)) {
                //If the property is an object it will be the object info of an object
                obj[key] = _load(value);
            } else {
                cacheProperty(obj, key, childCID);
            }
        });

        watchForChanges(obj);

        return obj;
    }

    function destroy(obj) {}

    function genCID(obj, key) {
        if (obj.cid === undefined) {
            throw new Error("This object is cid less!", obj);
        }

        return obj.cid + "." + key;
    }

    function getKeys(obj) {
        return util.diff(Object.keys(obj), obj.dontCache);
    }

    function saveObjInfo(obj) {
        if (obj.cid === undefined) {
            throw new Error("This object is cid less!", obj);
        }

        cache.set(obj.cid, { type: obj.constructor.name.toLowerCase(), keys: getKeys(obj), cid: obj.cid, id: obj.id });
    }

    function watchForChanges(obj) {
        Object.observe(obj, function (changes) {
            changes.forEach(function (change) {
                if (!util.contains(obj.dontCache, change.name)) {
                    var value = change.object[change.name];

                    if (change.type == "add") {

                        if (util.isObject(value)) {
                            Object.defineProperty(value, "id", { value: change.name });
                            _save(obj.cid, value);
                        } else {
                            cache.set(genCID(obj, change.name), value);
                            cacheProperty(obj, change.name, genCID(obj, change.name));
                        }
                    } else if (change.type == "delete") {
                        change.oldValue.destroy && change.oldValue.destroy(); //If it was an object(ie, had a destroy function), then take care of it from the cache.
                    }
                    saveObjInfo(obj);
                }
            });
        }, ["add", "delete"]);
    }

    function cacheProperty(obj, key, accessKey) {
        obj.__defineGetter__(key, function () {
            return cache.get(accessKey);
        });

        obj.__defineSetter__(key, function (value) {
            cache.set(accessKey, value);
        });
    }

    var _Persistient = (function () {
        function _Persistient(id) {
            _classCallCheck(this, _Persistient);

            if (this.constructor != Object) {
                registerType(this.constructor);
            }
            this.id = id;
            if (cache.get("." + id)) {
                return _load("." + id);
            } else {
                _save("", this);
            }
        }

        _createClass(_Persistient, null, [{
            key: "save",
            value: function save() {
                _save.apply(null, arguments);
            }
        }, {
            key: "load",
            value: function load() {
                return _load.apply(null, arguments);
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

var Person = (function (_Persistient2) {
    _inherits(Person, _Persistient2);

    function Person(name) {
        _classCallCheck(this, Person);

        _get(Object.getPrototypeOf(Person.prototype), "constructor", this).call(this, name);
        this.name = name;
    }

    return Person;
})(Persistient);

// getKeys(obj).forEach(key => {
//     obj[key].destroy && obj[key].destroy();
//     cache.clear(genCID(obj, key));
// })
