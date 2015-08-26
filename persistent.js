//babel --watch util.cache.js6 --out-file persistient.js

/**
 * Hack in support for Function.name for browsers that don't support it.
 * IE, I'm looking at you.
**/
"use strict";

var _bind = Function.prototype.bind;
var _slice = Array.prototype.slice;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var alignInConstructor = true;

var Persistient = (function () {
    function Persistient(id) {
        _classCallCheck(this, Persistient);

        if (alignInConstructor) {
            if (!id) {
                throw new Error("The ID passed to super cannot be null if you're using 'new'");
            }
            fromCache(id, this) || fromModel(id, this); //If assigning from the cache returns undefined, assign from model.
        }
    }

    //Will load id if it exists, else will create it.
    //Must start alignment after super call, but before object is returned.

    _createClass(Persistient, null, [{
        key: "loadOrCreate",
        value: function loadOrCreate(id) {
            return this.load(id) || this.create(id);
        }

        //Will destroy the object previously living at the given id if there was one. Then create one.
        //Must start alignment after super call, but before object is returned.
    }, {
        key: "create",
        value: function create(id) {
            var exists = cache.get(id);

            if (exists) {
                destroy(exists);
            }

            alignInConstructor = false;
            var obj = new (_bind.apply(this, [null].concat(_slice.call(arguments))))(); //'this' will be whatever the object that called us was.
            alignInConstructor = true;

            return fromModel(id, obj);
        }
    }, {
        key: "load",
        value: function load(id) {
            return fromCache(id);
        }
    }, {
        key: "save",
        value: function save(id, obj) {
            return fromModel(id, obj);
        }
    }]);

    return Persistient;
})()

//Functions for accessing local system cache.
;

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

var loadedItems = {};

var types = {
    "object": Object,
    "array": Array
};

function registerType(type) {
    types[type.name.toLowerCase()] = type;
}

//DEFINITIONS
//CID : The cache id, the globably unique id used as a key in the cache.
//pObject : A persistient object, in that all it's properties that aren't other objects, listed in don't cache, or adopted point to the cache
//child : The value of a property of a pObject
//childID : The index of the child of a pObject.
//childCID : will be pObject.id + "." + child.id
//Alignment. So any pObject will nessisarily start it's life as an empty shell of the type of object it shall be. Alignment is the process of taking a shell, and a cid, and then either putting that onto the cache, or
//           taking whatever's in the cache onto it. Either way, the pObject becomes 'aligned' with the cache.

//Returns a pObject, with the source of the pObject coming from the cache
function fromCache(cid, shell) {
    //If we've already loaded it, just return it.
    if (loadedItems[cid]) {
        return loadedItems[cid];
    }

    //If it dosn't exist in the cache, return undefined. We expect pInfo to have the list of childIDs, adoptedIDs, and disownedIDs.
    var pInfo = cache.get(cid);
    if (!pInfo) {
        return undefined;
    }

    if (!shell) {
        alignInConstructor = false;
        shell = types[pInfo.type] ? new types[pInfo.type]() : {};
        alignInConstructor = true;
    }

    return align(shell, pInfo, "CACHE");
}

//Returns a pObject, with the source of the pObject coming from the mode
function fromModel(cid, object) {
    var adoptedCIDs = {};
    for (var i in object) {
        if (object[i].pInfo) {
            adoptedCIDs[i] = object[i].pInfo.cid;
        }
    }

    var disownedIDs = ["childIDs", "cid", "id", "disownedIDs", "adoptedCIDs"].concat(object.dontCache);

    var pInfo = {
        cid: cid,
        id: _.last(cid.split(".")),
        type: object.constructor.name.toLowerCase(),
        disownedIDs: disownedIDs,
        childIDs: _.difference(Object.keys(object), disownedIDs),
        adoptedCIDs: adoptedCIDs
    };

    return align(object, pInfo, "MODEL");
}

