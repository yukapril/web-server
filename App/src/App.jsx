import React, { PureComponent } from 'react'
import './App.less'
import Button from 'antd/lib/button'
import Table from 'antd/lib/table'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import message from 'antd/lib/message'
import Checkbox from 'antd/lib/checkbox'
const { TextArea } = Input

const FormItem = Form.Item
const Column = Table.Column
const { ipcRenderer } = require('electron')

const serverStart = (pid, options) => {
  ipcRenderer.send('server-req', { pid, op: 'start', options })
}

const serverStop = pid => {
  ipcRenderer.send('server-req', { pid, op: 'stop' })
}

const openUrl = url => {
  ipcRenderer.send('open-url', { url })
}

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const renderHeaders = headers => {
  return Object.keys(headers).map(key => {
    const val = headers[key]
    return <React.Fragment><span>{key + ':' + val}</span><br /></React.Fragment>
  })
}

class App extends PureComponent {
  state = {
    serverList: [],
    curServerPath: '',
    curServerPort: '',
    curSpaChecked: false,
    curHeaders: ''
  }

  serverReceive() {
    ipcRenderer.on('server-resp', (event, arg) => {
      const { pid, op, success, options, msg } = arg
      const { serverList } = this.state
      if (success) {
        if (op === 'start') {
          const newServerList = [...serverList, {
            pid,
            path: options.path,
            port: options.port,
            url: `http://localhost:${options.port}`,
            spa: options.spa,
            headers: options.headers
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
      console.log(111, e.target, e.target.files[0])
      const curServerPathFile = e.target.files[0].path
      const curServerPath = curServerPathFile.slice(0, curServerPathFile.lastIndexOf('/'))
      this.setState({ curServerPath })
      e.target.value = ''
    }
  }

  handlePortChange = e => {
    let port = e.target.value
    port = port.replace(/\s/g, '').replace(/\D/g, '')
    this.setState({ curServerPort: port })
  }

  handleCreateClick = () => {
    const { curServerPath, curServerPort, curSpaChecked, curHeaders } = this.state
    const port = parseInt(curServerPort)
    if (port > 65535) {
      message.error('Port cannot be greater than 65535.')
      return
    }
    let headers = {}
    if (curHeaders) {
      const headersArr = curHeaders.split('\n')
      headers = headersArr.reduce((pre, next) => {
        const d = next.split(':')
        const key = d[0] ? d[0].trim() : ''
        const val = d[1] ? d[1].trim() : ''
        if (key) pre[key] = val
        return pre
      }, {})
    }

    const pid = new Date().getTime().toString()
    serverStart(pid, { path: curServerPath, port, spa: curSpaChecked, headers })
  }

  handleRemoveClick = pid => {
    serverStop(pid)
  }

  handleVisitClick = url => {
    openUrl(url)
  }

  handleRndClick = () => {
    this.setState({ curServerPort: rnd(8000, 9999) })
  }

  handleSpaChange = e => {
    const checked = e.target.checked
    this.setState({ curSpaChecked: checked })
  }

  handleHeadersChange = e => {
    const headers = e.target.value
    this.setState({ curHeaders: headers })
  }

  clearForm = () => {
    this.setState({ curServerPath: '', curServerPort: '', curSpaChecked: false, curHeaders: '' })
  }

  render() {
    const state = this.state

    const formItemLayout = {
      labelCol: {
        sm: { span: 2 }
      },
      wrapperCol: {
        sm: { span: 22 }
      }
    }
    const formNoLabelLayout = {
      wrapperCol: {
        sm: { span: 22, offset: 2 }
      }
    }
    const submitDisabled = !state.curServerPath || !state.curServerPort

    const headersPlaceholder = `Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: *`

    return (
      <div className='container'>
        <section>
          <h2>Create</h2>
          <Form onSubmit={this.handleCreateClick}>
            <FormItem label='Path' {...formItemLayout}>
              <div className='form-file'>
                <Input type='text' value={state.curServerPath} />
                <input type='file'
                  className='input-file'
                  onChange={this.handlePathChange}
                  webkitdirectory='true' />
              </div>
            </FormItem>
            <FormItem label='Port' {...formItemLayout}>
              <Row>
                <Col span={20}>
                  <Input type='text'
                    value={state.curServerPort}
                    allowClear
                    onChange={this.handlePortChange} />
                </Col>
                <Col span={3} offset={1} style={{ textAlign: 'right' }}>
                  <Button onClick={this.handleRndClick}>random</Button>
                </Col>
              </Row>
            </FormItem>
            <FormItem label='Headers' {...formItemLayout}>
              <TextArea placeholder={headersPlaceholder}
                autosize={{ minRows: 2, maxRows: 6 }}
                value={state.curHeaders}
                onChange={this.handleHeadersChange} />
            </FormItem>
            <FormItem label='' {...formNoLabelLayout}>
              <Checkbox onChange={this.handleSpaChange} checked={state.curSpaChecked} >SPA</Checkbox>
            </FormItem>
            <FormItem label='' {...formNoLabelLayout}>
              <Button type='primary'
                disabled={submitDisabled}
                onClick={this.handleCreateClick}>Create</Button>
            </FormItem>
          </Form>
        </section>
        <div className='divider' />
        <section>
          <h2>Servers</h2>
          <Table dataSource={state.serverList} rowKey='pid' pagination={false}>
            {/*<Column title='Pid'*/}
            {/*dataIndex='pid'*/}
            {/*key='pid'/>*/}
            <Column title='Path'
              dataIndex='path'
              key='path' />
            <Column title='Port'
              dataIndex='port'
              key='port'
              width={80} />
            <Column title='SPA'
              dataIndex='spa'
              key='spa'
              render={(text, record) => (<span>{text ? 'yes' : 'no'}</span>)}
              width={50} />
            <Column title='Headers'
              dataIndex='headers'
              key='headers'
              render={(text, record) => (<span>{renderHeaders(text)}</span>)}
              width={200} />
            <Column title='Url'
              dataIndex='url'
              key='url'
              width={200}
              render={(text, record) => (
                <span>
                  <a href='javascript:void(0)'
                    onClick={e => this.handleVisitClick(text)}>{text}</a>
                </span>
              )} />
            <Column title='Action'
              key='action'
              width={80}
              render={(text, record) => (
                <span>
                  <a href='javascript:void(0)'
                    onClick={e => this.handleRemoveClick(record.pid)}>Delete</a>
                </span>
              )} />
          </Table>
        </section>
      </div>
    )
  }

  componentDidMount() {
    this.serverReceive()
  }
}

export default App
