const {IncomingMessage, ServerResponse} = exports =
  module.exports = require('http')
const {decode} = require('querystring')
const {createReadStream} = require('fs')
const {parse, stringify} = JSON,  {error} = console
const {assign, defineProperties, fromEntries, setPrototypeOf} = Object

const utf = '; charset=utf-8'
const types = {
  html: 'text/html'+utf,
  htm: 'text/html'+utf,
  svg: 'image/svg+xml'+utf,
  css: 'text/css'+utf,
  js: 'application/javascript'+utf,
  json: 'application/json'+utf,
  xml: 'application/xml'+utf,
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
  txt: 'text/plain'+utf,
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  ttf: 'application/font-ttf',
  eot: 'application/vnd.ms-fontobject',
  otf: 'application/font-otf',
  woff: 'application/font-woff',
  wasm: 'application/wasm',
}

assign(exports,
  {secure: false, cookieDefaultExpire: 86400*3, autoEnd: true})

defineProperties(IncomingMessage.prototype, {
  cookie: { get () {
    const {parsedCookie, headers: {cookie}} = this
    return parsedCookie || (this.parsedCookie = cookie &&
      fromEntries(cookie.split('; ').map(pair =>
        pair.replace('__Secure-', '').split('='))) || {})
  } },
  rawBody: { async get () {
    if (this.receivedData) return this.receivedData
    const parts = []
    return this.receivedData = new Promise((resolve, reject) => this
      .on('error', reject) .on('data', part => parts.push(part))
      .on('end', () => resolve(Buffer.concat(parts).toString('utf8'))))
  } },
  body: { async get () {
    if (this.parsedBody) return this.parsedBody
    try { this.parsedBody = parse(await this.rawBody) } catch {}
    return this.parsedBody || (this.parsedBody = this.rawBody)
  } },
  path: { get () {
    if (this.urlPath) return this.urlPath
    const [urlPath, urlQuery=''] = this.url.split('?')
    assign(this, {urlPath, urlQuery})
    return urlPath
  } },
  querystring: { get () {
    if (this.urlQuery !== undefined) return this.urlQuery
    const [urlPath, urlQuery=''] = this.url.split('?')
    assign(this, {urlPath, urlQuery})
    return urlQuery
  } },
  query: { get () {
    return this.parsedQuery || (this.parsedQuery =
      setPrototypeOf(decode(this.querystring), Object.prototype))
  } },
  compose: { async value (props) {
    if (!props) {
      const data = await this.composedData
      if (data) return data
      const body = await this.body,  {query} = this
      return this.composedData =
        Array.isArray(body) ? assign(body, query) : assign(query, body)
    }
    const data = !Array.isArray(props) ? parse(stringify(props))
      : fromEntries(props.map(key => [key, '']))
      const allData = await this.composedData || await this.compose()
    for (const key in data) {
      if (allData[key] !== undefined) data[key] = allData[key]
    }
    return data
  }},
  data: { async get () {
    return await this.composedData || this.compose()
  }},
})

defineProperties(assign(ServerResponse.prototype, {
  setCookie(name, value, {expire=exports.cookieDefaultExpire, path='/',
    secure=exports.secure}={}) {
      let cookie = `${name}=${value}; Max-Age=${expire}; Path=${path}`
      cookie = secure ?
        `__Secure-${cookie}; Secure; HttpOnly; SameSite=Strict` : cookie
      if (this.hasHeader('set-cookie')) {
        const cookieSet = [].concat(this.getHeader('set-cookie'), cookie)
        this.setHeader('set-cookie', cookieSet)
        return cookieSet
      } else {
        this.setHeader('set-cookie', cookie)
        return cookie
      }
  },
  delCookie(name, path='/', secure=exports.secure) {
    this.setCookie(name, '', {expire: -1, path, secure})
  },
  send(body, code, type) {
    if (code) {
      if (typeof code == 'string') type = code
      else this.statusCode = code
    }
    if (type) {
      if (/\w+/.test(type)) this.type = type
      else this.path
    }
    if (body !== undefined) {
      if (this.givenBody) throw error('body was already set')
      this.givenBody = body
      if (!(typeof body == 'string' || body instanceof Buffer)) {
        body = stringify(body)
        if (!this.type) this.type = 'json'
      }
      this.end(body)
      return body
    }
  },
}), {
  code: {set (num) {
    this.statusCode = num
  }, get () { return this.statusCode }},
  type: {set (ext) {
    if (this.type) throw error('type was already set')
    if (ext.includes('.')) {
      const extMatch = path.match(/\.([^\/.]*)$/)
      ext = extMatch && extMatch[1]
    }
    if (types[ext]) this.setHeader('content-type', types[ext])
  }, get () { return this.getHeader('content-type') }},
  path: {set (path) {
    const extMatch = path.match(/\.([^\/.]*)$/)
    this.type = extMatch && extMatch[1]
    createReadStream(path).pipe(this)
  }},
  body: {set (data) {
    if (this.givenBody) throw error('body was already set')
    this.givenBody = data
    if (!(typeof data == 'string' || data instanceof Buffer))
      data = stringify(data)
    this[exports.autoEnd ? 'end' : 'write'](data)
  }, get () { return this.givenBody }},
})
