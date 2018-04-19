// High-Octane route store/retriever
// Author: Yosbel Marín
// License: MIT

declare let require: (str: string) => any

import pathToRegexp from 'path-to-regexp'
const fastDecode = require('fast-decode-uri-component')

export type MapOf<Type> = {
  [key: string]: Type
}

export interface Route {
  // the index of that route in the store
  index: number
  path: string
  regexp: RegExp
  tokens: any[]
  paramsSpec: any[]
  // construct a path with the provided parameters
  generateUrl: (params: any) => string
}

export interface Node {
  routes: any[]
  children?: MapOfNode
}

export type MapOfNode = MapOf<Node>

export interface FindResult {
  route: Route
  params: MapOf<any>
}

const hasOwnProp = Object.prototype.hasOwnProperty

const safeDecodeURIComponent = (str: string) => {
  try {
    return fastDecode(str)
  } catch (e) {
    return str
  }
}

/* Remove the last "/" if present */
const trimEndingSlash = (path: string) => {
  if (path && path.length > 1 && '/' === path.charAt(path.length - 1)) {
    return path.substring(0, path.length - 1)
  }
  return path
}

/* Create e new node */
const createNode = (): Node => ({
  routes: []
})

/* Allocate the route inside the preferred a node */
const storeRoute = (node: Node, route: Route): void => {
  const { tokens = [] } = route
  const contantSegment = (
    (tokens[0] && 'string' === typeof tokens[0]) ? tokens[0] : ''
  )
  const segments = contantSegment.split('/')
  const len = segments.length

  for (let i = 0; i < len; i++) {
    let segment = segments[i]

    if (!node.children) {
      node.children = {}
    }

    if (!hasOwnProp.call(node.children, segment)) {
      node.children[segment] = createNode()
    }

    node = node.children[segment]
    
    // if there is no more segments
    // insert it in the current node
    if (i === len - 1) {
      // store a copy of the route to prevent conflict
      node.routes.push(route)
    }
  }
}

/* Compress nodes by removing the child that doesn't contains routes */
const compressNode = (node: Node, parent?: Node): Node => {
  let childrenMap = node.children as MapOfNode

  // traverse children fist (post order)
  if (childrenMap) {
    let children = Object.keys(childrenMap).map(key => childrenMap[key])
    children.forEach(child => compressNode(child, node))    
  }

  // move routes just if
  if (
    // has parent
    parent
    // parent has no routes
    && parent.routes.length === 0
    // parent has only one child (current node)
    && countChildren(parent) === 1
    // the node has no children (is leaf)
    && countChildren(node) === 0
  ) {
    // convert the parent in a leaf
    delete parent.children
    // move the node routes to the parent
    parent.routes = node.routes
  }

  return node
}

/* Returns the number of children in a node */
const countChildren = (node: Node): number => {
  return node.children ? Object.keys(node.children).length : 0
}

/* Find a node in the tree */
const findNodeByPath = (node: Node, path: string): Node => {
  const segments = path.split('/')
  const len = segments.length
  let i = 0
  let segment

  while (node.children && i < len) {
    segment = segments[i]
    if (!hasOwnProp.call(node.children, segment)) break
    node = node.children[segment]
    i++
  }

  return node
}

/* Create a new route */
const createRoute = (
  path: string,
  index: number
): Route => {
  path = trimEndingSlash(path)
  const paramsSpec: any[] = []
  const tokens = pathToRegexp.parse(path)
  const generateUrl = pathToRegexp.compile(path)
  const regexp = pathToRegexp.tokensToRegExp(tokens, paramsSpec, {
    sensitive: true,
    end: true,
    strict: false
  })

  return {
    index,
    path,
    regexp,
    tokens,
    paramsSpec,
    generateUrl
  } as Route
}

/* Find the route object in the Trie and the match after apply the route regexp */
const findRouteAndMatch = (node: Node, path: string): {
  route: Route,
  match: any[]
} | void => {
  const routes = node.routes
  const len = routes.length

  for (let i = 0; i < len; i++) {
    let route = routes[i]
    let match = route.regexp.exec(path)
    if (match) {
      return {
        route,
        match
      }
    }
  }
}

/* Extract params from a route */
const getParams = (route: Route, match: string[]): MapOf<any> => {
  const { paramsSpec = [] } = route
  const len = paramsSpec.length
  const params: any = {}
  let paramValue

  for (let i = 0; i < len; i++) {
    paramValue = match[i + 1]
    params[paramsSpec[i].name] = (
      paramValue === void 0 ? paramValue : safeDecodeURIComponent(paramValue)
    )
  }

  return params
}

/* Store of routes */
export class Store {

  private root: Node

  private routes: Route[]

  constructor() {
    this.root = createNode()
    this.routes = []
  }

  /* Returns the root node of the Trie */
  getRootNode(): Node {
    return this.root
  }

  /* Returns stored routes */
  getRoutes(): Route[] {
    return this.routes
  }

  /* Build the Trie */
  build() {
    this.routes.forEach(route => storeRoute(this.root, route))
    this.root = compressNode(this.root)
  }

  /* Add a new route */
  add(path: string): Route | void {
    const nextIndex = this.routes.length
    const newRoute = createRoute(path, nextIndex)
    this.routes.push(newRoute)
    return newRoute
  }

  /* Find a route */
  find(path: string): FindResult | void {
    const foundNode = findNodeByPath(this.root, path)
    if (foundNode) {
      const routeAndMatch = findRouteAndMatch(foundNode, path)
      if (routeAndMatch) {
        return {
          route: routeAndMatch.route,
          params: getParams(routeAndMatch.route, routeAndMatch.match)
        }
      }
    }
  }

}

export function cleanPath(path: string): string {
  return path.replace(/\/+/g, '/')
}