function align(object, pInfo, source) {
    Object.defineProperty(object, "pInfo", { value: pInfo, writeable: false });
    loadedItems[object.pInfo.cid] = object;

    for (var i in object.pInfo.childIDs) {
        alignChild(object, object.pInfo.childIDs[i], source);
    }

    //adoptedIds = {'property name on adopted parent' : 'child cid'}
    for (var id in object.pInfo.adoptedCIDs) {
        var child = fromCache(object.pInfo.adoptedCIDs[id]);

        object.__defineSetter__(id, function (value) {
            delete object[id]; //Will trigger a key removal
            object[id] = value; //Will trigger a key addition, and it can decide whether to adopt it there.
            return value;
        });

        //If we define a setter, we need to define a getter.
        object.__defineGetter__(id, function () {
            return child;
        });
    }

    cache.set(object.pInfo.cid, object.pInfo);
    // Object.observe(object.pInfo, function(){
    // cache.set(object.pInfo.cid, object.pInfo);
    // })

    watchForChanges(object);

    return object;
}

//Should be run on all childIDs. Assume source is cache.
function alignChild(parent, childID, source) {
    if (!_.includes(parent.pInfo.childIDs, childID)) {
        parent.pInfo.childIDs.push(childID);
        cache.set(parent.pInfo.cid, parent.pInfo);
    }

    if (source === "MODEL") {
        var childIsObject = _.isObject(parent[childID]); //If the current value of the property is an parentect
    } else if (source === "CACHE") {
            var childIsObject = _.isObject(cache.get(parent.pInfo.cid + "." + childID)); //If there's an parentect at the child's cid
        } else {
                throw new Error("Invalid source!");
            }

    if (childIsObject) {
        alignChildObject(parent, childID, source);
    } else {
        alignChildNonObject(parent, childID, source);
    }
}

function alignChildObject(parent, childID, source) {
    var childCID = parent.pInfo.cid + "." + childID;

    //if the child already has a pInfo, then just adopt it.
    if (parent[childID] && parent[childID].pInfo) {
        parent.pInfo.adoptedCIDs[childID] = parent[childID].pInfo.cid;
        cache.set(parent.pInfo.cid, parent.pInfo);
    } else if (source === "MODEL") {
        var child = fromModel(childCID, parent[childID]);
    } else if (source === "CACHE") {
        var child = fromCache(childCID);
    } else {
        throw new Error("Invalid source!");
    }

    //If anyone writes to this, it means we need to realign the property. But we need to check to see if we should adopt the value we're adding.
    parent.__defineSetter__(childID, function (value) {
        child = value;

        if (value.pInfo) {
            _.pull(obj.pInfo.childIDs, childID); //If the old value was a standard child
            parent.pInfo.adoptedCIDs[childID] = value.pInfo.cid;
            cache.set(parent.pInfo.cid, parent.pInfo);
        } else {
            alignChild(parent, childID, "MODEL");
        }

        return value;
    });

    //If we define a setter, we need to define a getter.
    parent.__defineGetter__(childID, function () {
        return child;
    });
}

function watchForChanges(obj) {
    Object.observe(obj, function (changes) {
        changes.forEach(function (change) {
            var childID = change.name;
            var childCID = obj.pInfo.cid + "." + childID;

            if (!_.includes(obj.dontCache, childID)) {
                if (change.type == "add" && childID in obj) {
                    alignChild(obj, childID, "MODEL");
                } else if (change.type == "delete") {
                    _.pull(obj.pInfo.childIDs, childID);
                    _.pull(obj.pInfo.adoptedIDs, childCID);
                    cache.set(obj.pInfo.cid, obj.pInfo);
                }

                updateObjInfo(obj);
            }
        });
    }, ["add", "delete"]);
}

function alignChildNonObject(parent, childID, source) {
    var childCID = parent.pInfo.cid + "." + childID;

    if (source === "MODEL") {
        cache.set(childCID, parent[childID]);
    }

    parent.__defineGetter__(childID, function () {
        return cache.get(childCID);
    });

    parent.__defineSetter__(childID, function (value) {
        //A property that used to be a flat value has been made an parentect or array
        if (typeof value == "object") {
            delete parent[childID];
            parent[childID] = value;
        } else {
            cache.set(childCID, value);
        }
        return value;
    });
}

function updateObjInfo(obj) {}

function destroy(obj) {
    var childIDs = obj.childIDs;

    for (var i in childIDs) {
        if (_.isObject(obj[childIDs[i]])) {
            destroy(obj[childIDs[i]]);
        }
        cache.clear(childIDs[i]);
    }

    cache.clear(obj.pInfo.cid);
}
