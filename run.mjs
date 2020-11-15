import c from 'c4console'
import httpity from './index.js'
// httpity.dev = false
httpity.autoEnd = true

httpity.createServer(async (request, response) => {
  const {method, url, cookie, rawBody, body, path, querystring, query} = request
  if (url == '/favicon.ico') return response.end('')
  // ![cookie, rawBody, body, path, querystring, query].forEach(val => val.c())
  response.setCookie('key1', 'value1')
  response.setCookie('key2', 'value2')
  // response.end(`echo on method: ${method} at URL: ${url}`)
  // response.type = 'json'
  // response.code = 404
  // response.body = {answer: 42}
  response.send({answer: 42})
  // response.end()

}).listen(3000, () => c('Server started at http://localhost:3000'))
