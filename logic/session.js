//@TODO need to test signing ability. Also consider switching to iron for encrpytion, and serverside storage as well

var Cookies = require('cookies')
var _ = require('lodash')

var keys = []

module.exports.extension = function(server, ops){
  if(!ops.keys) throw new Error('keys required for cookies')
  keys = ops.keys

  //Setup getCookies and getSession methods on the Request prototype
  server.Request.prototype.getCookies = function(){
    return getCookies(this)
  }

  server.Request.prototype.getSession = function(){
    return getSession(this)
  }
}

function getCookies(request){
  request._cookies = request._cookies || new Cookies(request.raw.request, request.raw.response, keys)
  return request._cookies
}

function getSession(request){
  //Ensure cookies are setup
  if(typeof request._cookies == 'undefined') getCookies(request)
  request._session = request._sesion || new Session(request._cookies)
  return request._session
}

function Session(cookies){
  this.cookies = cookies
  try{
    this.data = JSON.parse(cookies.get('eqcook:sess', { signed: true }) || {})
  }
  catch(err){
    console.log('COULD NOT PARSE COOKIE', err)
    this.data = {}
  }
  console.log('session setup', this.data, '####')
  this._changed = false
}

Session.prototype.set = function(key, value){
  console.log('SET SESSION', key, value)
  if(key)
    this.data[key] = value

  //@TODO if data is set twice in one request, this is redundant, consider optimization
  this.cookies.set('eqcook:sess', JSON.stringify(this.data), {signed: true})
}

Session.prototype.delete = function(key){
  if(key)
    delete this.data[key]
  else
    this.data = {}

  //@TODO if data is set twice in one request, this is redundant, consider optimization
  this.cookies.set('eqcook:sess', JSON.stringify(this.data), {signed: true})
}
