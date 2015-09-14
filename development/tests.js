//babel --watch babel.tests.js --out-file tests.js

"use strict";

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

// function Wizard (name){
//     this.name = name;
//     this.friends = {};
//     this.spells = []; //works just as well with arrays!

//     this.learn = function(spell){
//         this.spells.push(spell);
//     }

//     this.befriend = function(friend){
//         this.friends[friend.name] = friend;
//     }

//     Pobject.save(name, this);
// }

var Wizard;

function registerObjects() {
    Wizard = registerType((function () {
        return (function () {
            function Wizard(name, petType) {
                _classCallCheck(this, Wizard);

                this.name = name;
                this.petType = petType || "Lost";
                this.friends = {};
                this.spells = []; //works just as well with arrays!
            }

            _createClass(Wizard, [{
                key: "learn",
                value: function learn(spell) {
                    this.spells.push(spell);
                }
            }, {
                key: "befriend",
                value: function befriend(friend) {
                    this.friends[friend.name] = friend;
                }
            }]);

            return Wizard;
        })();
    })());

    Parray = registerType((function () {
        return (function (_Array) {
            _inherits(Parray, _Array);

            function Parray() {
                _classCallCheck(this, Parray);

                _get(Object.getPrototypeOf(Parray.prototype), "constructor", this).apply(this, arguments);
            }

            return Parray;
        })(Array);
    })());

    Pobject = registerType((function () {
        return function Pobject() {
            _classCallCheck(this, Pobject);
        };
    })());
}

function emulateRefresh(done) {
    fireObjectObserves(function () {
        loadedItems = {};
        registerObjects();
        done();
    });
}

function fireObjectObserves(done) {
    setTimeout(done, 0);
}

function clearCache(done) {
    emulateRefresh(function () {
        localStorage.clear(localStorage);
        done();
    });
}

//========Feature tests==============
describe('A Pobject as represented in the readme:', function () {
    var item;
    var changed;

    beforeEach(clearCache);
    afterEach(clearCache);

    it("Should find it's properties where it left them", function (done) {
        var a = Pobject.findOrCreate("a");
        a.b = 1;

        emulateRefresh(function () {
            var a = Pobject.findOrCreate("a");
            expect(a.b).toBe(1);
            done();
        });
    });

    it("Should link it's objects by reference", function (done) {
        var a = Pobject.findOrCreate("a");
        var b = Pobject.findOrCreate("b");
        a.b = b;
        b.c = 1;

        emulateRefresh(function () {
            var a = Pobject.findOrCreate("a");
            var b = Pobject.findOrCreate("b");

            expect(a.b).toBe(b);
            expect(a.b.c).toBe(1);
            done();
        });
    });
});

