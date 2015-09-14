//babel --watch babel.persistent.js --out-file persistent.js

/**
 * Hack in support for Function.name for browsers that don't support it.
 * IE, I'm looking at you.
**/
"use strict";

var _bind = Function.prototype.bind;
var _slice = Array.prototype.slice;

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function get() {
            var funcNameRegex = /function\s([^(]{1,})\(/;
            var results = funcNameRegex.exec(this.toString());
            return results && results.length > 1 ? results[1].trim() : "";
        },
        set: function set(value) {}
    });
}

var cacheID = 1;

//The 'new' syntax problem:
//
//Anything done after the super call will overwrite the values loaded from the cache
//If we wait till the stack's cleared to load the object, then the value of the object will be bad right afterwards.

//When taking from the cache, do we EVER want anything in the
//constructor to even apply?
//
//I.e, do we even want to run the constructor when
//pulling an object from the cache?
//Yeah, we want don't cache properties
//But for properties that we are caching/ arn't not caching, do we
//want to add the default value that we may well have deleted?

// class Persistient{
//     constructor(){
//     }

// //Will destroy the object previously living at the given id if there was one. Then create one.
// //Must start alignment after super call, but before object is returned.
// static create(id){
//     if(cache.get(id)){
//         destroy(exists);
//     }

//     var obj = new this(...arguments); //'this' will be whatever the object that called us was.
//     return fromModel(obj, id);
// }

// static load(id){
//     return fromCache(id);
// }

// static save(id, obj){
//     return fromModel(obj, id);
// }
// }

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
            return value;
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

var loadedItems = {};

var types = {
    "Object": Object,
    "Array": Array
};

var entityManagers = {};

function registerType(type) {
    //We need to wrap the class to allow the use of 'new' syntax.
    function persistientWrapper() {
        var obj = persistientWrapper.create.apply(persistientWrapper, [cacheID++].concat(_slice.call(arguments)));
        return obj;
    }

    persistientWrapper.load = fromCache;

    // persistientWrapper.save = function(obj, id){
    //     var obj = fromModel(id, obj);
    //     persistientWrapper.items.push(obj);
    //     return obj;
    // }

    persistientWrapper.findOrCreate = function (id) {
        return persistientWrapper.findOne(id) || persistientWrapper.create(id);
    };

    persistientWrapper.create = function () {
        var args = _.toArray(arguments);
        var id = args.shift(); //will remove the 0th element

        // if(cache.get(id)){
        //     destroy(exists);
        // }

        var obj = fromModel(new (_bind.apply(type, [null].concat(_toConsumableArray(args))))(), id);
        persistientWrapper.items.push(obj);
        return obj;
    };

    persistientWrapper.find = function (query) {
        if (_.isObject(query)) {
            return sift(query, persistientWrapper.items);
        } else {
            return persistientWrapper.find({ 'pInfo.id': query })[0];
        }
    };

    persistientWrapper.findOne = function (query) {
        return _.isObject(query) ? persistientWrapper.find(query)[0] : persistientWrapper.find(query);
    };

    persistientWrapper.remove = function (item) {
        if (item === undefined) {
            console.warn("Trying to remove an item that dosn't exist");
            return;
        }

        if (_.isObject(item)) {
            _.pull(persistientWrapper.items, item);
            item.pInfo.childIDs.forEach(function (childID) {
                cache.clear(item.pInfo.id + "." + childID);
            });
        } else {
            persistientWrapper.remove(persistientWrapper.find(item));
        }
    };

    persistientWrapper.obliterate = function (item) {
        if (item === undefined) {
            console.warn("Trying to obliterate an item that dosn't exist");
            return;
        }

        if (_.isObject(item)) {
            persistientWrapper.remove(item);
            _.values(item).filter(function (obj) {
                return _.isObject(obj) && obj.pInfo;
            }).forEach(persistientWrapper.obliterate);
        } else {
            persistientWrapper.obliterate(persistientWrapper.find(item));
        }
    };

    persistientWrapper.items = fromCache(type.name) || fromModel([], type.name); //create a persistient object to keep track of the persistient objects for this class.
    persistientWrapper[pluralize(type.name.toLowerCase())] = persistientWrapper.items; //just a pluralised version of the list.
    types[type.name] = type;

    if (window[type.name] !== type) {
        console.warn("Given type, " + type.name + " isn't on the global scope. Be sure to use the return value");
    } else {
        window[type.name] = persistientWrapper;
    }

    entityManagers[type.name] = persistientWrapper;

    return persistientWrapper;
}

var Parray = (function (_Array) {
    _inherits(Parray, _Array);

    function Parray() {
        _classCallCheck(this, Parray);

        _get(Object.getPrototypeOf(Parray.prototype), "constructor", this).apply(this, arguments);
    }

    return Parray;
})(Array);

registerType(Parray);

var Pobject = function Pobject() {
    _classCallCheck(this, Pobject);
};

registerType(Pobject);

