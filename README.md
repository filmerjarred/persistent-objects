# persistent-objects

Warning: Halfbaked mad science.

In the first lecture of my first web development course, we were told that javascript had a short memory, and shouldn't be expected to stick around after page refreshes. I made a note to find a way around that when I'd had enough experience, and now that I have, I built this!

# Installation

```html
    <script type = "application/javascript" src = "lodash.js"></script>
    <script type = "application/javascript" src = "persistient.js"></script>
```

# Usage

### Basic Usage

```javascript
var a = new Persistient("a");
a.b = {c:1};
```

*PAGE REFRESH*

```javascript
var a = new Persistient("a");
console.log(a.b.c) //1, tada!
```


The Persistient class (and any class extended by it) has 4 static methods:

Persistient.create(id), will create a new persistient object under the given id, overriding anything there previously

Persistient.load(id), will load whatever was at that id. If there's nothing there, will be undefined

Persistient.save(id, obj), will save the object given to the cache.

Persistient.loadOrCreate(id), will load the item at the given id, or create a new one if nothing's there.

Using the 'new' keyword will emulate loadOrCreate, as seen above.

### Class Syntax

```javascript
class Wizard extends Persistient{
    constructor(name){
        super(name);
        this.name = name;
        this.friends = {};
    }

    befriend(friend){
        this.friends[friend.name] = friend;
    }
}

var hermoine = Wizard.create("Hermoine Granger");
var ron = Wizard.create("Ron Weasly");

hermoine.befriend(ron);
ron.befriend(hermoine);

hermoine.friends //{"Ron Weasly":ron}
ron.friends //{"Hermoine Granger":hermoine}

ron.petType = "Lost";

//If you load non existient object, will be undefined
var harry = Wizard.load("Harry Potter"); //undefined

//If you use the new keyword, it will load the item if it exists, else create a new one
var harry = new Wizard("Harry Potter"); //<Wizard>
harry.petType = "Owl"
```

*PAGE REFRESH*

```javascript

var hermoine = Wizard.load("Hermoine Granger");
var ron = Wizard.load("Ron Weasly");

hermoine.friends //{"Ron Weasly":ron}
ron.friends //{"Hermoine Granger":hermoine}

hermoine.friends["Ron Weasly"] === ron; //true

ron.petType //Lost
hermoine.friends["Ron Weasly"].petType = "Frog";
ron.petType //Frog

//Because harry already exists, will load the one stored, rather than overwrite, like Wizard.create would.
var harry = new Wizard("Harry Potter"); //<Wizard>
harry.petType// "Owl"
```

### pojo Syntax

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

*Coming soon*
Array support