describe('A wizard as represented in the readme:', function () {
    var item;
    var changed;

    beforeEach(function (done) {
        clearCache(function () {
            registerObjects();
            done();
        });
    });
    afterEach(function (done) {
        clearCache(function () {
            registerObjects();
            done();
        });
    });

    it("Should have only two iterable properties", function () {
        var hermoine = Wizard.findOrCreate("Hermoine Granger");

        var n = 0;
        for (var i in hermoine) {
            n++;
        }
        expect(n).toBe(4);
    });

    it("Should remember their pet type after a refresh", function (done) {
        var hermoine = Wizard.create("Hermoine Granger");

        hermoine.petType = "Cat";
        expect(hermoine.petType).toBe("Cat");

        emulateRefresh(function () {
            var hermoine = Wizard.find("Hermoine Granger");
            expect(hermoine.petType).toBe("Cat");
            done();
        });
    });

    it("Should be able to make and remember friends", function (done) {
        var hermoine = new Wizard("Hermoine Granger");
        var ron = new Wizard("Ron Weasly");

        ron.petType = "Lost";
        expect(ron.petType).toBe("Lost");

        hermoine.befriend(ron);
        ron.befriend(hermoine);

        hermoine.friends["Ron Weasly"].petType = "Frog";
        expect(ron.petType).toBe("Frog");

        expect(hermoine.friends["Ron Weasly"]).toBe(ron);
        expect(ron.friends["Hermoine Granger"]).toBe(hermoine);

        emulateRefresh(function () {
            var hermoine = Wizard.findOne({ name: "Hermoine Granger" });
            var ron = Wizard.findOne({ name: "Ron Weasly" });

            expect(hermoine.friends["Ron Weasly"]).toBe(ron);
            expect(ron.friends["Hermoine Granger"]).toBe(hermoine);
            expect(hermoine.friends["Ron Weasly"].petType).toBe("Frog");
            done();
        });
    });

    it("Should be able to create wizards using .create", function (done) {
        var hermoine = Wizard.create("HG", "Hermoine Granger", "Cat");

        expect(hermoine.pInfo.id).toBe("HG");
        expect(hermoine.name).toBe("Hermoine Granger");
        expect(hermoine.petType).toBe("Cat");
        expect(Wizard.items.length).toBe(1);
        expect(Wizard.items[0]).toBe(hermoine);
        expect(Wizard.wizards.length).toBe(1);
        expect(Wizard.wizards[0]).toBe(hermoine);

        emulateRefresh(function () {
            var hermoine = Wizard.find("HG");
            expect(hermoine.pInfo.id).toBe("HG");
            expect(hermoine.name).toBe("Hermoine Granger");
            expect(hermoine.petType).toBe("Cat");
            expect(Wizard.items.length).toBe(1);
            expect(Wizard.items[0]).toBe(hermoine);
            expect(Wizard.wizards.length).toBe(1);
            expect(Wizard.wizards[0]).toBe(hermoine);
            done();
        });
    });

    it("Should be able to create wizards using new", function (done) {
        var hermoine = new Wizard("Hermoine Granger", "Cat");

        expect(hermoine.name).toBe("Hermoine Granger");
        expect(hermoine.petType).toBe("Cat");

        expect(Wizard.items.length).toBe(1);
        expect(Wizard.items[0]).toBe(hermoine);
        expect(Wizard.wizards.length).toBe(1);
        expect(Wizard.wizards[0]).toBe(hermoine);

        emulateRefresh(function () {
            var hermoine = Wizard.findOne({ name: "Hermoine Granger" });

            expect(hermoine.name).toBe("Hermoine Granger");
            expect(hermoine.petType).toBe("Cat");

            expect(Wizard.items.length).toBe(1);
            expect(Wizard.items[0]).toBe(hermoine);
            expect(Wizard.wizards.length).toBe(1);
            expect(Wizard.wizards[0]).toBe(hermoine);
            done();
        });
    });

    it("Should be able to retrive wizards using .find", function (done) {
        var fred = new Wizard("Fred Weasly");
        var george = new Wizard("George Weasly");
        var hermoine = new Wizard("Hermoine Granger", "Cat");

        expect(Wizard.findOne(hermoine.pInfo.id)).toBe(hermoine);
        expect(Wizard.find({ name: /Weasly/ })[0]).toBe(fred);
        expect(Wizard.find({ name: /Weasly/ })[1]).toBe(george);

        emulateRefresh(function () {
            var fred = Wizard.findOne({ name: "Fred Weasly" });
            var george = Wizard.findOne({ name: "George Weasly" });
            var hermoine = Wizard.findOne({ name: "Hermoine Granger" });

            expect(Wizard.findOne(hermoine.pInfo.id)).toBe(hermoine);
            expect(Wizard.find({ name: /Weasly/ })[0]).toBe(fred);
            expect(Wizard.find({ name: /Weasly/ })[1]).toBe(george);

            done();
        });
    });

    it("Should be able to retrive wizards using .findOne", function (done) {
        var fred = new Wizard("Fred Weasly");
        var george = new Wizard("George Weasly");
        var hermoine = new Wizard("Hermoine Granger", "Cat");

        expect(Wizard.findOne({ name: /Weasly/ })).toBe(fred);
        expect(Wizard.findOne(fred.pInfo.id)).toBe(fred);

        emulateRefresh(function () {
            var fred = Wizard.findOne({ name: "Fred Weasly" });
            var george = Wizard.findOne({ name: "George Weasly" });
            var hermoine = Wizard.findOne({ name: "Hermoine Granger" });

            expect(Wizard.findOne({ name: /Weasly/ })).toBe(fred);
            expect(Wizard.findOne(fred.pInfo.id)).toBe(fred);

            done();
        });
    });

    it("Should be able to remove wizards using remove(item)", function (done) {
        var fred = new Wizard("Fred Weasly");
        var george = new Wizard("George Weasly");

        fred.brother = george;

        expect(Wizard.items.length).toBe(2);
        expect(cache.get(fred.pInfo.id + ".name")).toBe("Fred Weasly");
        Wizard.remove(fred);
        expect(cache.get(fred.pInfo.id + ".name")).toBe(null);
        expect(Wizard.items.length).toBe(1);
        expect(Wizard.findOne({ name: "Fred Weasly" })).toBe(undefined);
        expect(Wizard.findOne({ name: "George Weasly" })).toBe(george);

        emulateRefresh(function () {
            expect(Wizard.items.length).toBe(1);
            expect(Wizard.findOne({ name: "Fred Weasly" })).toBe(undefined);
            done();
        });
    });

    it("Should be able to remove wizards using remove(item.id)", function (done) {
        var fred = new Wizard("Fred Weasly");
        var george = new Wizard("George Weasly");

        fred.brother = george;

        expect(Wizard.items.length).toBe(2);
        expect(cache.get(fred.pInfo.id + ".name")).toBe("Fred Weasly");
        Wizard.remove(fred.pInfo.id);
        expect(cache.get(fred.pInfo.id + ".name")).toBe(null);
        expect(Wizard.items.length).toBe(1);
        expect(Wizard.findOne({ name: "Fred Weasly" })).toBe(undefined);
        expect(Wizard.findOne({ name: "George Weasly" })).toBe(george);

        emulateRefresh(function () {
            expect(Wizard.items.length).toBe(1);
            expect(Wizard.findOne({ name: "Fred Weasly" })).toBe(undefined);
            done();
        });
    });

    it("Should be able to remove wizards using obliterate(item.id)", function (done) {
        var fred = new Wizard("Fred Weasly");
        var george = new Wizard("George Weasly");

        fred.brother = george;

        expect(Wizard.items.length).toBe(2);
        expect(cache.get(fred.pInfo.id + ".name")).toBe("Fred Weasly");
        expect(cache.get(george.pInfo.id + ".name")).toBe("George Weasly");
        Wizard.obliterate(fred);
        expect(cache.get(fred.pInfo.id + ".name")).toBe(null);
        expect(cache.get(george.pInfo.id + ".name")).toBe(null);
        expect(Wizard.items.length).toBe(0);
        expect(Wizard.findOne({ name: "Fred Weasly" })).toBe(undefined);
        expect(Wizard.findOne({ name: "George Weasly" })).toBe(undefined);

        emulateRefresh(function () {
            expect(Wizard.findOne({ name: "Fred Weasly" })).toBe(undefined);
            expect(Wizard.findOne({ name: "George Weasly" })).toBe(undefined);
            done();
        });
    });
});

