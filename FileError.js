class FileError {
  constructor ({ code = 999, message = '未知错误' } = { code: 999, message: '未知错误' }) {
    this.code = code
    this.message = message
  }
}
FileError.NOT_IMPLEMENTED_ERROR = new FileError({
  code: 1000,
  message: '项目中暂时不用到，待实现'
})
FileError.NOT_FOUND_ERROR = '未找到路径'
FileError.NOT_SUPPORTED = new Error('在此运行环境，无法实现')
FileError.INITIALIZE_FAILED = '文件系统初始化失败'
FileError.FILE_EXISTED = '文件已存在'
FileError.Directory_EXISTED = '目录已存在'
FileError.ONLY_FILE_WRITE = '只有文件才能写入'
FileError.NOT_ENTRY = '不是有效的Entry对象'
FileError.INVALID_PATH = '文件或者目录不能包含\\/:*?"<>|'

export default FileError
