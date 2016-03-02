//babel --watch babel.persistent.js --out-file persistent.js

/**
 * Hack in support for Function.name for browsers that don't support it.
 * IE, I'm looking at you.
**/
if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var funcNameRegex = /function\s([^(]{1,})\(/;
            var results = (funcNameRegex).exec((this).toString());
            return (results && results.length > 1) ? results[1].trim() : "";
        },
        set: function(value) {}
    });
}

var cacheID = 1;

//ok, so we got a problem with the system.
//
//when we go to load pObject say, we load everything under it, which includes the other classes
//and those classes try to load their sun objects, before the class is registered

//Functions for accessing local system cache.
var cache = {
    //Takes a value and set's it in the local cache. Will break if objects have circular references.
    set:function(key, value, party = true){
        if(key == undefined || key == null){
            throw new Error("Key cannot be null");
        }

        if(typeof value !== "string"){
            value = JSON.stringify(value);
        }

        localStorage.setItem(key, value);
    },
    //Get's a object from the local cache
    get:function(key){
        if(key == undefined || key == null){
            throw new Error("Key cannot be null");
        }

        var value = localStorage.getItem(key);

        if(value === undefined || value === null){
            return value;
        }

        if (value.charAt(0) === "{" || value.charAt(0) === "[" || _.isNumeric(value) || value === "true" || value === "false") {
            return JSON.parse(value);
        } else {
            return value;
        }
    },

    clear:localStorage.removeItem.bind(localStorage),

    clearAll:localStorage.clear.bind(localStorage),

    push:function(key, value, checkIfExists){
        var collection = this.get(key) || [];

        if(checkIfExists && _.includes(collection, key)){
            throw new Error("Cache array already has this key in it and we care.");
            return;
        }

        collection.push(value);
        this.set(key, collection);
    },

    pull:function(collectionKey, item){
        if(collectionKey == undefined || collectionKey == null){
            throw new Error("Key cannot be null");
        }

        var collection = this.get(collectionKey);
        collection = _.without(collection, item);
        this.set(collectionKey, collection)
    }
}

var loadedItems = {
}

var types = {
    "Object":Object,
    "Array":Array
}

var entityManagers = {};

function registerType(type){
    //We need to wrap the class to allow the use of 'new' syntax.
    function persistientWrapper(){
        var obj = persistientWrapper.create(cacheID++, ...arguments);
        return obj;
    }

    persistientWrapper.load = fromCache;

    persistientWrapper.loadAll = function(){
        persistientWrapper.items = fromCache(type.name) || fromModel([], type.name);    //create a persistient object to keep track of the persistient objects for this class.
        persistientWrapper[pluralize(type.name.toLowerCase())] = persistientWrapper.items; //just a pluralised version of the list.
        persistientWrapper.loaded = true;
    }

    persistientWrapper.loaded = false;

    // persistientWrapper.save = function(obj, id){
    //     var obj = fromModel(id, obj);
    //     persistientWrapper.items.push(obj);
    //     return obj;
    // }


    persistientWrapper.findOrCreate = function(id){
        return persistientWrapper.findOne(id) || persistientWrapper.create(id);
    }

    persistientWrapper.create = function(){
        if(!persistientWrapper.loaded){
            throw new Error("Cannot do operations involving 'items', such as Create, before class items are all loaded")
        }

        var args = _.toArray(arguments);
        var id = args.shift(); //will remove the 0th element

        var obj = fromModel(new type(...args), id);

        obj.onCreate && obj.onCreate(...args);

        persistientWrapper.items.push(obj);
        return obj;
    }

    persistientWrapper.find = function(query){
        if(_.isObject(query)){
            return sift(query, persistientWrapper.items);
        } else {
            return persistientWrapper.find({'pInfo.id':query})[0];
        }
    }

    persistientWrapper.findOne = function(query){
        return _.isObject(query) ? persistientWrapper.find(query)[0] : persistientWrapper.find(query)
    }

    persistientWrapper.remove = function(item){
        if(item === undefined){
            console.warn("Trying to remove an item that dosn't exist")
            return;
        }

        if(_.isObject(item)){
            _.pull(persistientWrapper.items, item);
            item.pInfo.childIDs.forEach(function(childID){
                cache.clear(item.pInfo.id + "." + childID);
            })
        } else {
            persistientWrapper.remove(persistientWrapper.find(item));
        }
    }

    persistientWrapper.obliterate = function(item){
        if(item === undefined){
            console.warn("Trying to obliterate an item that dosn't exist")
            return;
        }

        if(_.isObject(item)){
            persistientWrapper.remove(item);

            _.values(item).filter(function(obj){
                return _.isObject(obj) && obj.pInfo && obj !== item;
            }).forEach(persistientWrapper.obliterate);
        } else {
            persistientWrapper.obliterate(persistientWrapper.find(item));
        }
    }

    types[type.name] = type;

    if(window[type.name] !== type){
        console.warn("Given type, " + type.name + " isn't on the global scope. Be sure to use the return value")
    } else {
        window[type.name] = persistientWrapper;
    }

    entityManagers[type.name] = persistientWrapper;

    return persistientWrapper;
}

class Parray extends Array {
}
registerType(Parray);

class Pobject{
}

registerType(Pobject);

