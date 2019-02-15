const { app, BrowserWindow } = require('electron')
const communication = require('./communication')
const menu = require('./menu')

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true
      // devTools: false
    }
  })
  win.loadFile('www/index.html')
  win.once('ready-to-show', () => {
    win.show()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

communication()
menu()

