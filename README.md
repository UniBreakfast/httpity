# HTTPity

A small wrapper-module around the built in `http` module. It provides additional utitity getters, setters and methods on `request` and `response` objects (they are actually added to `IncomingMessage` and `ServerResponse` prototypes of course).

## Installation
```
npm i httpity
```
and then instead of

```js
const http = require('http')
// or
import http from 'http'
```
you would use

```js
const http = require('httpity')
// or
import http from 'httpity'
```

## Usage

So just like with normal `http` module you would create and run a server and see the advantages of `httpity` inside the `handle(request, response)` function

```js
http.createServer(handle).listen(port)
function handle(request, response) {
  // use any of the following methods, getters and setters here
}
```

#### New getters on `request` object (`IncomingMessage.prototype`) are:

- [request.cookie](https://github.com/UniBreakfast/httpity#requestcookie)
- [request.rawBody](https://github.com/UniBreakfast/httpity#requestrawbody)
- [request.body](https://github.com/UniBreakfast/httpity#requestbody)
- [request.path](https://github.com/UniBreakfast/httpity#requestpath)
- [request.querystring](https://github.com/UniBreakfast/httpity#requestquerystring)
- [request.query](https://github.com/UniBreakfast/httpity#requestquery)

#### New methods on `response` object (`ServerResponse.prototype`) are:

- [response.setCookie(...)](https://github.com/UniBreakfast/httpity#responsesetcookiename-value-options)
- [response.delCookie(...)]()
- [response.send(...)]()

#### New setters (and some getters) on `response` object (`ServerResponse.prototype`) are:

- [response.code]()
- [response.type]()
- [response.path]()
- [response.body]()

Details below

#### `request.cookie`

It returns the object with cookies that came from the client as `{key1: 'value1", key2: 'value2'}`. To do that first time it parses the `request.headers.cookie` and stores the result in `request.parsedCookie`, and on subsequent getter calls it acts as an alias for that simply returning the same object without unnecessary parsing. All further getters are pretty much do the same thing: they parse the first time, cache result and just return it if asked again.

#### `request.rawBody`

It returns the promise so in order to get it use

```js
request.rawBody.then(str => console.log(str))
// or
const rawBodyString = await request.rawBody
```
Again, previously collected data is stored into `request.receivedData` and is returned if asked for more than once but always as a promise (for consistency).

#### `request.body`

This one treats received data as JSON-stringified data and parses it for you automatically. It returns the promise so in order to get it use

```js
request.body.then(data => console.log(data))
// or
const body = await request.body
```
Again, previously collected data is stored into `request.parsedBody` and is returned if asked for more than once but always as a promise (for consistency).

#### `request.path` and `request.querystring`

These are `response.url`-parts after splitting it on `?`. For example if there is a request for `http://localhost:3000/api/users/add?name=Alex&age=23&rank=rookie` we can get

```js
console.log(request.url)
// -> '/api/users/add?name=Alex&age=23&rank=rookie'
console.log(request.path)
// -> '/api/users/add'
console.log(request.querystring)
// -> 'name=Alex&age=23&rank=rookie'
```
Again, previously separated parts are stored into `request.urlPath` and `request.urlQuery` and used if asked again.

#### `request.query`

is parsed-decoded `request.querystring`, from example above it would return

```js
console.log(request.query)
// -> {name: 'Alex', age: 23, rank: 'rookie'}
```
Again, previously decoded query data is stored into `request.parsedQuery` and is returned if `request.query` is asked more than once.

#### `response.setCookie(name, value, ?options={})`

Adds a `set-cookie` header to the `response`. Accepts following `options`
  - `expire` : number of seconds until cookie expires (also known as `Max-Age`), defaults to `http.cookieDefaultExpire` (or `httpity.cookieDefaultExpire` if you imported it like that), equals to `86400*3` (3 days) if you did not change it.
  - `path` : a scope-path on site for cookie to work in, defaults to `'/'`.
  - `secure` : boolean, if `true` adds a `__Secure-` prefix before cookie name and `Secure; HttpOnly; SameSite=Strict` at the end of the cookie-header, supposed to be used only via `https`. This is used in production (had Heroku in mind) by default if `process.env.PORT` is not empty and you didn't force the dev-mode by setting `httpity.dev = true`.
