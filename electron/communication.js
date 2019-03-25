const { ipcMain, shell } = require('electron')
const { server } = require('./server')

const communication = () => {
  ipcMain.on('server-req', (event, arg) => {
    // console.log('[main]', 'server-req:', arg)
    const { pid, op, options } = arg
    server(pid, op, options, resp => {
      event.sender.send('server-resp', resp)
    })
  })

  ipcMain.on('open-url', (event, arg) => {
    // console.log('[main]', 'open-url:', arg)
    const { url } = arg
    shell.openExternal(url)
  })

}

module.exports = communication