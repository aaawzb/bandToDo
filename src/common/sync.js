import file from '@system.file'
import { DATA_PATH } from './utils.js'

export const SyncProtocol = {
  GET_ALL: 'getAllTodo',
  ADD: 'addTodo',
  UPDATE: 'updateTodo',
  DELETE: 'deleteTodo',
  SYNC_RESPONSE: 'syncResponse',
  TODO_CHANGED: 'todoChanged'
}

export function initSync(onTodoUpdate) {
  if (!global.interconnect) return null
  if (global.interconnect._syncInitialized) return global.interconnect
  global.interconnect._syncInitialized = true

  global.interconnect.onmessage = (message) => {
    try {
      const data = JSON.parse(message.data)
      handlePhoneMessage(data, onTodoUpdate)
    } catch (e) {
      console.log('sync parse error')
    }
  }

  global.interconnect.onopen = () => {
    global.connected = true
  }

  global.interconnect.onclose = () => {
    global.connected = false
  }

  return global.interconnect
}

function handlePhoneMessage(data, onTodoUpdate) {
  switch (data.type) {
    case SyncProtocol.GET_ALL:
      sendAllTodos()
      break
    case SyncProtocol.ADD:
      addTodoFromPhone(data, onTodoUpdate)
      break
    case SyncProtocol.UPDATE:
      updateTodoFromPhone(data, onTodoUpdate)
      break
    case SyncProtocol.DELETE:
      deleteTodoFromPhone(data, onTodoUpdate)
      break
  }
}

function sendAllTodos() {
  file.readText({
    uri: 'internal://app' + DATA_PATH,
    success(ret) {
      let todos = []
      try {
        let parsed = JSON.parse(ret.text)
        if (Array.isArray(parsed)) todos = parsed
      } catch (e) {}
      sendToPhone({ type: SyncProtocol.SYNC_RESPONSE, todos: todos })
    },
    fail() {
      sendToPhone({ type: SyncProtocol.SYNC_RESPONSE, todos: [] })
    }
  })
}

function addTodoFromPhone(data, onTodoUpdate) {
  let newTodo = data.todo
  if (!newTodo || !newTodo.title || !newTodo.createdAt) return

  file.readText({
    uri: 'internal://app' + DATA_PATH,
    success(ret) {
      let todos = []
      try {
        let parsed = JSON.parse(ret.text)
        if (Array.isArray(parsed)) todos = parsed
      } catch (e) {}
      todos.push(newTodo)
      file.writeText({
        uri: 'internal://app' + DATA_PATH,
        text: JSON.stringify(todos),
        success() {
          if (onTodoUpdate) onTodoUpdate(todos)
          broadcastChanged()
        }
      })
    },
    fail() {
      file.writeText({
        uri: 'internal://app' + DATA_PATH,
        text: JSON.stringify([newTodo]),
        success() {
          if (onTodoUpdate) onTodoUpdate([newTodo])
          broadcastChanged()
        }
      })
    }
  })
}

function updateTodoFromPhone(data, onTodoUpdate) {
  let updatedTodo = data.todo
  if (!updatedTodo || !updatedTodo.createdAt) return

  file.readText({
    uri: 'internal://app' + DATA_PATH,
    success(ret) {
      let todos = []
      try {
        let parsed = JSON.parse(ret.text)
        if (Array.isArray(parsed)) todos = parsed
      } catch (e) {}
      let idx = todos.findIndex(function(t) { return t.createdAt === updatedTodo.createdAt })
      if (idx >= 0) {
        todos.splice(idx, 1, updatedTodo)
        file.writeText({
          uri: 'internal://app' + DATA_PATH,
          text: JSON.stringify(todos),
          success() {
            if (onTodoUpdate) onTodoUpdate(todos)
            broadcastChanged()
          }
        })
      }
    },
    fail() {}
  })
}

function deleteTodoFromPhone(data, onTodoUpdate) {
  let createdAt = data.createdAt
  if (!createdAt) return

  file.readText({
    uri: 'internal://app' + DATA_PATH,
    success(ret) {
      let todos = []
      try {
        let parsed = JSON.parse(ret.text)
        if (Array.isArray(parsed)) todos = parsed
      } catch (e) {}
      let idx = todos.findIndex(function(t) { return t.createdAt === createdAt })
      if (idx >= 0) {
        todos.splice(idx, 1)
        file.writeText({
          uri: 'internal://app' + DATA_PATH,
          text: JSON.stringify(todos),
          success() {
            if (onTodoUpdate) onTodoUpdate(todos)
            broadcastChanged()
          }
        })
      }
    },
    fail() {}
  })
}

function sendToPhone(payload) {
  if (global.interconnect && global.connected) {
    try {
      global.interconnect.send({ data: JSON.stringify(payload) })
    } catch (e) {
      console.log('send to phone failed')
    }
  }
}

export function broadcastChanged() {
  sendToPhone({ type: SyncProtocol.TODO_CHANGED })
}
