"use strict";

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
    // Wizard = registerType((function(){
    //     return class Wizard{
    //         constructor(name, petType){
    //             this.name = name;
    //             this.petType = petType || "Lost"
    //             this.friends = {};
    //             this.spells = []; //works just as well with arrays!
    //             this.recursiveProperty = this;
    //         }
    //
    //         learn(spell){
    //             this.spells.push(spell);
    //         }
    //
    //         befriend(friend){
    //             this.friends[friend.name] = friend;
    //         }
    //     }
    // })())
    //
    // Parray = registerType((function(){
    //     return class Parray extends Array {
    //     }
    // })())
    //
    // Pobject = registerType((function(){
    //     return class Pobject{
    //     }
    // })())

    A = model.registerType((function () {
        return (function (_model$Persistent) {
            _inherits(A, _model$Persistent);

            function A() {
                _classCallCheck(this, A);

                _get(Object.getPrototypeOf(A.prototype), "constructor", this).call(this);
            }

            return A;
        })(model.Persistent);
    })());

    model.load();
}

function emulateRefresh(done) {
    fireObjectObserves(function () {

        model.data = {};
        types = {};

        registerObjects();
        done();
    });
}

function fireObjectObserves(done) {
    setTimeout(done, 0);
}

function clearCache(done) {
    localStorage.clear();
    emulateRefresh(function () {
        localStorage.clear();
        done();
    });
}

//========Feature tests==============
describe('A persistent object as represented in the readme:', function () {
    var item;
    var changed;

    beforeEach(clearCache);
    afterEach(clearCache);

    it("Should find it's properties where it left them", function (done) {
        var a = new A();
        a.b = 1;

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            expect(a.b).toBe(1);
            done();
        });
    });

    it("Should link it's objects by reference", function (done) {
        var a = new A();
        var b = new A();
        a.b = b;
        b.c = 1;

        var bid = b.metaData.id;

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            b = model.data[b.metaData.id];

            expect(a.b).toBe(b);
            expect(a.b.c).toBe(1);
            done();
        });
    });
});