describe("A Persistient Object", function () {
    beforeEach(clearCache);
    afterEach(clearCache);

    it("Should get it's properties direct from localStorage", function (done) {
        expect(localStorage.getItem("A.b")).toBe(null);
        var a = Pobject.create("A");
        a.b = 1;
        fireObjectObserves(function () {
            expect(a.b).toBe(1);
            localStorage.setItem("A.b", 2);
            expect(a.b).toBe(2);
            done();
        });
    });

    it("Should deal with adopting objects that are already cached", function (done) {
        var a = Pobject.create("A");
        var b = Pobject.create("B");
        var c = Pobject.create("C");
        a.b = b;
        a.c = c;
        expect(a.b).toBe(b);
        expect(a.c).toBe(c);

        a.b.value = 1;
        a.c.value = 2;

        expect(a.b.value).toBe(1);
        expect(a.c.value).toBe(2);

        emulateRefresh(function () {
            var a = Pobject.load("A");
            var b = Pobject.load("B");
            var c = Pobject.load("C");
            expect(a.b).toBe(b);
            expect(a.c).toBe(c);
            expect(a.b.value).toBe(1);
            expect(a.c.value).toBe(2);
            done();
        });
    });

    it("Should deal with having starting with objects to adopt", function (done) {
        var b = Pobject.create("B");

        var A = function A() {
            _classCallCheck(this, A);

            this.b = b;
        };

        A = registerType(A);

        b.c = 1;

        var a = A.create("t");

        expect(a.b).toBe(b);

        emulateRefresh(function () {
            var A = function A() {
                _classCallCheck(this, A);

                this.b = b;
            };

            A = registerType(A);
            var a = A.find("t");
            expect(a.b.c).toBe(1);
            done();
        });
    });

    it("Should deal with adding objects that contain objects are already cached", function (done) {
        var a = Pobject.create("A");
        var b = Pobject.create("B");

        a.b = { b: b };
        b.c = 1;
        expect(a.b.b.c).toBe(1);

        emulateRefresh(function () {
            var a = Pobject.load("A");
            expect(a.b.b.c).toBe(1);
            done();
        });
    });

    it("Should delete the property in the chache if it's deleted in the model", function (done) {
        var a = Pobject.create("A");
        a.b = 1;
        expect(a.b).toBe(1);

        fireObjectObserves(function () {
            expect(localStorage.getItem("A.b")).toBe('1');

            delete a.b;

            fireObjectObserves(function () {
                expect(cache.get("A").childIDs).toEqual([]);
                done();
            });
        });
    });

    it("Should override anything before it when created", function () {
        var a = Pobject.create("A");
        a.b = 1;

        var a = Pobject.create("a");
        expect(a.b).toBe(undefined);
    });

    it("Should be undefined if it dosn't exist", function () {
        var a = Pobject.load("a");
        expect(a).toBe(undefined);
    });

    it("Should cast numeric strings to integers", function (done) {
        var a = Pobject.create("A");
        a.b = 1;
        a.c = "1";
        expect(a.b).toBe(1);
        expect(_.isNumber(a.b)).toBe(true);
        expect(a.c).toBe("1");
        expect(_.isNumber(a.c)).toBe(false);

        emulateRefresh(function () {
            var a = Pobject.load("A");

            expect(a.b).toBe(1);
            expect(_.isNumber(a.b)).toBe(true);
            expect(a.c).toBe(1);
            expect(_.isNumber(a.c)).toBe(true);
            done();
        });
    });

    it("Should 'load or new' an item when using findOrCreate", function (done) {
        expect(Pobject.load("A")).toBe(undefined);

        var a = Pobject.findOrCreate("A");
        expect(a.b).toBe(undefined);
        a.b = 1;

        emulateRefresh(function () {
            expect(Pobject.findOrCreate("A").b).toBe(1);

            emulateRefresh(function () {
                var a = Pobject.findOrCreate("A");
                expect(a.b).toBe(1);
                done();
            });
        });
    });

    it("Should create and load deeply nested circular objects", function (done) {
        var A = function A(id) {
            _classCallCheck(this, A);

            this.value;
            this.bs = {};
        };

        A = registerType(A);

        var B = function B(id) {
            _classCallCheck(this, B);

            this.value;
            this.cs = {};
        };

        B = registerType(B);

        var C = function C(id) {
            _classCallCheck(this, C);

            this.value;
            this.as = {};
        };

        C = registerType(C);

        var a = A.create("a");
        var b = B.create("b");
        var c = C.create("c");

        a.bs['b'] = b;
        b.cs['c'] = c;
        c.as['a'] = a;

        a.value = 1;
        a.bs.b.value = 2;
        a.bs.b.cs.c.value = 3;
        a.bs.b.cs.c.as.a.value = 4;

        emulateRefresh(function () {
            var a = A.load("a");
            var b = B.load("b");
            var c = C.load("c");

            expect(a.value).toBe(4);
            expect(b.value).toBe(2);
            expect(c.value).toBe(3);
            done();
        });
    });

    it("Should handle object properties changing to other objects", function (done) {
        var a = Pobject.create("A");
        var b = Pobject.create("B");
        var c = Pobject.create("C");
        var d = Pobject.create("D");

        a.b = b;
        a.c = { c: c };

        b.value = 1;
        c.value = 2;
        d.value = 3;

        expect(a.b.value).toBe(1);
        expect(a.c.c.value).toBe(2);
        expect(d.value).toBe(3);

        emulateRefresh(function () {
            var a = Pobject.load("A");
            var b = Pobject.load("B");
            var c = Pobject.load("C");
            var d = Pobject.load("D");

            expect(a.b.value).toBe(1);
            expect(a.c.c.value).toBe(2);
            expect(d.value).toBe(3);

            a.b = d;
            a.c.c = d;

            emulateRefresh(function () {
                var a = Pobject.load("A");

                expect(a.b.value).toBe(3);
                expect(a.c.c.value).toBe(3);

                done();
            });
        });
    });

    it("Should handle adopted objects being changed", function (done) {
        var a = Pobject.create("A");
        var b = Pobject.create("B");
        var c = Pobject.create("C");

        a.b = b;
        b.value = 1;
        c.value = 2;

        emulateRefresh(function () {
            var a = Pobject.load("A");
            expect(a.b.value).toBe(1);
            a.b = c;

            emulateRefresh(function () {
                var a = Pobject.load("A");
                expect(a.b.value).toBe(2);
                done();
            });
        });
    });

    it("Should handle having a number property changed to an object", function (done) {

        var a = Pobject.create("A");

        a.b = 1;

        fireObjectObserves(function () {
            expect(a.b).toBe(1);
            a.b = { d: 1 };

            expect(a.b.d).toBe(1);

            fireObjectObserves(function () {
                expect(localStorage.getItem(a.b.pInfo.id + ".d")).toBe('1');
                done();
            });
        });
    });

    it("Should handle having a object property changed to a number", function (done) {
        var a = Pobject.create("A");

        a.c = { d: 1 };

        fireObjectObserves(function () {
            expect(a.c.d).toEqual(1);

            a.c = 1;

            expect(a.c).toBe(1);

            fireObjectObserves(function () {
                expect(localStorage.getItem("A.c")).toBe('1');
                done();
            });
        });
    });

    it("Should handle adopted objects changed to flat values and vice versa", function (done) {
        var a = Pobject.create("A");
        var b = Pobject.create("B");

        a.b = b;
        a.c = 1;

        emulateRefresh(function () {
            var a = Pobject.load("A");
            var b = a.b;
            a.b = a.c;
            a.c = b;

            expect(a.b).toBe(1);
            expect(a.c).toBe(b);
            emulateRefresh(function () {
                expect(localStorage.getItem("A.c")).not.toBe("1");
                var a = Pobject.load("A");
                var b = Pobject.load("B");
                expect(a.b).toBe(1);
                expect(a.c).toBe(b);
                done();
            });
        });
    });
});

