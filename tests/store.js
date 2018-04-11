const { Store } = require('../index')

const paths = [
  'foo/bar',
  'foo/baz'
]

const newStore = (paths) => {
  const store = new Store
  if (paths) paths.forEach(path => store.add(path))
  store.build()
  return store
}

describe('Store:', () => {

  it('should be built before to retrieve any route', () => {
    const store = new Store
    store.add('foo')
    expect(store.find('foo')).toBeUndefined()
    store.build()
    expect(store.find('foo')).toBeDefined()
  })

  it('should return a route from `add` method', () => {
    const route = newStore().add(paths[0])
    expect(route.path).toEqual(paths[0])
  })

  it('should store routes in the same order as added', () => {
    const store = newStore()
    const route1 = store.add(paths[0])
    const route2 = store.add(paths[1])
    expect(store.getRoutes()).toEqual([route1, route2])
  })

  it('routes should know its own index', () => {
    const store = newStore()
    const route1 = store.add(paths[0])
    const route2 = store.add(paths[1])
    expect(route1.index).toBe(0)
    expect(route2.index).toBe(1)
  })

  it('routes index should be the offsets in the routes array', () => {
    const store = newStore()
    const route1 = store.add(paths[0])
    const route2 = store.add(paths[1])
    const routes = store.getRoutes()
    expect(routes[route2.index]).toEqual(route2)
  })

  it('routes are case sensitive', () => {
    const store = newStore(['Foo'])
    expect(store.find('foo')).toBeUndefined()
    expect(store.find('Foo')).toBeDefined()
  })

  it('routes supports named params', () => {
    const store = newStore(['foo:bar'])
    expect(store.find('foo1').params.bar).toBe('1')
  })

  it('routes supports named unnamed', () => {
    const store = newStore(['foo(.)'])
    expect(store.find('foo1').params[0]).toBe('1')
  })

})