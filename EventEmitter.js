/* global */
class EventEmitter {
  constructor () {
    this._events = {}
  }

  on (evtName, func) {
    if (!this._events[evtName]) {
      this._events[evtName] = []
    }
    this._events[evtName].push(func)
  }

  off (evtName, func) {
    if (this._events[evtName]) {
      if (!func) {
        this._events.length = 0
      } else {
        for (let i = this._events[evtName].length - 1; i >= 0; i--) {
          if (fn === func) {
            this._events[evtName].splice(i, 1)
          }
        }
      }
    }
  }
  emit (evtName, fileName) {
    let idx = evtName.indexOf(':')
    let evtType
    let filePath
    if (idx !== -1) {
      evtType = evtName.substr(0, idx)
      filePath = evtName.substr(idx + 1)
    }
    if (this._events[evtName]) {
      for (let i = 0; i < this._events[evtName].length; i++) {
        this._events[evtName][i].call(null, evtType || evtName, fileName || filePath)
      }
    }
  }
}

export default EventEmitter