// describe("A Persistient Array", function(){
//     beforeEach(clearCache)
//     afterEach(clearCache)

//     it("Should give the array persistient info", function(){
//         var a = new Parray("A");
//         expect(a.pInfo.id).toBe("A")
//     })

//     it("Should store it's indexes to the cache it's properties to the localStorage", function(){
//         expect(localStorage.getItem("A.0")).toBe(null);
//         expect(localStorage.getItem("A.1")).toBe(null);

//         var a = new Parray.save("A", [1,2]);

//         expect(localStorage.getItem("A.0")).toBe('1');
//         expect(localStorage.getItem("A.1")).toBe('2');
//     })

//     it("Should allow for the adding of new indexes", function(done){
//         expect(localStorage.getItem("A.0")).toBe(null);
//         expect(localStorage.getItem("A.1")).toBe(null);

//         var a = new Parray("A");

//         a.push(1);
//         a.push(2);

//         fireObjectObserves(function(){
//             expect(localStorage.getItem("A.0")).toBe('1');
//             expect(localStorage.getItem("A.1")).toBe('2');
//             done();
//         })
//     })

//     it("Should account for the shuffling of those indexes", function(){
//         expect(localStorage.getItem("A.0")).toBe(null);
//         expect(localStorage.getItem("A.1")).toBe(null);
//         expect(localStorage.getItem("A.2")).toBe(null);
//         expect(localStorage.getItem("A.3")).toBe(null);
//         expect(localStorage.getItem("A.4")).toBe(null);

