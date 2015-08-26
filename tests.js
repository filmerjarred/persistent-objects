"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

var Wizard = (function (_Persistient) {
    _inherits(Wizard, _Persistient);

    function Wizard(name) {
        _classCallCheck(this, Wizard);

        _get(Object.getPrototypeOf(Wizard.prototype), "constructor", this).call(this, name);
        this.name = name;
        this.friends = {};
    }

    _createClass(Wizard, [{
        key: "befriend",
        value: function befriend(friend) {
            this.friends[friend.name] = friend;
        }
    }]);

    return Wizard;
})(Persistient);

registerType(Wizard);

function emulateRefresh(done) {
    fireObjectObserves(function () {
        loadedItems = {};
        done();
    });
}

function fireObjectObserves(done) {
    setTimeout(done, 0);
}

describe('A wizard:', function () {
    var item;
    var changed;

    afterEach(function (done) {
        emulateRefresh(function () {
            localStorage.clear(localStorage);
            done();
        });
    });

    it("Should have only two iterable properties", function () {
        var hermoine = new Wizard("Hermoine Granger");

        var n = 0;
        for (var i in hermoine) {
            n++;
        }
        expect(n).toBe(2);
    });

    it("Should remember their name after a refresh", function (done) {
        var hermoine = Wizard.create("Hermoine Granger");

        expect(hermoine.name).toBe("Hermoine Granger");

        emulateRefresh(function () {
            var hermoine = Wizard.load("Hermoine Granger");
            expect(hermoine.name).toBe("Hermoine Granger");
            done();
        });
    });

    it("Should be able to make and remember friends", function (done) {
        var hermoine = Wizard.create("Hermoine Granger");
        var ron = Wizard.create("Ron Weasly");

        ron.petType = "Lost";
        expect(ron.petType).toBe("Lost");

        hermoine.befriend(ron);
        ron.befriend(hermoine);

        hermoine.friends["Ron Weasly"].petType = "Frog";
        expect(ron.petType).toBe("Frog");

        expect(hermoine.friends["Ron Weasly"]).toBe(ron);
        expect(ron.friends["Hermoine Granger"]).toBe(hermoine);

        emulateRefresh(function () {
            var hermoine = Wizard.load("Hermoine Granger");
            var ron = Wizard.load("Ron Weasly");

            expect(hermoine.friends["Ron Weasly"]).toBe(ron);
            expect(ron.friends["Hermoine Granger"]).toBe(hermoine);
            expect(hermoine.friends["Ron Weasly"].petType).toBe("Frog");
            done();
        });
    });

    it("Should be able to noad", function (done) {
        expect(Wizard.load("Harry Potter")).toBe(undefined);

        var harry = Wizard.loadOrCreate("Harry Potter");

        expect(harry.petType).toBe(undefined);
        harry.petType = "Owl";

        emulateRefresh(function () {
            expect(Wizard.load("Harry Potter").petType).toBe("Owl");

            emulateRefresh(function () {
                var harry = Wizard.loadOrCreate("Harry Potter");
                expect(harry.petType).toBe("Owl");
                done();
            });
        });
    });
});

describe("A muggle:", function () {
    afterEach(function (done) {
        emulateRefresh(function () {
            localStorage.clear(localStorage);
            done();
        });
    });

    it("Should save and load", function () {
        var jarred = { age: 21 };
        Persistient.save("Jarred Filmer", jarred); //The id, and the object you want to keep around.

        jarred.age++;

        emulateRefresh(function () {
            var jarred = Persistient.load("Jarred Filmer");

            expect(jarred.age).toBe(22);
        });
    });
});

