# persistent-objects

Warning: Mad science.

In the first lecture of my first web development course, we were told that javascript had a short memory, and shouldn't be expected to stick around after page refreshes. I made a note to find a way around that when I'd had enough experience, and now that I have, I built this!

# Installation

```html
    <script type="application/javascript" src="/path/to/persistient.js"></script>
```

# Browser Support
Persistient objects rely on Object.observe, which is currently only available in chrome. Polyfills are being looked into.

# Usage

## Basic Usage
A Persistient Object, or "Pobject" is identical to a plain old javascript object, except the values of it's properties survive page refresh.
```javascript
> var a = Pobject.findOrCreate("a");
> a.b = 1;
```

*PAGE REFRESH*

```javascript
> var a = Pobject.findOrCreate("a");
> console.log(a.b); //1, tada!
```

But wait, there's more!

```javascript
> var a = Pobject.findOrCreate("a");
> var b = Pobject.findOrCreate("b");
> a.b = b;
> b.c = 1;
```

*PAGE REFRESH*

```javascript
> var a = Pobject.findOrCreate("a");
> var b = Pobject.findOrCreate("b");
> a.b === b; //true
> a.b.c === 1; //true
```

So as you can see, all objects are linked by reference, rather than by value, which allows for a rich relational data model. "Awesome! But what if I want to use my own classes?" I hear you say. Easy mode!

## Advanced Usage

###es6 classes
```javascript
class Wizard{
    constructor(name, petType){
        this.name = name;
        this.petType = petType || "Lost"
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

registerType(Wizard); //Just register your new type with the system, and you're good to go!
```

###es5 classes

```javascript
function Wizard (name){
    this.name = name;
    this.petType = petType || "Lost"
    this.friends = {};
    this.spells = [];

    this.learn = function(spell){
        this.spells.push(spell);
    }

    this.befriend = function(friend){
        this.friends[friend.name] = friend;
    }
}

registerType(Wizard);
```

Once your classes are registered, they provide full CRUD functionality as follows:

###Create
```javascript
> Wizard.create(id, arg1, arg2, ...);
```
The create function creates a new persistient object under the given id, overriding anything perviously using it. All arguments after the id will be used in the constructor.

```javascript
> var wiz = new Wizard(name, pet);
```
Just using the constructor normally will create a new object with an auto generated unique id.

Any object created (by any of the above methods) will be added to Wizard.items, or Wizard.wizards (pluralised lowercase classname).

###Retrive
```javascript
> Wizard.find(id);
//or
> Wizard.find({property:searchValue}); //i.e {name:"Luna Lovegood"}
```
The find function can take either an id, or a [mongo style query](https://github.com/crcn/sift.js/tree/master). If given a query, it will return all that match it as an array. If given an id, will return a singular item.
If either method finds nothing, will return undefined.

```javascript
> Wizard.findOne(id);
//or
> Wizard.findOne({property:searchValue}); //i.e {name:"Luna Lovegood"}
```
Identical to .find, but will return the first item to match.

```javascript
> Wizard.findOrCreate(id)
```
Does what it says on the box. Will return the object referenced by the id, or will create one under it.

###Update
```javascript
> ginny.name = "Ginny Potter";
```
That's the beauty of an application that automatically writes it's data to the database (which is in this case, the local cache), updates are super simple.

###Destroy
```javascript
> Wizard.remove(fred);
> //or
> Wizard.remove(fred.id);
```
When a persistient object is removed, it is removed from the list of items, and can no longer be found by .find. All it's properties *that are not themselves objects* are removed from the cache.

```javascript
> Wizard.obliterate(fred);
> //or
> Wizard.obliterate(fred.id);
```
When a persistient object is *obliterated*, it and *all* decendant objects are removed. So in the above example, if fred.brother was gorge, gorge.remove() would have been called, as well as any object that was a property of gorges, ect.

###Example

```javascript
var hermoine = new Wizard("Hermoine Granger", "Cat");
var ron = new Wizard("Ron Weasly");

hermoine.befriend(ron);
ron.befriend(hermoine);

hermoine.learn("Wingardium Leviosa");
ron.learn("Wingardium Leviosaah");
```

*PAGE REFRESH*

```javascript
var hermoine = Wizard.findOne({name:"Hermoine Granger"});
var ron = Wizard.findOne({name:"Ron Weasly"});

hermoine.friends["Ron Weasly"] === ron; //true
ron.friends["Hermoine Granger"] === hermoine; //true

ron.friends["Hermoine Granger"].spells // ["Wingardium Leviosa"]
hermoine.friends["Ron Weasly"].spells // ["Wingardium Leviosaah"]

hermoine.remove();
ron.remove();

var hermoine = Wizard.findOne({name:"Hermoine Granger"}); //undefined
var ron = Wizard.findOne({name:"Ron Weasly"});            //undefined
```

#Developing
If you want to muck around with the library, all the raw files are in the development folder.