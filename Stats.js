/* global */

class Stats {
  constructor (meta) {
    this.file = meta.file
    this.directory = meta.directory
    this.mtime = typeof meta.mtime === 'string' || typeof meta.mtime === 'number' ? new Date(meta.mtime) : meta.mtime
    this.ctime = typeof meta.ctime === 'string' || typeof meta.ctime === 'number' ? new Date(meta.ctime) : meta.ctime
    this.birthtime = typeof meta.birthtime === 'string' || typeof meta.birthtime === 'number' ? new Date(meta.birthtime) : meta.birthtime
    this.size = meta.size
    this.type = meta.type
    this.fullPath = meta.fullPath
    this.name = meta.name
  }

  isDirectory () {
    return this.directory
  }

  isFile () {
    return this.file
  }

  isSocket () {
    return false
  }

  isSymbolicLink () {
    return false
  }
}

export default Stats
