
var store = {};


/**
get(key)
**/

export function get(key) {
    if (store[key]) { return store[key]; }
    const data = window.localStorage.getItem(key);
    return data ?
        (store[key] = JSON.parse(data)) :
        undefined ;
}


/**
set(key, data)
**/

export function set(key, data) {
    window.localStorage.setItem(key, JSON.stringify(data));
    return store[key] = data;
}


/**
remove(key, value)
**/

export function remove(key, data) {
    const storage = get(key);
    if (!storage) { return; }
    const i = storage.indexOf(data);
    if (i < 0) { return; }
    storage.splice(i, 1);
    set(key, storage);
    return storage;
}


/**
push(key, value)
**/

export function push(key, value) {
    const data = get(key) || [];
    if (!data.includes(value)) {
        data.push(value);
        set(key, data);
    }
    return data;
}


/**
contains(key, value)
**/

export function contains(key, value) {
    const data = get(key);
    return data && data.indexOf(value) !== -1;
}


/**
Store(key)

```js
const storage = new Store('store-name')
```
**/

const stores = {};

export function Storage(key) {
    if (!Storage.protoype.isPrototypeOf(this)) {
        return new Storage(key);
    }

    // Only ever create one object per store key
    if (stores[key]) {
        return stores[key];
    }

    this.key  = key;
    this.data = get(key);
}

Object.assign(Storage.prototype, {
    remove: function(value) {
        remove(this.key, value);
        return this;
    },

    push: function(value) {
        push(this.key, value);
        return this;
    },

    contains: function(value) {
        return contains(this.key, value);
    }
});
