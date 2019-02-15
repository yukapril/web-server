import React, { PureComponent } from 'react'
import './App.less'
import Button from 'antd/lib/button'
import Table from 'antd/lib/table'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import message from 'antd/lib/message'

const FormItem = Form.Item
const Column = Table.Column
const { ipcRenderer } = require('electron')

const serverStart = (pid, path, port) => {
  ipcRenderer.send('server-req', {
    pid,
    op: 'start',
    options: { path, port: port }
  })
}

const serverStop = (pid) => {
  ipcRenderer.send('server-req', {
    pid,
    op: 'stop'
  })
}

const openUrl = url => {
  ipcRenderer.send('open-url', { url })
}

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

class App extends PureComponent {
  state = {
    serverList: [],
    serverPath: '',
    serverPort: undefined
  }

  serverReceive () {
    ipcRenderer.on('server-resp', (event, arg) => {
      const { pid, op, success, options, msg } = arg
      const { serverList } = this.state
      if (success) {
        if (op === 'start') {
          const newServerList = [...serverList, {
            pid,
            path: options.path,
            port: options.port,
            url: `http://localhost:${options.port}`
          }]
          this.setState({ serverList: newServerList })
          this.clearForm()
        } else if (op === 'stop') {
          const newServerList = serverList.filter(server => server.pid !== pid)
          this.setState({ serverList: newServerList })
        }
      } else {
        message.error(msg)
      }
    })
  }

  handlePathChange = e => {
    if (e.target && e.target.files[0] && e.target.files[0].path) {
      const serverPath = e.target.files[0].path
      this.setState({ serverPath })
      e.target.value = ''
    }
  }

  handlePortChange = e => {
    let port = e.target.value
    port = port.replace(/\s/g, '').replace(/\D/g, '')
    this.setState({ serverPort: parseInt(port) })
  }

  handleCreateClick = () => {
    const { serverPath, serverPort } = this.state
    if (serverPort > 65535) {
      message.error('Port cannot be greater than 65535.')
      return
    }
    const pid = new Date().getTime().toString()
    serverStart(pid, serverPath, serverPort)
  }

  handleRemoveClick = pid => {
    serverStop(pid)
  }

  handleVisitClick = url => {
    openUrl(url)
  }

  handleRndClick = () => {
    this.setState({ serverPort: rnd(8000, 9999) })
  }

  clearForm = () => {
    this.setState({ serverPath: '', serverPort: undefined })
  }

  render () {
    const state = this.state

    const formItemLayout = {
      labelCol: {
        sm: { span: 2 }
      },
      wrapperCol: {
        sm: { span: 22 }
      }
    }
    const formSubmitLayout = {
      wrapperCol: {
        sm: { span: 22, offset: 2 }
      }
    }
    const submitDisabled = !state.serverPath || !state.serverPort

    return (
      <div className='container'>
        <section>
          <h2>Create</h2>
          <Form onSubmit={this.handleCreateClick}>
            <FormItem label='Path' {...formItemLayout}>
              <div className='form-file'>
                <Input type='text' value={state.serverPath}/>
                <input type='file'
                       className='input-file'
                       onChange={this.handlePathChange}
                       webkitdirectory='true'/>
              </div>
            </FormItem>
            <FormItem label='Port' {...formItemLayout}>
              <Row>
                <Col span={20}>
                  <Input type='text'
                         value={state.serverPort}
                         allowClear
                         onChange={this.handlePortChange}/>
                </Col>
                <Col span={3} offset={1} style={{ textAlign: 'right' }}>
                  <Button onClick={this.handleRndClick}>random</Button>
                </Col>
              </Row>

            </FormItem>
            <FormItem label='' {...formSubmitLayout}>
              <Button type='primary'
                      disabled={submitDisabled}
                      onClick={this.handleCreateClick}>Create</Button>
            </FormItem>
          </Form>
        </section>
        <div className='divider'/>
        <section>
          <h2>Servers</h2>
          <Table dataSource={state.serverList} rowKey='pid' pagination={false}>
            {/*<Column title='Pid'*/}
            {/*dataIndex='pid'*/}
            {/*key='pid'/>*/}
            <Column title='Path'
                    dataIndex='path'
                    key='path'/>
            <Column title='Port'
                    dataIndex='port'
                    key='port'
                    width={80}/>
            <Column title='Url'
                    dataIndex='url'
                    key='url'
                    width={200}
                    render={(text, record) => (
                      <span>
                        <a href='javascript:void(0)'
                           onClick={e => this.handleVisitClick(text)}>{text}</a>
                      </span>
                    )}/>
            <Column title='Action'
                    key='action'
                    width={80}
                    render={(text, record) => (
                      <span>
                        <a href='javascript:void(0)'
                           onClick={e => this.handleRemoveClick(record.pid)}>Delete</a>
                      </span>
                    )}/>
          </Table>
        </section>
      </div>
    )
  }

  componentDidMount () {
    this.serverReceive()
  }
}

export default App