describe("A Persistient Object", function () {
    afterEach(function (done) {
        emulateRefresh(function () {
            localStorage.clear(localStorage);
            done();
        });
    });

    it("Should write it's properties to the localStorage", function () {
        expect(localStorage.getItem("A.b")).toBe(null);
        var a = Persistient.save("A", { b: 1 });
        a.b++;
        expect(localStorage.getItem("A.b")).toBe('2');
    });

    it("Should get it's properties direct from localStorage", function () {
        expect(localStorage.getItem("A.b")).toBe(null);
        var a = Persistient.save("A", { b: 1 });
        expect(a.b).toBe(1);

        localStorage.setItem("A.b", 2);
        expect(a.b).toBe(2);
    });

    it("Should deal with adopting objects that are already cached", function (done) {
        var a = Persistient.create("A");
        var b = Persistient.create("B");
        a.b = b;
        b.c = 1;
        expect(a.b.c).toBe(1);

        emulateRefresh(function () {
            var a = Persistient.load("A");
            expect(a.b.c).toBe(1);
            done();
        });
    });

    it("Should deal with adding objects that contain objects are already cached", function (done) {
        var a = Persistient.create("A");
        var b = Persistient.create("B");

        a.b = { b: b };
        b.c = 1;
        expect(a.b.b.c).toBe(1);

        emulateRefresh(function () {
            var a = Persistient.load("A");
            expect(a.b.b.c).toBe(1);
            done();
        });
    });

    it("Should delete the property in the chache if it's deleted in the model", function (done) {
        var a = Persistient.create("A");
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
        var a = Persistient.create("A");
        a.b = 1;

        var a = Persistient.create("a");
        expect(a.b).toBe(undefined);
    });

    it("Should be undefined if it dosn't exist", function () {
        var a = Persistient.load("a");
        expect(a).toBe(undefined);
    });

    it("Should cast numeric strings to integers", function (done) {
        var a = Persistient.create("A");
        a.b = 1;
        a.c = "1";
        expect(a.b).toBe(1);
        expect(_.isNumber(a.b)).toBe(true);
        expect(a.c).toBe("1");
        expect(_.isNumber(a.c)).toBe(false);

        emulateRefresh(function () {
            var a = Persistient.load("A");

            expect(a.b).toBe(1);
            expect(_.isNumber(a.b)).toBe(true);
            expect(a.c).toBe(1);
            expect(_.isNumber(a.c)).toBe(true);
            done();
        });
    });

    it("Should 'load or new' an item when using 'new' syntax", function (done) {
        expect(Persistient.load("A")).toBe(undefined);

        var a = new Persistient("A");
        expect(a.b).toBe(undefined);
        a.b = 1;

        emulateRefresh(function () {
            expect(Persistient.load("A").b).toBe(1);

            emulateRefresh(function () {
                var a = new Persistient("A");
                expect(a.b).toBe(1);
                done();
            });
        });
    });

    it("Should create and load deeply nested circular objects", function (done) {
        var A = (function (_Persistient2) {
            _inherits(A, _Persistient2);

            function A(id) {
                _classCallCheck(this, A);

                _get(Object.getPrototypeOf(A.prototype), "constructor", this).call(this, id);
                this.value;
                this.bs = {};
            }

            return A;
        })(Persistient);

        var B = (function (_Persistient3) {
            _inherits(B, _Persistient3);

            function B(id) {
                _classCallCheck(this, B);

                _get(Object.getPrototypeOf(B.prototype), "constructor", this).call(this, id);
                this.value;
                this.cs = {};
            }

            return B;
        })(Persistient);

        var C = (function (_Persistient4) {
            _inherits(C, _Persistient4);

            function C(id) {
                _classCallCheck(this, C);

                _get(Object.getPrototypeOf(C.prototype), "constructor", this).call(this, id);
                this.value;
                this.as = {};
            }

            return C;
        })(Persistient);

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
        var a = Persistient.create("A");
        var b = Persistient.create("B");
        // var c = Persistient.create("C");
        var d = Persistient.create("D");

        a.b = b;
        // a.c = {c:c};

        b.value = 1;
        // c.value = 2;
        d.value = 3;

        expect(a.b.value).toBe(1);
        // expect(a.c.c.value).toBe(2);
        expect(d.value).toBe(3);

        emulateRefresh(function () {
            var a = Persistient.load("A");
            var b = Persistient.load("B");
            // var c = Persistient.load("C");
            var d = Persistient.load("D");

            expect(a.b.value).toBe(1);
            // expect(a.c.c.value).toBe(2);
            expect(d.value).toBe(3);

            a.b = d;
            // a.c.c = d;

            emulateRefresh(function () {
                var a = Persistient.load("A");

                expect(a.b.value).toBe(3);
                // expect(a.c.c.value).toBe(3);

                done();
            });
        });
    });

    it("Should handle adopted objects being changed", function (done) {
        var a = Persistient.create("A");
        var b = Persistient.create("B");
        var c = Persistient.create("C");

        a.b = b;
        b.value = 1;
        c.value = 2;

        emulateRefresh(function () {
            var a = Persistient.load("A");
            expect(a.b.value).toBe(1);
            a.b = c;

            emulateRefresh(function () {
                var a = Persistient.load("A");
                expect(a.b.value).toBe(2);
                done();
            });
        });
    });

    it("Should handle having a number property changed to an object", function (done) {

        var a = Persistient.create("A");

        a.b = 1;

        fireObjectObserves(function () {
            expect(a.b).toBe(1);
            a.b = { d: 1 };

            expect(a.b.d).toBe(1);

            fireObjectObserves(function () {
                expect(localStorage.getItem("A.b.d")).toBe('1');
                done();
            });
        });
    });

    it("Should handle having a object property changed to a number", function (done) {
        var a = Persistient.create("A");

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

    it("Should handle having property type swaps occuring simultaneously", function (done) {

        var a = Persistient.create("A");

        a.b = 1;
        a.c = { d: 1 };

        fireObjectObserves(function () {
            expect(a.b).toBe(1);
            expect(a.c.d).toEqual(1);

            a.c = 1;
            a.b = { d: 1 };

            expect(a.c).toBe(1);
            expect(a.b.d).toBe(1);

            fireObjectObserves(function () {
                expect(localStorage.getItem("A.c")).toBe('1');
                expect(localStorage.getItem("A.b.d")).toBe('1');
                done();
            });
        });
    });
});

describe("A Persistient Array", function () {});