function initialiseData(){
    var em = _.values(entityManagers);

    em.sort(function(a, b){
        if((a.priority || a.priority === 0) && (!b.priority && b.priority !== 0)){
            return -1;
        } else if ((b.priority || b.priority === 0) && (!a.priority && a.priority !== 0)){
            return 1;
        } else if (a.priority < b.priority){
            return -1;
        } else {
            return 1;
        }
    })

    em.forEach(e => e.loadAll());
}

//Returns a pObject, with the source of the pObject coming from the cache
function fromCache(id){
    //If we've already loaded it, just return it.
    if(loadedItems[id]){
        return loadedItems[id];
    }

    //If it dosn't exist in the cache, return undefined. We expect pInfo to have the list of childIDs, adoptedIDs, and disownedIDs.
    var pInfo = cache.get(id);
    if(!pInfo){
        return undefined;
    }

    if(pInfo.type && !types[pInfo.type]){
        throw new Error("Type not yet registered");
    }

    var shell = pInfo.type ? new types[pInfo.type]() : {};


    // //These are 100% of the keys the object should have. Constructor may have added more.
    // var allKeys = pInfo.childIDs.concat(pInfo.disownedIDs.concat(Object.keys(pInfo.siblingIDs)));

    // //Iterate through a list of every key that shouldn't be there
    // _.difference(Object.keys(shell), allKeys).forEach(key => {
    //     console.warn("Culling property", key);
    //     delete shell[key];
    // })

    var obj = align(shell, pInfo, "CACHE");
    obj.onLoad && obj.onLoad();
    return obj;
}

//Returns a pObject, with the source of the pObject coming from the mode
function fromModel(object, id){
 var id = id || cacheID++;

    var disownedIDs = ["id", "childIDs", "disownedIDs", "siblingIDs", "dontCache", "length"].concat(object.constructor.dontCache);

    var siblingIDs = {};
    for (var i in object) {
        if (typeof object[i] === "object" && !_.contains(disownedIDs, i)) {
            if (object[i] === object) {
                siblingIDs[i] = id;
            } else {
                if (!object[i].pInfo) {
                    object[i] = fromModel(object[i]);
                }

                siblingIDs[i] = object[i].pInfo.id;
            }
        }
    }


    var pInfo = {
        id: id,
        type: object.constructor.name,
        disownedIDs: disownedIDs,
        childIDs: _.difference(Object.keys(object), disownedIDs.concat(Object.keys(siblingIDs))).filter(function (key) {
            return !_.isFunction(object[key]);
        }), //The child ids will be all the keys of the object that don't include anything we don't want to cache, and ids we've adopted
        siblingIDs: siblingIDs
    };

    return align(object, pInfo, "MODEL");
}


function align(object, pInfo, source){
    Object.defineProperty(object, "pInfo", {value:pInfo, writeable:false});
    loadedItems[object.pInfo.id] = object;

    for(var i in object.pInfo.childIDs){
        alignChild(object, object.pInfo.childIDs[i], source);
    }

    for(var i in object.pInfo.siblingIDs){
        alignSibling(object, i, source);
    }

    cache.set(object.pInfo.id, object.pInfo);

    watchForChanges(object);

    return object;
}

function alignChild(parent, childName, source){
    var cacheKey = parent.pInfo.id + "." + childName;

    if(source === "MODEL"){
        cache.set(cacheKey, parent[childName]);
    }

    parent.__defineGetter__(childName, function(){
        return cache.get(cacheKey);
    })

    parent.__defineSetter__(childName, function(value){
        //A property that used to be a flat value has been made an object
        if(typeof value === "object" || typeof value === "function"){
            delete parent[childName];
            parent[childName] = value;
        } else {
            cache.set(cacheKey, value);
        }
        return value;
    })
}

function alignSibling(parent, siblingName, source){
    if(source === "MODEL"){
        var sibling = parent[siblingName].pInfo ? parent[siblingName] : fromModel(parent[siblingName], parent.pInfo.siblingIDs[siblingName]);
    } else if(source === "CACHE"){
        var sibling = fromCache(parent.pInfo.siblingIDs[siblingName]);
    } else {
        throw new Error("Invalid source!");
    }

    //If we define a setter, we need to define a getter.
    parent.__defineGetter__(siblingName, function(){
        return sibling;
    })

    parent.__defineSetter__(siblingName, function(value){
        delete parent[siblingName];     //Will trigger a key removal
        delete parent.pInfo.siblingIDs[siblingName]; //If we're writing a flat value
        parent[siblingName] = value;    //Will trigger a key addition, and it can decide whether to adopt it there.
        return value;
    })
}

function watchForChanges(obj){
    Object.observe(obj, changes => {
        changes.forEach(change => {
            if(!_.includes(obj.pInfo.disownedIDs, change.name)){

                if(change.type == "add" && (change.name in obj)  && !_.isFunction(obj[change.name])){
                    if(_.isObject(obj[change.name])){
                        alignSibling(obj, change.name, "MODEL");
                        obj.pInfo.siblingIDs[change.name] = obj[change.name].pInfo.id;
                    } else {
                        alignChild(obj, change.name, "MODEL");
                        obj.pInfo.childIDs.push(change.name)
                    }
                } else if (change.type == "delete"){
                    //pulls the key from the list of child keys and clears the cache property. If the child was
                    //an object tho, will rely on destroy to remove it from the cache.
                   _.pull(obj.pInfo.childIDs, change.name);
                   cache.clear(obj.pInfo.id + "." + change.name);
                }

                cache.set(obj.pInfo.id, obj.pInfo);
            }
        })
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