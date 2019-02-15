const http = require('http')
const Koa = require('koa')
const koaStatic = require('koa-static')

let SERVER_LIST = []

const createServer = (options, callback) => {
  const { path, port } = options
  const koaApp = new Koa()
  koaApp.use(koaStatic(path))
  let server

  server = http.createServer(koaApp.callback()).listen(port)
  server.on('error', e => {
    callback && callback(e, null)
  })
  server.on('listening', () => {
    callback && callback(null, server)
  })
}

const server = (pid, op, options, callback) => {
  let msg = null
  if (op === 'start') {
    const hasPid = SERVER_LIST.some(server => server.pid === pid)
    if (hasPid) {
      msg = 'Pid duplicated.'
      callback({ pid, op, options, success: false, msg })
      return
    }
    createServer(options, (err, server) => {
      if (err) {
        msg = err.errno
        if (err.errno === 'EADDRINUSE') {
          msg = 'Server (port) is occupied'
        }
        callback({ pid, op, options, success: false, msg })
        return
      }
      SERVER_LIST.push({ pid, options, server })
      callback({ pid, op, options, success: true, msg })
    })
  } else if (op === 'stop') {
    setTimeout(() => {
      const serverData = SERVER_LIST.filter(item => item.pid === pid)[0]
      if (!serverData) {
        msg = 'Pid does not exist.'
        callback({ pid, op, options, success: false, msg })
      } else {
        serverData.server.close()
        callback({ pid, op, options, success: true, msg })
      }
    })
  }
}

module.exports = {
  createServer,
  server
}