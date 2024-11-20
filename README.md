# [HTTPity](https://github.com/UniBreakfast/httpity)

[npm link](https://www.npmjs.com/package/httpity)

It's a small wrapper module around the built-in `http` module. It provides additional utility getters, setters, and methods on `request` and `response` objects (they are actually added to `IncomingMessage` and `ServerResponse` prototypes, of course). It is great for passing strings or JSON objects, handling cookies, query strings, and MIME types.

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

As with the normal `http` module, you would create and run a server to see the advantages of `httpity` within the `handle(request, response)` function.

```js
http.createServer(handle).listen(port)
function handle(request, response) {
  // use any of the following methods, getters and setters here
}
```

### New getters on `request` object (`IncomingMessage.prototype`) are:

- [`request.cookie`](#requestcookie)
- [`request.rawBody`](#requestrawbody)
- [`request.body`](#requestbody)
- [`request.path`](#requestpath-and-requestquerystring)
- [`request.querystring`](#requestpath-and-requestquerystring)
- [`request.query`](#requestquery)
- [`request.data`](#requestdata)

### New method on `request` object (`IncomingMessage.prototype`) is:

- [`request.compose(...)`](#requestcomposeprops)

### New methods on `response` object (`ServerResponse.prototype`) are:

- [`response.setCookie(...)`](#responsesetcookiename-value-options)
- [`response.delCookie(...)`](#responsedelcookiename-path-securehttpitydev)
- [`response.send(...)`](#responsesendbody-code-type)

### New setters (and some getters) on `response` object (`ServerResponse.prototype`) are:

- [`response.code`](#responsecode)
- [`response.type`](#responsetype)
- [`response.path`](#responsepath)
- [`response.body`](#responsebody)

Details below.

### `request.cookie`

It returns the object with cookies that came from the client as `{key1: 'value1", key2: 'value2'}`. To do that the first time, it parses the `request.headers.cookie` and stores the result in `request.parsedCookie`, and on subsequent getter calls it acts as an alias for that, simply returning the same object without unnecessary parsing. All further getters are pretty much the same thing: they parse the first time, cache the result and just return it if asked again.

### `request.rawBody`

It returns a promise, so to obtain its value, use

```js
request.rawBody.then(str => console.log(str))
// or
const rawBodyString = await request.rawBody
```
Again, previously collected data is stored into `request.receivedData` and is returned if asked for more than once, but always as a promise (for consistency).

### `request.body`

This one treats received data as JSON-stringified data and parses it automatically. It returns a promise, so to obtain its value use

```js
request.body.then(data => console.log(data))
// or
const body = await request.body
```
Again, previously collected data is stored into `request.parsedBody` and is returned if asked for more than once, but always as a promise (for consistency).

### `request.path` and `request.querystring`

These are the parts of `response.url` after splitting it on `?`. For example, if there is a request for `http://localhost:3000/api/users/add?name=Alex&age=23&rank=rookie`, we can get

```js
console.log(request.url)
// -> '/api/users/add?name=Alex&age=23&rank=rookie'
console.log(request.path)
// -> '/api/users/add'
console.log(request.querystring)
// -> 'name=Alex&age=23&rank=rookie'
```
Previously separated parts are stored in `request.urlPath` and `request.urlQuery` and are reused if requested again.

### `request.query`

is the parsed and decoded `request.querystring`. From the example above, it would return:

```js
console.log(request.query)
// -> {name: 'Alex', age: 23, rank: 'rookie'}
```
Again, previously decoded query data is stored in `request.parsedQuery` and is returned if `request.query` is asked for again.

### `request.data`

Provides composed data from both `request.body` and `request.query`, where data from the body overrides the data from the query. Returns a promise. Under the hood, it uses `request.compose()` with no arguments to compose it.

### `request.compose(?props)`

Provides composed data from both `request.body` and `request.query`, where data from the body overrides the data from the query. Returns a promise. If `props` is provided, it returns only the required fields of data. `props` can be an object or an array. If it's an object, it will keep the values for properties that are missing in the `response` loadout. If it's an array with property names, then for fields missing in `response` loadout, values will be empty strings `''`. The promise for once composed `data` object of all values in body and query will be saved at `response.composedData` and used under the hood if `request.data` or `request.compose()` (without arguments) is used again.

### `response.setCookie(name, value, ?options={})`

Adds a `set-cookie` header to the `response`. Accepts the following `options`:
  - `expire`: Number of seconds until the cookie expires (also known as `Max-Age`). Defaults to `http.cookieDefaultExpire` (or `httpity.cookieDefaultExpire` if you imported it that way), which equals `86400*3` (3 days) if you haven't changed it.
  - `path`: A scope-path on the site for the cookie to work in, defaults to `'/'`.
  - `secure`: Boolean, if `true`, adds a `__Secure-` prefix before the cookie name and `Secure; HttpOnly; SameSite=Strict` at the end of the cookie-header. It is intended to be used only via `https`. This should be used in production (I had Heroku in mind, as it provides an https-connection for http-servers). To change the default, set `httpity.secure = true`.
Returns the cookie-string that would be sent to the client as the `set-cookie` header.
### `response.delCookie(name, ?path='/', ?secure=!httpity.secure)`

Adds a `set-cookie` header to the `response` with the intent to delete the specified cookie on the client by setting its value to an empty string and its max age to less than zero. The `path` and `secure` parameters here work exactly the same way as do the correspondingly named options in the previous `response.setCookie` method and are actually used here under the hood.

### `response.send(body, ?code, ?type)`

It's a helper method that does the same as you could do before via (simplified pseudocode).

```js
response.writeHead(statusCode, {'content-type': correspondingMIMEtype})
  .end(bodyString) // automatically JSON.stringified if needed
```
Both `code` and `type` can be omitted independently. Instead of `type`, you can pass an extension like `css` or even the full `filename` or `filepath`; its extension will be used to set the appropriate `content-type` header.

### `response.code`

This is an alias for `response.statusCode` and functions as both a setter and a getter.

### `response.type`

This setter accepts an extension string like `svg` and adds the corresponding MIME type to the `content-type` header, such as `image/svg+xml; charset=utf-8`. If a full path string is provided instead, it will attempt to extract an extension and use it. As a getter, it will display the current `content-type` header.

### `response.path`

This setter accepts a `filename` or `filepath` string, extracts the extension part, and uses it to set the `content-type` header via the `response.type` setter. It will then attempt to read the file found at that path and stream it to the client. If no file is found, the response will emit an 'error', allowing you to handle it.

### `response.body`

This setter accepts a string/buffer and sends it to the client. Otherwise, it treats the argument as a data object, attempts to `JSON.stringify()` it, and then sends it. If `httpity.autoEnd` is set to `true` (which it is by default), it uses `response.end()`. As a getter, it will display the data previously sent via this same response, if any.
