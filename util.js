/* global Blob atob btoa */
const DIR_SEPARATOR = '/'
const pathBlackList = /[\\:*?"<>|]/

// 文件类型对应表，
// 参考http://www.doc88.com/p-337731437795.html
// 参考https://msdn.microsoft.com/en-us/library/bb742440.aspx
// 参考 https://www.iana.org/assignments/media-types/media-types.txt

const mediaTypes = {
  'text/plain': ',txt,c,h,bas,',
  'text/x-log': ',log,',
  'text/x-sql': ',sql,',
  'text/richtext': ',rtx,',
  'text/css': ',css,',
  'text/csv': ',csv,',
  'text/vcard': ',vcf,',
  'text/html': ',htm,html,xhtml,xht,stm,shtml,shtm,',
  'text/markdown': ',md,',
  'text/php': ',php,',
  'text/x-pl': ',pl,',
  'text/x-python': ',py,',
  'text/java': ',java,',
  'text/jsp': ',jsp,',
  'text/asp': ',asp,',
  'text/xml': ',xml,xslt,wsdl,',
  'text/javascript': ',js,',
  'text/*': ',htt,',

  'audio/wav': ',wav,',
  'audio/mpeg': ',mp3,',
  'audio/m4a': ',m4a,',
  'audio/midi': ',mid,midi,',
  'audio/ogg': ',ogg,',
  'audio/x-aiff': ',aif,aifc,aiff,',
  'audio/x-ms-wma': ',wma,',
  'audio/x-pn-realaudio': ',ra,ram,',
  'audio/*': ',ac3,au,m3u,',

  'video/mpeg': ',mp2,mpa,mpe,mpeg,mpg,mpv2,',
  'video/mp4': ',mp4,m4v,',
  'video/flv': ',flv,',
  'video/quicktime': ',mov,qt,',
  'video/avi': ',avi,',
  'video/x-ms-wmv': ',wmv,',
  'video/x-ms-asf': ',asf,asr,asx,',
  'video/x-matroska': ',mkv,',

  'image/jpeg': ',jpe,jpeg,jpg,',
  'image/png': ',png,',
  'image/bmp': ',bmp,dib,',
  'image/emf': ',emf,',
  'image/wmf': ',wmf,',
  'image/icon': ',ico,',
  'image/gif': ',gif,',
  'image/svg+xml': ',svg,',
  'image/tiff': ',tif,tiff,',
  'image/*': ',jp2,svf,cmx,jfif,',

  'application/ceb': ',ceb,',
  'application/eps': ',eps,',
  'application/postscript': ',ps,',
  'application/illustrator': ',ai,',
  'application/vnd.rn-realmedia': ',rm,',
  'application/vnd.rn-realmedia-vbr': ',rmvb,',
  'application/json': ',json,',
  'application/kswps': ',wps,wpsx,wpt,wptx,',
  'application/msword': ',doc,dot,',
  'application/msworks': ',wcm,wdb,wks,wps,',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ',docx,dotx,wps,',
  'application/vnd.ms-project': ',mpp,',
  'application/vnd.ms-powerpoint': ',pot,pps,ppt,',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ',pptx,',
  'application/vnd.ms-excel': ',xla,xlc,xlm,xls,xlt,xlw,',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ',xlsx,',
  'application/vnd.visio': ',vsd,',
  'application/x-dwg': ',dwg,',
  'application/x-dxf': ',dxf,',
  'application/x-rtf': ',rtf,rtx,',
  'application/x-pdf': ',pdf,',
  'application/x-zip-compressed': ',zip,',
  'application/x-rar-compressed': ',rar,',
  'application/x-compress': ',z,',
  'application/x-compressed': ',tgz,',
  'application/x-tar': ',tar,',
  'application/x-tcl': ',tcl,',
  'application/x-tex': ',tex,',
  'application/x-latex': ',latex,',
  'application/x-shellscript': ',sh,',
  'application/x-shar': ',shar,',
  'application/x-stuffit': ',stuffit,',
  'application/x-gtar': ',gtar,',
  'application/x-gzip': ',gz,',
  'application/x-shockwave-flash': ',swf,',
  'application/java-archive': ',jar,',
  'application/x-webarchive': ',war,',
  'application/x-java': ',class,',
  'application/bin': ',bin,',
  'application/x-photoshop': ',psd,',
  'application/x-exe': ',exe,',
  'application/x-dll': ',dll,',
  'application/octet-stream': ',7z,3gp,krc,lrc,chm,con,dms,ini,ttf,fon,lha,lzh,',
  'application/x-perfmon': ',pma,pmc,pml,pmr,pmw,',
  'application/vnd.ms-access': ',mdb,',
  'application/cab': ',cab,',
  'application/vnd.oasis.opendocument.text': ',odt,',
  'application/vnd.oasis.opendocument.spreadsheet': ',ods,',
  'application/winhlp': ',hlp,',
  'application/hta': ',hta,',
  'application/oda': ',oda,',
  'application/x-itunes-ipa': ',ipa,',
  'application/x-mmxp': ',mxp,',
  'application/*': ',dtd,svf,dat,crd,pub,p12,pfx,',

  'message/*': ',mht,mhtml,',

  'x-world/x-vrml': ',wrl,wrz,xaf,xof,'
}
const util = {
  // from https://github.com/ebidel/idb.filesystem.js/blob/master/src/idb.filesystem.js
  // When saving an entry, the fullPath should always lead with a slash and never
  // end with one (e.g. a directory). Also, resolve '.' and '..' to an absolute
  // one. This method ensures path is legit!
  resolveToFullPath (cwdFullPath, path) {
    var fullPath = path

    var relativePath = path[0] !== DIR_SEPARATOR
    if (relativePath) {
      fullPath = cwdFullPath + DIR_SEPARATOR + path
    }

    // Normalize '.'s,  '..'s and '//'s.
    var parts = fullPath.split(DIR_SEPARATOR)
    var finalParts = []
    for (var i = 0; i < parts.length; ++i) {
      var part = parts[i]
      if (part === '..') {
        // Go up one level.
        if (!finalParts.length) {
          throw Error('Invalid path')
        }
        finalParts.pop()
      } else if (part === '.') {
        // Skip over the current directory.
      } else if (part !== '') {
        // Eliminate sequences of '/'s as well as possible leading/trailing '/'s.
        finalParts.push(part)
      }
    }

    fullPath = DIR_SEPARATOR + finalParts.join(DIR_SEPARATOR)

    // fullPath is guaranteed to be normalized by construction at this point:
    // '.'s, '..'s, '//'s will never appear in it.

    return fullPath
  },
  isValidatedPath (path) {
    return !pathBlackList.test(path)
  },

  utf8ToBinaryString (str) {
    var escstr = encodeURIComponent(str)
    // replaces any uri escape sequence, such as %0A,
    // with binary escape, such as 0x0A
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16))
    })

    return binstr
  },
  utf8ToBuffer (str) {
    var binstr = util.utf8ToBinaryString(str)
    var buf = util.binaryStringToBuffer(binstr)
    return buf
  },
  utf8ToBase64 (str) {
    var binstr = util.utf8ToBinaryString(str)
    return btoa(binstr)
  },
  binaryStringToUtf8 (binstr) {
    var escstr = binstr.replace(/(.)/g, (m, p) => {
      var code = p.charCodeAt(0).toString(16).toUpperCase()
      if (code.length < 2) {
        code = '0' + code
      }
      return '%' + code
    })

    return decodeURIComponent(escstr)
  },
  bufferToUtf8 (buf) {
    var binstr = util.bufferToBinaryString(buf)

    return util.binaryStringToUtf8(binstr)
  },
  base64ToUtf8 (b64) {
    var binstr = atob(b64)

    return util.binaryStringToUtf8(binstr)
  },
  bufferToBinaryString (buf) {
    var binstr = Array.prototype.map.call(buf, function (ch) {
      return String.fromCharCode(ch)
    }).join('')

    return binstr
  },
  bufferToBase64 (arr) {
    var binstr = util.bufferToBinaryString(arr)
    return btoa(binstr)
  },
  binaryStringToBuffer (binstr) {
    var buf

    if (typeof Uint8Array !== 'undefined') {
      buf = new Uint8Array(binstr.length)
    } else {
      buf = []
    }

    Array.prototype.forEach.call(binstr, (ch, i) => {
      buf[i] = ch.charCodeAt(0)
    })

    return buf
  },
  base64ToBuffer (base64) {
    var binstr = atob(base64)
    var buf = util.binaryStringToBuffer(binstr)
    return buf
  },

  dataURLtoString (dataURL) {
    var dataURLPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/

    // parse the dataURL components as per RFC 2397
    var matches = dataURL.match(dataURLPattern)
    if (!matches) {
      throw new Error('invalid dataURI')
    }

    var isBase64 = !!matches[4]
    var dataString = dataURL.slice(matches[0].length)
    var byteString = isBase64
      // convert base64 to raw binary data held in a string
      ? util.binaryStringToUtf8(atob(dataString))
      // convert base64/URLEncoded data component to raw binary
      : decodeURIComponent(dataString)
    return byteString
  },
  dataURLtoBuffer (dataURL) {
    var dataURLPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/

    // parse the dataURL components as per RFC 2397
    var matches = dataURL.match(dataURLPattern)
    if (!matches) {
      throw new Error('invalid dataURI')
    }

    var isBase64 = !!matches[4]
    var dataString = dataURL.slice(matches[0].length)
    var uint8 = isBase64
      // convert base64 to raw binary data held in a string
      ? util.base64ToBuffer(dataString)
      // convert base64/URLEncoded data component to raw binary
      : util.utf8ToBuffer(decodeURIComponent(dataString))

    // default to text/plain;charset=utf-8
    var mimeType = matches[2]
      ? matches[1]
      : 'text/plain' + (matches[3] || ';charset=utf-8')

    uint8.mimeType = mimeType
    return uint8
  },
  dataURLtoBlob (dataURL) {
    var uint8 = util.dataURLtoBuffer(dataURL)
    return new Blob([uint8], { type: uint8.mimeType })
  },
  uint8ArrayToDataURL (uint8, mimeType) {
    var b64 = util.bufferToBase64(uint8)
    mimeType = mimeType || uint8.mimeType || 'application/octet-stream'
    return 'data:' + mimeType + ';base64,' + b64
  },
  stringToDataURL (str, mimeType) {
    var b64 = util.utf8ToBase64(str)
    mimeType = mimeType || 'text/plain'
    return 'data:' + mimeType + ';base64,' + b64
  },
  getMimeByExte (ext) {
    let mime = 'application/octet-stream'
    if (ext) {
      ext = ext.toLowerCase()
      let _ext_ = ',' + ext + ','
      for (var k in mediaTypes) {
        if (mediaTypes[k].indexOf(_ext_) !== -1) {
          mime = k
          break
        }
      }
      if (mime.endsWith('*')) {
        mime.replace('*', ext)
      }
    }
    return mime
  },
  getMimeByPath (path) {
    let fileName = path.substr(path.lastIndexOf('/') + 1)
    if (fileName && fileName.indexOf('.') !== -1) {
      let ext = fileName.substr(fileName.indexOf('.') + 1)
      if (ext !== '.meta') {
        return util.getMimeByExte(ext)
      }
    }
    return ''
  }
}

export default util