//         var a = Parray.save("A", [2,1,5,3,4]);

//         a.sort();

//         expect(localStorage.getItem("A.0")).toBe('1');
//         expect(localStorage.getItem("A.1")).toBe('2');
//         expect(localStorage.getItem("A.2")).toBe('3');
//         expect(localStorage.getItem("A.3")).toBe('4');
//         expect(localStorage.getItem("A.4")).toBe('5');
//     })

//     it("Should adopt objects and other arrays", function(done){
//         var b = Pobject.create("B");
//         var c = Parray.create("C");
//         var a = Parray.save("A", [b, c]);

//         expect(a[0]).toBe(b);
//         expect(a[1]).toBe(c);

//         expect(a.pInfo.siblingIDs).toEqual({0:"B", 1:"C"});

//         a.reverse();

//         expect(a[0]).toBe(c);
//         expect(a[1]).toBe(b);

//         emulateRefresh(function(){
//             var a = Parray.load("A");
//             var b = Pobject.load("B");
//             var c = Parray.load("C");

//             expect(a.pInfo.siblingIDs).toEqual({0:"C", 1:"B"});

//             expect(a[0]).toBe(c);
//             expect(a[1]).toBe(b);

//             a.reverse();

//             expect(a[0]).toBe(b);
//             expect(a[1]).toBe(c);

