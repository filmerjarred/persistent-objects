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
    loadedItems = {};
    setTimeout(done, 0);
}

describe('A wizard:', function () {
    var item;
    var changed;

    afterEach(function () {
        localStorage.clear();
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

    it("Should override anything before it when created", function () {
        var moody = Wizard.create("Mad Eyed Moody");
        moody.compromised = false;

        var moody = Wizard.create("Mad Eyed Moody");
        expect(moody.compromised).toBe(undefined);
    });

    it("Shouldn't exist", function () {
        var jarred = Wizard.load("Jarred Filer");
        expect(jarred).toBe(undefined); //*sob*
    });

    it("Should remember the type of their age", function () {
        expect(true).toBe(true);
    });
});

describe("A muggle:", function () {
    afterEach(function () {
        localStorage.clear();
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
