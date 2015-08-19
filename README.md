# persistent-objects

Warning: Halfbaked mad science.

In the first lecture of my first web development course, we were told that javascript had a short memory, and shouldn't be expected to stick around after page refreshes. I made a note to find a way around that when I'd had enough experience, and now that I have, I built this!

# Usage

```javascript
var harry = {id:"Harry Potter", friends:{
    "Ron":{id:"Ron", age:13}
}}

Persistient.save("", harry);
```

*PAGE REFRESH*

```javascript
var harry = Persistient.load(".Harry Potter");

console.log(harry.age) //undefined
console.log(harry.friends.Ron.age) //13

harry.age = 14;
harry.friends.Ron.age++;
```

*PAGE REFRESH*

```javascript
var harry = Persistient.load(".Harry Potter");

console.log(harry.age) //14
console.log(harry.friends.Ron.age) //14
```

*Coming soon*
ES6 classes
Array support
Sensible new and loading paradigms
Sensible class instantiation