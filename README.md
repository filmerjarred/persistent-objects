# persistent-objects

Warning: Halfbaked mad science.

In the first lecture of my first web development course, we were told that javascript had a short memory, and shouldn't be expected to stick around after page refreshes. I made a note to find a way around that when I'd had enough experience, and now that I have, I built this!

# installation

```html
    <script type = "application/javascript" src = "lodash.js"></script>
    <script type = "application/javascript" src = "persistient.js"></script>
```

# Usage

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
ron.friends //{"Ron Weasly":ron}

ron.petType = "Lost";

//If you load non existient object, will be undefined
var harry = Wizard.load("Harry Potter"); //undefined
```

*PAGE REFRESH*

```javascript

var hermoine = Wizard.load("Hermoine Granger");
var ron = Wizard.load("Ron Weasly");

hermoine.friends //{"Ron Weasly":ron}
ron.friends //{"Ron Weasly":ron}

hermoine.friends["Ron Weasly"] === ron; //true

ron.petType //Lost
hermoine.friends["Ron Weasly"].petType = "Frog";
ron.petType //Frog
```

### pojo Syntax

```javascript
    var options = {selected:4, menu:false, dropdownActive:false};
    Persistient.save("options", options); //The id, and the object you want to keep around.
    options.selected++;
```
*PAGE REFRESH*
```javascript
    var options = Persistient.load("options");
    options.selected //5;
```

*Coming soon*
Array support,
When using the native 'new' syntax, will load if it's there, or create new if it's not.
