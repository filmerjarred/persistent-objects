# persistent-objects

Warning: Mad science.

In the first lecture of my first web development course, we were told that javascript had a short memory, and shouldn't be expected to stick around after page refreshes. I made a note to find a way around that when I'd had enough experience, and now that I have, I built this!

# Installation

```html
    <script type = "application/javascript" src = "lodash.js"></script>
    <script type = "application/javascript" src = "persistient.js"></script>
```

# Browser Support
Persistient objects rely on Object.observe, which is currently only available in chrome. Polyfills are being looked into.

# Usage

## Basic Usage
A "Persistient" object is identical to a plain old javascript object, except the values of it's properties survive page refresh.
```javascript
var a = new Persistient("a");
a.b = 1;
```

*PAGE REFRESH*

```javascript
var a = new Persistient("a");
console.log(a.b) //1, tada!
```

But wait, there's more!

```javascript
var a = new Persistient("a");
var b = new Persistient("b")
a.b = b;
```

*PAGE REFRESH*

```javascript
var a = new Persistient("a");
var b = new Persistient("b")
a.b === b; //true
```

All objects are linked by reference, rather than by value. "Awesome! But what if I want to use my own classes?" I hear you say. Easy mode!

###es6 classes
```javascript
class Wizard extends Persistient{   //Just extend your class with Persistient
    constructor(name){
        //Remember to call the parent constructuctor with the id of the object
        super(name);

        this.name = name;
        this.friends = {};
        this.spells = []; //works just as well with arrays!
    }

    learn(spell){
        this.spells.push(spell);
    }

    befriend(friend){
        this.friends[friend.name] = friend;
    }
}
```

###es5 classes

```javascript

function Wizard (name){
    this.name = name;
    this.friends = {};
    this.spells = []; //works just as well with arrays!

    this.learn = function(spell){
        this.spells.push(spell);
    }

    this.befriend = function(friend){
        this.friends[friend.name] = friend;
    }

    Persistient.save(name, this);
}
```

Once your classes are established, you can use them in the normal way.

```javascript
var hermoine = new Wizard("Hermoine Granger");
var ron = new Wizard("Ron Weasly");

hermoine.befriend(ron);
ron.befriend(hermoine);

hermoine.learn("Wingardium Leviosa");
ron.learn("Wingardium Leviosaah");
```

*PAGE REFRESH*

```javascript
var hermoine = new Wizard("Hermoine Granger");
var ron = new Wizard("Ron Weasly");

hermoine.friends["Ron Weasly"] === ron; //true
ron.friends["Hermoine Granger"] === hermoine; //true

ron.friends["Hermoine Granger"].spells // ["Wingardium Leviosa"]
hermoine.friends["Ron Weasly"].spells // ["Wingardium Leviosaah"]
```

## Advanced Usage

The Persistient class (and any class extended by it) has 4 static methods:

Persistient.create(id), will create a new persistient object under the given id, overriding anything there previously

Persistient.load(id), will load whatever was at that id. If there's nothing there, will be undefined

Persistient.save(id, obj), will save the object given to the cache.

Persistient.loadOrCreate(id), will load the item at the given id, or create a new one if nothing's there.

Using the 'new' keyword will emulate loadOrCreate, as seen above.

NOTE: These statis class methods are not yet available when just using es5 syntax.

### Examples

```javascript
var hermoine = Wizard.create("Hermoine Granger");
var ron = Wizard.create("Ron Weasly");

hermoine.petType = "Cat";
ron.petType = "Lost";

//If you load non existient object, will be undefined
var harry = Wizard.load("Harry Potter"); //undefined

//If you use the new keyword, it will load the item if it exists, else create a new one
var harry = new Wizard("Harry Potter"); //<Wizard>
harry.petType = "Owl"
```

*PAGE REFRESH*

```javascript

//As we've used the create function, whatever was under "Ron Weasly", is erased
var ron = Wizard.create("Ron Weasly");
var hermoine = Wizard.load("Hermoine Granger");

ron.petType //undefined
hermoine.petType //Cat

//Because harry already exists, will load the one stored, rather than overwrite, like Wizard.create would.
var harry = new Wizard("Harry Potter"); //<Wizard>
harry.petType// "Owl"
```

If you just want to store a simple data object, then .save might be what you want.

```javascript
    var options = {selected:4, menu:false, dropdownActive:false};
    Persistient.save("options", options); //The id, and the object you want to keep around.
    options.selected++;

    //or

    var options = new Persistient("options");
    options.selected = 4;
    options.menu = false;
    options.dropdownActive = false;
    options.selected++;
```
*PAGE REFRESH*
```javascript
    var options = Persistient.load("options");
    options.selected //5;

    //or

    var options = new Persistient("options"); //seeing as there's alread one there, we load that rather than create a new one.
    options.selected //5;
```