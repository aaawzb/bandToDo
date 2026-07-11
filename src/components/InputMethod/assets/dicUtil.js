import { dict } from './dic.js'
import { dict as romaji2kanji } from './dic_jp.js'

let SimpleInputMethod = {
  dict: {}
}

SimpleInputMethod.initDict = function() {
  this.dict.py2hz = dict
  this.dict.py2hz2 = {}
  this.dict.py2hz2['i'] = 'i'

  for (let key in this.dict.py2hz) {
    let ch = key[0]
    if (!this.dict.py2hz2[ch]) {
      this.dict.py2hz2[ch] = this.dict.py2hz[key]
    }
  }

  this.dict.romaji2kanji = romaji2kanji
}

SimpleInputMethod.getSingleHanzi = function(pinyin, lang = 'cn') {
  if (lang === 'cn') {
    return this.dict.py2hz2[pinyin]
        || this.dict.py2hz[pinyin]
        || ''
  }
  else if (lang === 'jp') {
    return this.dict.romaji2kanji[pinyin]
        || ''
  }
  return ''
}

SimpleInputMethod.getHanzi = function(pinyin, lang = 'cn') {
  let result = this.getSingleHanzi(pinyin, lang)
  if (result) {
    return [ result.split(''), pinyin ]
  }

  let max = Math.min(pinyin.length, 6)
  for (let len = max; len >= 1; len--) {
    let head = pinyin.substr(0, len)
    let rs = this.getSingleHanzi(head, lang)
    if (rs) {
      return [ rs.split(''), head ]
    }
  }

  return [ [], '' ]
}

SimpleInputMethod.initDict()

export { SimpleInputMethod }
