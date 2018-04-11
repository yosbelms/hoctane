# Hoctane

Fast and efficient route store/retriever. It uses internally a high performance [Prefix Tree](https://en.wikipedia.org/wiki/Trie), supports route parametters, and complex regex patterns.

## Install

**npm**
```
npm i hoctane --save
```

**Yarn**
```
yarn add hoctane
```

## Usage

Hoctane is a storage library with an optimized algorithm for fast lookup, intended to be used by routers looking for performance and routes allowing flexible patterns.

```js
const store = new Store
store.add('foo/:id')
store.build()

const {route, params} = store.find('foo/1')

// params.id === 1
```

### Storing routes

The method `add` receives a `path` as the first parameter and returns new route object that contains all the necessary information to be stored in the underlying storage.

```js
const route = store.add('foo/bar')
```

The route object looks like the following:

```ts
interface Route {
  index: number
  path: string
  regexp: RegExp
  tokens: any[]
  paramsSpec: any[]
  generateUrl: (params: any) => string
}
```

### Building the tree

When the routes are constructed and stored through the `add` method, doesn't means that any of it can be finded still. Before, it's needed to build and compress the internal structure that allows to find any route in a matter of a blink.

```js
store.add('foo')
// ...
store.build()
// ...
store.find('foo')
```


### Storing data related to the routes

The `add` method does not receives any payload to be attached to the route such as `handlers` or any metadata. This is considered out of the scope of this library.

Though, the `index` property plays the role of a unique identifier of the route in each `Store` instance. It is equal to the index of that route inside the list of routes returned by the method `getRoutes`.

```js
const route = store.add('foo/bar')
const routes = store.getRoutes()

routes[route.index] === route // true
```

Regarding the said above, we can keep an list of __things__ related to the routes, example:

```js
// list of handlers
const handlers = []

function addPathWithHandler(path, handler) {
  const route = store.add(path)
  // store the handler
  handlers[route].index = handler
}

// returns a handler
function findHandlerByPath(path) {
  const found = store.find(path)
  if (found) {
    // return the related handler
    return handlers[found.route.index]
  }
}
```

Now lets use what we wrote above.

```js
const handler = (ctx) => null

addPathWithHandler('/clients', handler)

findHandlerByPath('/clients') === handler // true
```

### What about HTTP verbs?

HTTP verbs are strings, and each route should be related to one of them (GET, POST, PUT ...) so, it is safe (and performant) to treat each verb as part of the path, example:

```js
store.add(method + '/' + path)
store.find(method + '/' + path)
```

Author: Yosbel Marin

License: MIT