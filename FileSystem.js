/* global localStorage Blob */
import util from './util.js'
import Stats from './Stats.js'
import FileError from './FileError.js'
import EventEmitter from './EventEmitter.js'

const DIR_SEPARATOR = '/'
const META_FILE_EXT = '.meta'

class FileSystem {
  constructor (prefix) {
    // 区分不同系统的前缀
    this.prefix = prefix + '.' || '.'
    this._event = new EventEmitter()
    this.root = this.mkdirSync('/')
  }

  static getInstance (prefix) {
    if (!FileSystem.isSupported) {
      throw FileError.NOT_SUPPORTED
    }
    if (!FileSystem._instance) {
      FileSystem._instance = new FileSystem(prefix)
    }
    return FileSystem._instance
  }
  /**
   * 检查路径
   * @param {String} path
   */
  _fixPath (path, isDirectory) {
    if (!path) {
      throw new Error('没有传入路径参数')
    }
    path = path.replace(/\\+/g, DIR_SEPARATOR).replace(/[\\:*?"<>|]/g, '')
    if (this.prefix && path.indexOf(this.prefix + DIR_SEPARATOR) !== 0) {
      if (path.substr(0, 1) !== DIR_SEPARATOR) {
        path = DIR_SEPARATOR + path
      }
      path = this.prefix + path
    }
    if (isDirectory && !path.endsWith(DIR_SEPARATOR)) {
      path = path + DIR_SEPARATOR
    }
    return path
  }

  existsSync (path) {
    path = this._fixPath(path)
    return !(localStorage.getItem(path) === null && localStorage.getItem(path + DIR_SEPARATOR) === null)
  }

  createReadStream (path) { // TODO:
    path = this._fixPath(path)
    let uint8Data = this.readFileSync(path)
    return new Blob([uint8Data], { type: uint8Data.mimeType || util.getMimeByPath(path) })
  }

  mkdirSync (path, mode) {
    path = this._fixPath(path)
    if (!path.endsWith('/')) {
      path = path + '/'
    }
    if (this.existsSync(path)) {
      return false
    }
    let stats = new Stats({
      file: false,
      directory: true,
      mtime: new Date(),
      ctime: new Date(),
      birthtime: new Date(),
      size: 0,
      name: path.split(DIR_SEPARATOR).pop(),
      fullPath: path,
      type: null
    })
    try {
      localStorage.setItem(path, '')
      localStorage.setItem(path + META_FILE_EXT, JSON.stringify(stats))
    } catch (e) {
      return false
    }
    return true
  }
  /**
   * 递归创建目录
   * @param {String} path
   */
  mkdirsSync (dirpath, mode) {
    let _this = this
    dirpath = this._fixPath(dirpath)
    try {
      if (!this.existsSync(dirpath)) {
        let pathtmp
        dirpath.split(/[/\\]/).forEach(function (dirname) {  // 这里指用/ 或\ 都可以分隔目录  如  linux的/usr/local/services   和windows的 d:\temp\aaaa
          if (pathtmp) {
            pathtmp = pathtmp + DIR_SEPARATOR + dirname
          } else {
            pathtmp = dirname
          }
          pathtmp = _this._fixPath(pathtmp)
          if (!_this.existsSync(pathtmp)) {
            if (!_this.mkdirSync(pathtmp, mode)) {
              return false
            }
          }
        })
      }
      return true
    } catch (e) {
      throw new Error('create director fail! path=' + dirpath + ' errorMsg:' + e)
    }
  }
  _parentPath (path) {
    let parentPath = path.substr(0, path.lastIndexOf('/') + 1)
    if (parentPath === this.prefix) {
      parentPath = this.prefix + DIR_SEPARATOR
    }
    return parentPath
  }
  /**
   * 递归删除指定目录下的所有目录和文件,包括当前目录
   * @param {String} dirpath
   */
  rmdirSync (path) {
    path = this._fixPath(path)
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        let name = localStorage.key(i)
        if (name.indexOf(path) === 0) {
          localStorage.removeItem(name + META_FILE_EXT)
          localStorage.removeItem(name)
        }
      }
    } catch (e) {
      throw new Error('remove director fail! path=' + path + ' errorMsg:' + e)
    }
    return true
  }
  /**
   * 递归删除指定目录下的所有目录和文件,包括当前目录
   * @param {String} dirpath
   */
  rmdirsSync (path) {
    path = this._fixPath(path)
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        let name = localStorage.key(i)
        if (name.indexOf(path) === 0) {
          localStorage.removeItem(name + META_FILE_EXT)
          localStorage.removeItem(name)
        }
      }
    } catch (e) {
      throw new Error('remove director fail! path=' + path + ' errorMsg:' + e)
    }
    return true
  }

  /**
   * 获取目录中的文件列表
   * @param {String} path
   */
  readdirSync (path) {
    path = this._fixPath(path, true)
    let stats
    if (!this.existsSync(path)) {
      throw new Error('未找到路径' + path)
    }
    stats = this.statSync(path)
    if (!stats.isDirectory()) {
      throw new Error('未找' + path + '不是文件夹')
    }
    let files = []
    for (var i = localStorage.length - 1; i >= 0; i--) {
      let name = localStorage.key(i)
      if (name.indexOf(path) === 0 && name !== path && !name.endsWith(META_FILE_EXT) && /^[^/]+\/?$/.test(name.substr(path.length))) {
        files.push(name.substr(path.length))
      }
    }
    return files.sort()
  }

  renameSync (path, newPath) {
    if (path === DIR_SEPARATOR) {
      throw new Error('不能重命名根目录')
    }
    path = this._fixPath(path)
    if (!this.existsSync(path)) {
      throw new Error('未找到路径' + path)
    }
    if (newPath.indexOf(DIR_SEPARATOR) !== -1) {
      newPath = this._fixPath(newPath)
    } else {
      newPath = newPath.replace(/[\\:*?"<>|]/g, '')
      newPath = path.substr(0, path.lastIndexOf(DIR_SEPARATOR)) + DIR_SEPARATOR + newPath
    }
    let stats
    stats = this.statSync(path)
    if (!stats) {
      // 不存在创建
      throw new Error('文件 ' + path + ' 属性不存在')
    } else {
      // 存在更新
      stats.ctime = new Date()
      stats.type = util.getMimeByPath(newPath) || stats.type
    }
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        let name = localStorage.key(i)
        if (name.indexOf(path) === 0) {
          localStorage.setItem(newPath, localStorage.getItem(name))
          localStorage.setItem(newPath + META_FILE_EXT, JSON.stringify(stats))
          localStorage.removeItem(name + META_FILE_EXT)
          localStorage.removeItem(name)
        }
      }
      if (stats.isFile()) {
        this._event.emit('rename:' + path, path.substr(path.lastIndexOf('/') + 1))
        let parentPath = this._parentPath(path)
        this._event.emit('rename:' + parentPath, path.substr(path.lastIndexOf('/') + 1))
      }
    } catch (e) {
      throw new Error('rename fail! path=' + newPath + ' errorMsg:' + e)
    }
  }

  readFileSync (path, opts) {
    if (typeof opts === 'string') {
      opts = { encoding: opts }
    }
    let encoding = (opts && opts.encoding) || null
    path = this._fixPath(path)
    let stats
    if (this.existsSync(path)) {
      stats = this.statSync(path)
      if (!stats.isFile()) {
        throw new Error('路径' + path + '不是文件')
      }
    } else {
      throw new Error('未找到路径' + path)
    }
    const data = localStorage.getItem(path)
    if (data) {
      if (encoding || data.substr(0, data.lastIndexOf(',')).indexOf('base64') === -1) {
        return util.dataURLtoString(data)
      } else {
        return util.dataURLtoBuffer(data)
      }
    }
    return new Uint8Array()
  }

  /**
   * 获得元数据
   * @param {String} path
   */
  statSync (path) {
    path = this._fixPath(path)
    let data = localStorage.getItem(path + META_FILE_EXT)
    let stats
    if (data) {
      stats = JSON.parse(data)
      return new Stats(stats)
    }
    return null
  }
  _setStatSync (path, stats) {
    path = this._fixPath(path)
    if (stats instanceof Stats) {
      stats = JSON.stringify(stats)
    }
    if (!path.endsWith(META_FILE_EXT)) {
      path = path + META_FILE_EXT
    }
    localStorage.setItem(path, stats)
  }

  unlinkSync (path) {
    path = this._fixPath(path)
    localStorage.removeItem(path + META_FILE_EXT)
    localStorage.removeItem(path)
    this._event.emit('change:' + path, path.substr(path.lastIndexOf('/') + 1))
    let parentPath = this._parentPath(path)
    this._event.emit('change:' + parentPath, path.substr(path.lastIndexOf('/') + 1))
    return true
  }
  utimesSync (path, atime, mtime) {
    path = this._fixPath(path)
    let stats = this.statSync(path)
    if (typeof atime === 'number') {
      if (new Date(atime) > new Date()) {
        atime = ~~(atime / 1000)
      } else if (new Date(atime) < new Date(0)) {
        atime = atime * 1000
      }
      stats.atime = new Date(atime)
    }
    if (typeof mtime === 'number') {
      if (new Date(mtime) > new Date()) {
        mtime = ~~(mtime / 1000)
      } else if (new Date(mtime) < new Date(0)) {
        mtime = mtime * 1000
      }
      stats.mtime = new Date(atime)
    }
    this._setStatSync(path, stats)
  }
  watch (path, opts, func) {
    if (typeof opts === 'function') {
      func = opts
      opts = null
    }
    path = this._fixPath(path)
    this._event.on('change:' + path, func)
  }
  unwatch (path, opts, func) {
    if (typeof opts === 'function') {
      func = opts
      opts = null
    }
    path = this._fixPath(path)
    this._event.off('change:' + path, func)
  }
  /**
   * TODO::// 暂不支持 append
   * @param {String} path
   * @param {String|Uint8Array} content 写入的内容
   * @param {Object} options
   */
  writeFileSync (path, content, opts) {
    if (typeof opts === 'string') {
      opts = { encoding: opts }
    }
    path = this._fixPath(path)
    let type = (opts && opts.type) || util.getMimeByPath(path)
    let stats
    if (this.existsSync(path)) {
      if (!this.statSync(path).isFile()) {
        throw new FileError({ message: FileError.ONLY_FILE_WRITE })
      }
      stats = this.statSync(path)
    }

    let data = content
    let size = content.length
    // 不是blob，转为blob
    if (content instanceof ArrayBuffer) {
      size = content.byteLength
      data = util.uint8ArrayToDataURL(new Uint8Array(content), type)
    } if (content instanceof Uint8Array) {
      size = content.byteLength
      data = util.uint8ArrayToDataURL(content, type)
    } else if (typeof content === 'string') {
      size = encodeURIComponent(content).length
      data = util.stringToDataURL(content, type)
    } else {
      throw new Error('write 方法只能接受 Uint8Array 或 String')
    }
    if (!stats) {
      // 不存在创建
      stats = new Stats({
        file: true,
        directory: false,
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
        size: size,
        name: path.split(DIR_SEPARATOR).pop(),
        fullPath: path,
        type: type || util.getMimeByPath(path)
      })
    } else {
      // 存在更新
      stats.mtime = new Date()
      stats.ctime = new Date()
      stats.type = type || stats.type || util.getMimeByPath(path)
      stats.size = size
    }
    localStorage.setItem(path + META_FILE_EXT, JSON.stringify(stats))
    localStorage.setItem(path, data)
    this._event.emit('change:' + path, path.substr(path.lastIndexOf('/') + 1))
    let parentPath = this._parentPath(path)
    this._event.emit('change:' + parentPath, path.substr(path.lastIndexOf('/') + 1))
    return true
  }
}

FileSystem.isSupported = () => {
  return !!(window.localStorage && window.localStorage.setItem && window.localStorage.getItem)
}

FileSystem.Stats = Stats

export default FileSystem
