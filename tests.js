// jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;

"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var Wizard = (function (_Persistient) {
    _inherits(Wizard, _Persistient);

    function Wizard(name) {
        _classCallCheck(this, Wizard);

        _get(Object.getPrototypeOf(Wizard.prototype), "constructor", this).call(this);
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
    loadedItems = {};
    setTimeout(done, 0);
}

describe('A wizard:', function () {
    var item;
    var changed;

    afterEach(function (done) {
        emulateRefresh(function () {
            localStorage.clear.bind(localStorage);
            done();
        });
    });

    it("Should have only two iterable properties", function () {
        var hermoine = new Wizard();

        var n = 0;
        for (var i in hermoine) {
            n++;
        }
        expect(n).toBe(2);
    });

    it("Should remember their name after a refresh", function () {
        var hermoine = Wizard.create("Hermoine Granger");

        expect(hermoine.name).toBe("Hermoine Granger");

        emulateRefresh();

        var hermoine = Wizard.load("Hermoine Granger");

        expect(hermoine.name).toBe("Hermoine Granger");
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
});

describe("A muggle:", function () {
    afterEach(function (done) {
        emulateRefresh(function () {
            localStorage.clear.bind(localStorage);
            done();
        });
    });

    it("Should save and load", function () {
        var jarred = { age: 21 };
        Persistient.save("Jarred Filmer", jarred); //The id, and the object you want to keep around.

        jarred.age++;

        emulateRefresh();

        var jarred = Persistient.load("Jarred Filmer");

        expect(jarred.age).toBe(22);
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

    it("Should delete the property in the chache if it's deleted in the model", function (done) {
        var a = Persistient.create("A");
        a.b = 1;
        expect(a.b).toBe(1);

        emulateRefresh(function () {
            expect(localStorage.getItem("A.b")).toBe('1');

            delete a.b;

            emulateRefresh(function () {
                expect(localStorage.getItem("A.b")).toBe(null);
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
});