//
// describe('A wizard', function() {
//     var item;
//     var changed;
//
//     beforeEach(function(done){
//         clearCache(function(){
//             registerObjects();
//             done();
//         });
//     })
//
//     afterEach(function(done){
//         clearCache(function(){
//             registerObjects();
//             done();
//         });
//     })
//
//     it("Should have only two iterable properties", function(){
//         var hermoine = Wizard.findOrCreate("Hermoine Granger");
//
//         var n = 0;
//         for(var i in hermoine){
//             n++;
//         }
//         expect(n).toBe(5);
//     })
//
//     it("Should remember their pet type after a refresh", function(done){
//         var hermoine = Wizard.create("Hermoine Granger")
//
//         hermoine.petType = "Cat";
//         expect(hermoine.petType).toBe("Cat");
//
//         emulateRefresh(function(){
//             var hermoine = Wizard.find("Hermoine Granger");
//             expect(hermoine.petType).toBe("Cat");
//             done()
//         });
//     })
//
//     it("Should be able to make and remember friends", function(done){
//         var hermoine = new Wizard("Hermoine Granger");
//         var ron = new Wizard("Ron Weasly");
//
//         ron.petType = "Lost";
//         expect(ron.petType).toBe("Lost");
//
//         hermoine.befriend(ron);
//         ron.befriend(hermoine);
//
//         hermoine.friends["Ron Weasly"].petType = "Frog"
//         expect(ron.petType).toBe("Frog");
//
//         expect(hermoine.friends["Ron Weasly"]).toBe(ron);
//         expect(ron.friends["Hermoine Granger"]).toBe(hermoine);
//
//         emulateRefresh(function(){
//             var hermoine = Wizard.findOne({name:"Hermoine Granger"});
//             var ron = Wizard.findOne({name:"Ron Weasly"});
//
//             expect(hermoine.friends["Ron Weasly"]).toBe(ron);
//             expect(ron.friends["Hermoine Granger"]).toBe(hermoine);
//             expect(hermoine.friends["Ron Weasly"].petType).toBe("Frog");
//             done();
//         });
//     })
//
//     it("Should be able to learn spells", function(done){
//         var hermoine = new Wizard("Hermoine Granger");
//
//         hermoine.learn("Expeco Petronum")
//         hermoine.learn("Wingardium Leviosah");
//         expect(hermoine.spells.length).toBe(2);
//         expect(hermoine.spells[0]).toBe("Expeco Petronum");
//         expect(hermoine.spells[1]).toBe("Wingardium Leviosah");
//
//         emulateRefresh(function(){
//             var hermoine = Wizard.findOne({name:"Hermoine Granger"});
//
//             expect(hermoine.spells.length).toBe(2);
//             expect(hermoine.spells[0]).toBe("Expeco Petronum");
//             expect(hermoine.spells[1]).toBe("Wingardium Leviosah");
//
//             hermoine.learn("Stupify");
//
//             expect(hermoine.spells.length).toBe(3);
//             expect(hermoine.spells[2]).toBe("Stupify");
//
//             done();
//         });
//     })
//
//     it("Should be able to create wizards using .create", function(done){
//         var hermoine = Wizard.create("HG", "Hermoine Granger", "Cat");
//
//         expect(hermoine.pInfo.id).toBe("HG");
//         expect(hermoine.name).toBe("Hermoine Granger");
//         expect(hermoine.petType).toBe("Cat");
//         expect(Wizard.items.length).toBe(1);
//         expect(Wizard.items[0]).toBe(hermoine);
//         expect(Wizard.wizards.length).toBe(1);
//         expect(Wizard.wizards[0]).toBe(hermoine);
//
//         emulateRefresh(function(){
//             var hermoine = Wizard.find("HG");
//             expect(hermoine.pInfo.id).toBe("HG");
//             expect(hermoine.name).toBe("Hermoine Granger");
//             expect(hermoine.petType).toBe("Cat");
//             expect(Wizard.items.length).toBe(1);
//             expect(Wizard.items[0]).toBe(hermoine);
//             expect(Wizard.wizards.length).toBe(1);
//             expect(Wizard.wizards[0]).toBe(hermoine);
//             done();
//         })
//     })
//
//     it("Should be able to create wizards using new", function(done){
//         var hermoine = new Wizard("Hermoine Granger", "Cat");
//
//         expect(hermoine.name).toBe("Hermoine Granger");
//         expect(hermoine.petType).toBe("Cat");
//
//         expect(Wizard.items.length).toBe(1);
//         expect(Wizard.items[0]).toBe(hermoine);
//         expect(Wizard.wizards.length).toBe(1);
//         expect(Wizard.wizards[0]).toBe(hermoine);
//
//         emulateRefresh(function(){
//             var hermoine = Wizard.findOne({name:"Hermoine Granger"});
//
//             expect(hermoine.name).toBe("Hermoine Granger");
//             expect(hermoine.petType).toBe("Cat");
//
//             expect(Wizard.items.length).toBe(1);
//             expect(Wizard.items[0]).toBe(hermoine);
//             expect(Wizard.wizards.length).toBe(1);
//             expect(Wizard.wizards[0]).toBe(hermoine);
//             done();
//         })
//     })
//
//     it("Should be able to retrive wizards using .find", function(done){
//         var fred = new Wizard("Fred Weasly");
//         var george = new Wizard("George Weasly");
//         var hermoine = new Wizard("Hermoine Granger", "Cat");
//
//         expect(Wizard.findOne(hermoine.pInfo.id)).toBe(hermoine);
//         expect(Wizard.find({name: /Weasly/})[0]).toBe(fred);
//         expect(Wizard.find({name: /Weasly/})[1]).toBe(george);
//
//         emulateRefresh(function(){
//             var fred = Wizard.findOne({name:"Fred Weasly"});
//             var george = Wizard.findOne({name:"George Weasly"});
//             var hermoine = Wizard.findOne({name:"Hermoine Granger"});
//
//             expect(Wizard.findOne(hermoine.pInfo.id)).toBe(hermoine);
//             expect(Wizard.find({name: /Weasly/})[0]).toBe(fred);
//             expect(Wizard.find({name: /Weasly/})[1]).toBe(george);
//
//             done();
//         })
//     })
//
//     it("A found wizard should be of the type, wizard", function(done){
//         var george = new Wizard("George Weasly");
//
//         expect(george.constructor.name).toBe("Wizard");
//         expect(Wizard.find({name: /Weasly/})[0].constructor.name).toBe("Wizard");
//
//         emulateRefresh(function(){
//             var george = Wizard.findOne({name:"George Weasly"});
//
//             expect(george.constructor.name).toBe("Wizard");
//             expect(Wizard.find({name: /Weasly/})[0].constructor.name).toBe("Wizard");
//
//             done();
//         })
//     })
//
//     it("Should be able to retrive wizards using .findOne", function(done){
//         var fred = new Wizard("Fred Weasly");
//         var george = new Wizard("George Weasly");
//         var hermoine = new Wizard("Hermoine Granger", "Cat");
//
//         expect(Wizard.findOne({name: /Weasly/})).toBe(fred);
//         expect(Wizard.findOne(fred.pInfo.id)).toBe(fred);
//
//         emulateRefresh(function(){
//             var fred = Wizard.findOne({name:"Fred Weasly"});
//             var george = Wizard.findOne({name:"George Weasly"});
//             var hermoine = Wizard.findOne({name:"Hermoine Granger"});
//
//             expect(Wizard.findOne({name: /Weasly/})).toBe(fred);
//             expect(Wizard.findOne(fred.pInfo.id)).toBe(fred);
//
//             done()
//         })
//     })
//
//     it("Should be able to remove wizards using remove(item)", function(done){
//         var fred = new Wizard("Fred Weasly");
//         var george = new Wizard("George Weasly");
//
//         fred.brother = george;
//
//         expect(Wizard.items.length).toBe(2);
//         expect(cache.get(fred.pInfo.id + ".name")).toBe("Fred Weasly");
//         Wizard.remove(fred);
//         expect(cache.get(fred.pInfo.id + ".name")).toBe(null);
//         expect(Wizard.items.length).toBe(1);
//         expect(Wizard.findOne({name:"Fred Weasly"})).toBe(undefined);
//         expect(Wizard.findOne({name:"George Weasly"})).toBe(george);
//
//         emulateRefresh(function(){
//             expect(Wizard.items.length).toBe(1);
//             expect(Wizard.findOne({name:"Fred Weasly"})).toBe(undefined);
//             done();
//         })
//     })
//
//     it("Should be able to remove wizards using remove(item.id)", function(done){
//         var fred = new Wizard("Fred Weasly");
//         var george = new Wizard("George Weasly");
//
//         fred.brother = george;
//
//         expect(Wizard.items.length).toBe(2);
//         expect(cache.get(fred.pInfo.id + ".name")).toBe("Fred Weasly");
//         Wizard.remove(fred.pInfo.id);
//         expect(cache.get(fred.pInfo.id + ".name")).toBe(null);
//         expect(Wizard.items.length).toBe(1);
//         expect(Wizard.findOne({name:"Fred Weasly"})).toBe(undefined);
//         expect(Wizard.findOne({name:"George Weasly"})).toBe(george);
//
//         emulateRefresh(function(){
//             expect(Wizard.items.length).toBe(1);
//             expect(Wizard.findOne({name:"Fred Weasly"})).toBe(undefined);
//             done();
//         })
//     })
//
//     it("Should be able to remove wizards using obliterate(item.id)", function(done){
//         var fred = new Wizard("Fred Weasly");
//         var george = new Wizard("George Weasly");
//
//         fred.brother = george;
//
//         expect(Wizard.items.length).toBe(2);
//         expect(cache.get(fred.pInfo.id + ".name")).toBe("Fred Weasly");
//         expect(cache.get(george.pInfo.id + ".name")).toBe("George Weasly");
//         Wizard.obliterate(fred);
//         expect(cache.get(fred.pInfo.id + ".name")).toBe(null);
//         expect(cache.get(george.pInfo.id + ".name")).toBe(null);
//         expect(Wizard.items.length).toBe(0);
//         expect(Wizard.findOne({name:"Fred Weasly"})).toBe(undefined);
//         expect(Wizard.findOne({name:"George Weasly"})).toBe(undefined);
//
//         emulateRefresh(function(){
//             expect(Wizard.findOne({name:"Fred Weasly"})).toBe(undefined);
//             expect(Wizard.findOne({name:"George Weasly"})).toBe(undefined);
//             done();
//         })
//     })
// })
//
//
describe("A Persistent Object", function () {
    beforeEach(clearCache);
    afterEach(clearCache);

    it("Should get it's properties direct from localStorage", function (done) {
        var a = new A();
        a.b = 1;

        fireObjectObserves(function () {
            expect(a.b).toBe(1);
            localStorage.setItem(a.metaData.id + ".b", 2);
            expect(a.b).toBe(2);
            done();
        });
    });

    it("Should deal with adopting objects that are already cached", function (done) {
        var a = new A();
        var b = new A();
        var c = new A();
        a.b = b;
        a.c = c;
        expect(a.b).toBe(b);
        expect(a.c).toBe(c);

        a.b.value = 1;
        a.c.value = 2;

        expect(a.b.value).toBe(1);
        expect(a.c.value).toBe(2);

        var aid = a.metaData.id;
        var bid = b.metaData.id;
        var cid = c.metaData.id;

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            b = model.data[b.metaData.id];
            c = model.data[c.metaData.id];

            expect(a.b).toBe(b);
            expect(a.c).toBe(c);
            expect(a.b.value).toBe(1);
            expect(a.c.value).toBe(2);
            done();
        });
    });
    //
    it("Should deal with having starting with objects to adopt", function (done) {
        var a = new A();
        a.c = 1;

        var B = (function (_model$Persistent2) {
            _inherits(B, _model$Persistent2);

            function B() {
                _classCallCheck(this, B);

                _get(Object.getPrototypeOf(B.prototype), "constructor", this).call(this);
                this.a = a;
            }

            return B;
        })(model.Persistent);

        B = model.registerType(B);

        var b = new B();

        expect(b.a).toBe(a);

        done();
    });

    it("Should deal with adding objects that contain objects are already cached", function (done) {
        var a = new A();
        var b = new A();
        var c = new A();

        b.c = c;
        a.b = b;
        c.d = 1;

        expect(a.b.c.d).toBe(1);

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            expect(a.b.c.d).toBe(1);
            done();
        });
    });

    it("Should deal with recursive objects", function (done) {
        var a = new A();
        var b = new A();

        a.a = a;
        b.a = a;
        a.b = b;

        expect(a.a).toBe(a);
        expect(b.a).toBe(a);
        expect(a.b).toBe(b);

        var bid = b.metaData.id;

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            b = model.data[b.metaData.id];

            expect(a.a).toBe(a);
            expect(b.a).toBe(a);
            expect(a.b).toBe(b);

            done();
        });
    });

    it("Should correctly store booleans", function (done) {
        var a = new A();

        a.b = false;
        expect(a.b).toBe(false);

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            expect(a.b).toBe(false);
            done();
        });
    });

    it("Should delete the property in the chache if it's deleted in the model", function (done) {
        var a = new A();
        a.b = 1;
        expect(a.b).toBe(1);

        fireObjectObserves(function () {
            expect(localStorage.getItem(a.metaData.id + ".b")).toBe('1');

            delete a.b;

            fireObjectObserves(function () {
                expect(localStorage.getItem(a.metaData.id + ".b")).toBe(null);
                done();
            });
        });
    });

    it("Should cast numeric strings to integers", function (done) {
        var a = new A();

        a.b = 1;
        a.c = "1";

        expect(a.b).toBe(1);
        expect(_.isNumber(a.b)).toBe(true);
        expect(a.c).toBe(1);
        expect(_.isNumber(a.c)).toBe(true);

        emulateRefresh(function () {
            a = model.data[a.metaData.id];

            expect(a.b).toBe(1);
            expect(_.isNumber(a.b)).toBe(true);
            expect(a.c).toBe(1);
            expect(_.isNumber(a.c)).toBe(true);
            done();
        });
    });

    it("Should handle object properties changing to other objects", function (done) {
        var a = new A();
        var b = new A();
        var c = new A();

        a.b = 1;
        a.c = c;

        expect(a.b).toBe(1);
        expect(a.c).toBe(c);

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            b = model.data[b.metaData.id];
            c = model.data[c.metaData.id];

            expect(a.b).toBe(1);
            expect(a.c).toBe(c);

            a.b = c;
            a.c = 1;

            emulateRefresh(function () {
                a = model.data[a.metaData.id];
                b = model.data[b.metaData.id];
                c = model.data[c.metaData.id];

                expect(a.b).toBe(c);
                expect(a.c).toBe(1);

                done();
            });
        });
    });

    // Fails, as we don't check for property being a function first
    it("Should handle having a property changed to a function", function (done) {
        var a = new A();
        a.b = 1;

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            expect(a.b).toBe(1);

            a.b = function () {
                return 1;
            };

            expect(a.b()).toBe(1);

            emulateRefresh(function () {
                a = model.data[a.metaData.id];

                expect(a.b).toBe(undefined);
                done();
            });
        });
    });

    // Fails, as no current way of knowing if a string if a boolean when getting from cache
    it("Should correctly store strings named after booleans", function (done) {
        var a = new A();

        a.b = "false";
        expect(a.b).toBe("false");

        emulateRefresh(function () {
            a = model.data[a.metaData.id];
            expect(a.b).toBe("false");
            done();
        });
    });

    // Fails, as no current way of knowing if a string if a boolean when getting from cache
    it("Should be able to to string without dying", function (done) {
        var a = new A();
        a.toString();
    });

    //
    //     it("Should handle being constructed with a function", function(done){
    //
    //         class A{
    //             constructor(){
    //                 this.b = function(){
    //                     return 1;
    //                 }
    //             }
    //         }
    //
    //         A.dontCache = ["b"]
    //
    //         var AClass = registerType(A);
    //
    //         AClass.model.load();
    //
    //         var a = AClass.create("Asdf");
    //
    //         expect(a.b()).toBe(1);
    //
    //         expect(a.pInfo.childIDs.length).toBe(0);
    //         expect(_.keys(a.pInfo.siblingIDs).length).toBe(0);
    //
    //         emulateRefresh(function(){
    //             AClass = registerType(A);
    //             AClass.model.load();
    //
    //             var a = AClass.load("Asdf");
    //             expect(a.b()).toBe(1);
    //
    //             expect(a.pInfo.childIDs.length).toBe(0);
    //             expect(_.keys(a.pInfo.siblingIDs).length).toBe(0);
    //
    //             done()
    //         })
    //     })
    //
    //     it("Should handle adopted objects changed to flat values and vice versa", function(done){
    //         var a = Pobject.create("A");
    //         var b = Pobject.create("B");
    //
    //         a.b = b;
    //         a.c = 1;
    //
    //         emulateRefresh(function(){
    //             var a = Pobject.load("A");
    //             var b = a.b;
    //             a.b = a.c;
    //             a.c = b;
    //
    //             expect(a.b).toBe(1);
    //             expect(a.c).toBe(b);
    //             emulateRefresh(function(){
    //                 expect(localStorage.getItem("A.c")).not.toBe("1")
    //                 var a = Pobject.load("A");
    //                 var b = Pobject.load("B");
    //                 expect(a.b).toBe(1);
    //                 expect(a.c).toBe(b);
    //                 done();
    //             })
    //         })
    //     })
});