//Returns a pObject, with the source of the pObject coming from the cache
function fromCache(id) {
    //If we've already loaded it, just return it.
    if (loadedItems[id]) {
        return loadedItems[id];
    }

    //If it dosn't exist in the cache, return undefined. We expect pInfo to have the list of childIDs, adoptedIDs, and disownedIDs.
    var pInfo = cache.get(id);
    if (!pInfo) {
        return undefined;
    }

    var shell = types[pInfo.type] ? new types[pInfo.type]() : {};

    //These are 100% of the keys the object should have. Constructor may have added more.
    var allKeys = pInfo.childIDs.concat(pInfo.disownedIDs.concat(Object.keys(pInfo.siblingIDs)));

    //Iterate through a list of every key that shouldn't be there
    _.difference(Object.keys(shell), allKeys).forEach(function (key) {
        delete shell[key];
    });

    return align(shell, pInfo, "CACHE");
}

//Returns a pObject, with the source of the pObject coming from the mode
function fromModel(object, id) {
    var id = id || cacheID++;

    var siblingIDs = {};
    for (var i in object) {
        if (_.isObject(object[i])) {
            if (!object[i].pInfo) {
                object[i] = fromModel(object[i]);
            }

            siblingIDs[i] = object[i].pInfo.id;
        }
    }

    var disownedIDs = ["id", "childIDs", "disownedIDs", "siblingIDs", "dontCache", "length"].concat(object.dontCache);

    var pInfo = {
        id: id,
        type: object.constructor.name,
        disownedIDs: disownedIDs,
        childIDs: _.difference(Object.keys(object), disownedIDs.concat(Object.keys(siblingIDs))), //The child ids will be all the keys of the object that don't include anything we don't want to cache, and ids we've adopted
        siblingIDs: siblingIDs
    };

    return align(object, pInfo, "MODEL");
}

function align(object, pInfo, source) {
    Object.defineProperty(object, "pInfo", { value: pInfo, writeable: false });
    loadedItems[object.pInfo.id] = object;

    for (var i in object.pInfo.childIDs) {
        alignChild(object, object.pInfo.childIDs[i], source);
    }

    for (var i in object.pInfo.siblingIDs) {
        alignSibling(object, i, source);
    }

    cache.set(object.pInfo.id, object.pInfo);

    watchForChanges(object);

    return object;
}

function alignChild(parent, childName, source) {
    var cacheKey = parent.pInfo.id + "." + childName;

    if (source === "MODEL") {
        cache.set(cacheKey, parent[childName]);
    }

    parent.__defineGetter__(childName, function () {
        return cache.get(cacheKey);
    });

    parent.__defineSetter__(childName, function (value) {
        //A property that used to be a flat value has been made an object
        if (typeof value == "object") {
            delete parent[childName];
            parent[childName] = value;
        } else {
            cache.set(cacheKey, value);
        }
        return value;
    });
}

function alignSibling(parent, siblingName, source) {
    if (source === "MODEL") {
        var sibling = parent[siblingName].pInfo ? parent[siblingName] : fromModel(parent[siblingName], parent.pInfo.siblingIDs[siblingName]);
    } else if (source === "CACHE") {
        var sibling = fromCache(parent.pInfo.siblingIDs[siblingName]);
    } else {
        throw new Error("Invalid source!");
    }

    //If we define a setter, we need to define a getter.
    parent.__defineGetter__(siblingName, function () {
        return sibling;
    });

    parent.__defineSetter__(siblingName, function (value) {
        delete parent[siblingName]; //Will trigger a key removal
        delete parent.pInfo.siblingIDs[siblingName]; //If we're writing a flat value
        parent[siblingName] = value; //Will trigger a key addition, and it can decide whether to adopt it there.
        return value;
    });
}

function watchForChanges(obj) {
    Object.observe(obj, function (changes) {
        changes.forEach(function (change) {
            if (!_.includes(obj.pInfo.disownedIDs, change.name)) {

                if (change.type == "add" && change.name in obj) {
                    if (_.isObject(obj[change.name])) {
                        alignSibling(obj, change.name, "MODEL");
                        obj.pInfo.siblingIDs[change.name] = obj[change.name].pInfo.id;
                    } else {
                        alignChild(obj, change.name, "MODEL");
                        obj.pInfo.childIDs.push(change.name);
                    }
                } else if (change.type == "delete") {
                    //pulls the key from the list of child keys and clears the cache property. If the child was
                    //an object tho, will rely on destroy to remove it from the cache.
                    _.pull(obj.pInfo.childIDs, change.name);
                    cache.clear(obj.pInfo.id + "." + change.name);
                }

                cache.set(obj.pInfo.id, obj.pInfo);
            }
        });
    }, ["add", "delete"]);
}

//Should be run on all childIDs. Assume source is cache.
// function alignChild(parent, childID, source){
//     if(!_.includes(parent.pInfo.childIDs, childID)){
//         parent.pInfo.childIDs.push(childID);
//         cache.set(parent.pInfo.cid, parent.pInfo);
//     }

//     if(source === "MODEL"){
//         var childIsObject = _.isObject(parent[childID]);   //If the current value of the property is an parentect
//     } else if (source === "CACHE"){
//         var childIsObject = _.isObject(cache.get(parent.pInfo.cid + "." + childID)); //If there's an parentect at the child's cid
//     } else {
//         throw new Error("Invalid source!");
//     }

//     if(childIsObject){
//         alignChildObject(parent, childID, source);
//     } else {
//         alignChildNonObject(parent, childID, source);
//     }
// }