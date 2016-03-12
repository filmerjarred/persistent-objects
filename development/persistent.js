"use strict";

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function () {
	var types = {}; // Stores persistent types, {type.name:type}
	var globalPersistArguments; // Have to get data into constructor, can't make classes call super with data, pass using scoped vairable

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

			if (value.charAt(0) === "{" || value.charAt(0) === "[" || _.isNumeric(value) || value === "true" || value === "false") {
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

	// Proxy object has no prototype by default
	Proxy.prototype = Object.prototype;

	// We want to 'persistatize' an object before it's constructor fires, so that any propertiy changes are caught from the get go
	// The only way to get code before the contructor while still operating on the 'this' is to expect the class (as constructors can't be called as functions)
	// So we have to expect the proxy object, and do all the stuff we need to do before the class constructor

	var Persistent = (function (_Proxy) {
		_inherits(Persistent, _Proxy);

		function Persistent() {
			_classCallCheck(this, Persistent);

			var rawObject = {}; //Holds reference to sibling objects, fucntions and disowned properties
			var id = globalPersistArguments.id;
			var objectMetaData = globalPersistArguments.objectMetaData;

			objectMetaData.id = id;
			objectMetaData.rawObject = rawObject;

			// Store the object's meta data directly under it's id
			objectMetaData.save = function () {
				cache.set(id, { type: objectMetaData.type, siblingProperties: objectMetaData.siblingProperties, disownedProperties: objectMetaData.disownedProperties });
			};

			_get(Object.getPrototypeOf(Persistent.prototype), "constructor", this).call(this, {}, {
				get: function get(target, property) {
					if (property == "metaData") {
						return objectMetaData;
					} else if (property == "toString") {
						return rawObject.toString;
					} else if (property in rawObject) {
						return rawObject[property];
					} else {
						return cache.get(id + "." + property);
					}
				},
				set: function set(target, property, value, receiver) {
					var isObject = (property in rawObject);

					if (_.includes(objectMetaData.disownedProperties, property)) {
						rawObject[property] = value;
					} else if (_.isObject(value)) {
						delete model.data[id][property];

						if (value.metaData) {
							rawObject[property] = value;
							objectMetaData.siblingProperties[property] = value.metaData.id;
						} else {
							throw new Error("A cached object cannot have a non persistent object as a child. Either persist it, or add disown the property");
						}

						objectMetaData.save();
					} else if (_.isFunction(value)) {
						rawObject[property] = value;
					} else {
						delete model.data[id][property];
						cache.set(id + "." + property, value);
					}

					return true;
				},
				deleteProperty: function deleteProperty(target, property) {
					var value = rawObject[property];

					if (_.isObject(value)) {
						delete objectMetaData.siblingProperties[property];
						objectMetaData.save();
					} else {
						// It can be a child, function, object, or disowned property. Can clear it's cache key without consequence unless it's an object
						cache.clear(id + "." + property);
					}

					delete rawObject[property];

					return true;
				}
			});

			Object.defineProperty(this, "metaData", { value: objectMetaData, writeable: false });

			objectMetaData.save();
			model.data[id] = this;
		}

		// Due to proxy weirdness, there's no way to access the root type while constructing the object
		// If we extend Proxy (which we have to, to fire before construction) the object's constructor and prototype are undefined
		// It's possible to graft them back on, but we have to wrap the class execution
		return Persistent;
	})(Proxy);

	function registerType(type) {
		var typeWrapper = function typeWrapper() {
			if (!globalPersistArguments) {
				globalPersistArguments = {
					id: getId(),
					objectMetaData: { disownedProperties: ["objectMetaData", "length", "toString"], siblingProperties: {}, type: type.name }
				};
			}

			var obj = new type();

			globalPersistArguments = false;

			Object.setPrototypeOf(obj, type.prototype);
			obj.metaData.rawObject.constructor = type;

			return obj;
		};

		types[type.name] = typeWrapper;

		return typeWrapper;
	}

	// Generates a short random is for the objects
	function getId() {
		var x = 2147483648;
		return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ Date.now()).toString(36);
	}

	function loadAll() {
		// Load all cached objects. (Will not load siblings)
		for (var i in localStorage) {
			if (!_.includes(i, ".")) {
				var objectMetaData = JSON.parse(localStorage[i]);

				var type = types[objectMetaData.type];

				if (!type) {
					console.log("Types:", types);
					console.log("Type:", type);
					throw new Error("Trying to load cache before all objects are registered");
				}

				globalPersistArguments = {
					id: i,
					objectMetaData: objectMetaData
				};
				new type();
				globalPersistArguments = false;
			}
		}

		// Link all cached objects by reference
		_.forIn(model.data, function (item, id) {
			_.forIn(item.metaData.siblingProperties, function (siblingId, property) {
				item.metaData.rawObject[property] = model.data[siblingId];
			});
		});
	}

	// Export data and types
	window.model = {
		types: types,
		data: {},
		Persistent: Persistent,
		load: loadAll,
		registerType: registerType
	};
})();