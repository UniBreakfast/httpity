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

### New getters on `request` object (`IncomingMessage.prototype`) are:

#### - [`request.cookie`](#requestcookie)
#### - [`request.rawBody`](#requestrawbody)
#### - [`request.body`](#requestbody)
#### - [`request.path`](#requestpath)
#### - [`request.querystring`](#requestquerystring)
#### - [`request.query`](#requestquery)

### New methods on `response` object (`ServerResponse.prototype`) are:

#### - [`response.setCookie(...)`](#responsesetcookiename-value-options)
#### - [`response.delCookie(...)`](#responsedelcookiename-path-securehttpitydev)
#### - [`response.send(...)`](#responsesendbody-code-type)

### New setters (and some getters) on `response` object (`ServerResponse.prototype`) are:

#### - [`response.code`](#responsecode)
#### - [`response.type`](#responsetype)
#### - [`response.path`](#responsepath)
#### - [`response.body`](#responsebody)

Details below

### `request.cookie`

It returns the object with cookies that came from the client as `{key1: 'value1", key2: 'value2'}`. To do that first time it parses the `request.headers.cookie` and stores the result in `request.parsedCookie`, and on subsequent getter calls it acts as an alias for that simply returning the same object without unnecessary parsing. All further getters are pretty much do the same thing: they parse the first time, cache result and just return it if asked again.

### `request.rawBody`

It returns the promise so in order to get it use

```js
request.rawBody.then(str => console.log(str))
// or
const rawBodyString = await request.rawBody
```
Again, previously collected data is stored into `request.receivedData` and is returned if asked for more than once but always as a promise (for consistency).

### `request.body`

This one treats received data as JSON-stringified data and parses it for you automatically. It returns the promise so in order to get it use

```js
request.body.then(data => console.log(data))
// or
const body = await request.body
```
Again, previously collected data is stored into `request.parsedBody` and is returned if asked for more than once but always as a promise (for consistency).

### `request.path` and `request.querystring`

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

### `request.query`

is parsed-decoded `request.querystring`, from example above it would return

```js
console.log(request.query)
// -> {name: 'Alex', age: 23, rank: 'rookie'}
```
Again, previously decoded query data is stored into `request.parsedQuery` and is returned if `request.query` is asked more than once.

### `response.setCookie(name, value, ?options={})`

Adds a `set-cookie` header to the `response`. Accepts following `options`
  - `expire` : number of seconds until cookie expires (also known as `Max-Age`), defaults to `http.cookieDefaultExpire` (or `httpity.cookieDefaultExpire` if you imported it like that), equals to `86400*3` (3 days) if you did not change it.
  - `path` : a scope-path on site for cookie to work in, defaults to `'/'`.
  - `secure` : boolean, if `true` adds a `__Secure-` prefix before cookie name and `Secure; HttpOnly; SameSite=Strict` at the end of the cookie-header, supposed to be used only via `https`. This is used in production (had Heroku in mind) by default if `process.env.PORT` is not empty and you didn't force the dev-mode by setting `httpity.dev = true`.
Returns the cookie-string that would be sent to the client as the `set-cookie` header.

### `response.delCookie(name, ?path='/', ?secure=!httpity.dev)`

Adds a `set-cookie` header to the `response` with intent to delete said cookie on the client by setting its value to empty string and max age less than zero. Parameters `path` and `secure` here work exactly the same way as do the correspondingly named options in the previous `response.setCookie` method and actually it is used here under the hood.

### `response.send(body, ?code, ?type)`

It's a helper method that does the same as you could do before via (simplified pseudocode).

```js
response.writeHead(statusCode, {'content-type': correspondingMIMEtype})
  .end(bodyString) // automatically JSON.stringified if needed
```
`code` and `type` could be independently omitted, in place of `type` you can pass an extension like `css` or even the full `filename` or `filepath` - its extension will be used to set the correct `content-type` header.

### `response.code`

An alias for `response.statusCode`, works both like a setter and a getter.

### `response.type`

This setter takes an extension string like `svg` and adds a corresponding MIME type to the `content-type` header, like `image/svg+xml; charset=utf-8` for example. As a getter it will show the current `content-type` header.

### `response.path`

This setter takes a `filename` or `filepath` string, extracts the extension part from it and uses it to set the `content-type` header via the `response.type` setter.

### `response.body`

This setter takes the string/buffer and sends it to the client, otherwise it treats the argument as data object and tries to `JSON.stringify()` it and then send. If `httpity.autoEnd` set to `true` (and it is by default) it uses `response.end()`. As a getter it will show the data previously sent via this same response if there was one.