//             done();
//         })
//     })

//     it("Should account for values changing types ", function(done){
//         var persObject = new Pobject("B");
//         var persArray = new Parray("C");
//         var object = {};
//         var array = [];
//         var string = "Death is lighter than a feather";
//         var integer = 1;

//         var a = Parray.save("A", [persObject, persArray, object, array, string, integer]);

//         expect(a[0]).toBe(persObject);
//         expect(a[1]).toBe(persArray);
//         expect(a[2]).toBe(object);
//         expect(a[3]).toBe(array);
//         expect(a[4]).toBe(string);
//         expect(a[5]).toBe(integer);

//         a.reverse();

//         expect(a[5]).toBe(persObject);
//         expect(a[4]).toBe(persArray);
//         expect(a[3]).toBe(object);
//         expect(a[2]).toBe(array);
//         expect(a[1]).toBe(string);
//         expect(a[0]).toBe(integer);

//         fireObjectObserves(function(){
//             var a = Parray.load("A");

//             expect(a[5]).toBe(persObject);
//             expect(a[4]).toBe(persArray);
//             expect(a[3]).toBe(object);
//             expect(a[2]).toBe(array);
//             expect(a[1]).toBe(string);
//             expect(a[0]).toBe(integer);

//             done()
//         })
//     })
// })