import get from 'lodash.get'
import md from 'snarkdown'

const resolve = (str = '', params = {}, source = {}) => {
  const search = /\{([\s\S]+?)\}/g
  if (!str) return ''
  params = Object.assign({}, source, params)
  return str.replace(search, function (term) {
    let key = term.substring(1).slice(0, -1)
    return params[key] !== undefined ? params[key] : term
  })
}

const format = (value, params, source) => {
  if (Array.isArray(value)) {
    return value.map(v => md(resolve(v, params, source)))
  }
  return md(resolve(value, params, source))
}

const _load = async (cb, language) => {
  if (!_labels[language]) {
    _labels[language] = await cb(language)
  }
}

const _instances = {}
const _labels = {}
let _switching = false
let _currentLanguage

export default {
  install (Vue, { enabled, languagePath, load, keyToggleEvent = 'labels:keys:toggle' }) {
    const lp = languagePath || 'language' || 'lang'

    Vue.mixin({
      data: () => ({
        _labels: {
          loaded: 0,
          showKey: false
        }
      }),

      computed: {
        _language () {
          return get(this, lp) || _currentLanguage
        },

        $label () {
          const labels = _labels[_currentLanguage]

          return this._data._labels.showKey
            ? key => `{${key}}`
            : this._data._labels.loaded > 0
              ? (key, params) => {
                return (labels && format(labels[key], params, labels)) || `{${key}}`
              }
              : () => ' '
        }
      },

      watch: {
        _language: {
          immediate: true,
          async handler (language) {
            if (language && !_switching) {
              _switching = true
              _currentLanguage = language

              await _load(load, language)
              this._data._labels.loaded += 1

              for (const instance of Object.values(_instances)) {
                instance._data._labels.loaded = this._data._labels.loaded
              }

              _switching = false
            }
          }
        }
      },

      created () {
        if (!enabled) return

        window.document.addEventListener(
          keyToggleEvent, this._switchShowKey
        )
      },

      beforeDestroy () {
        delete _instances[this._uid]

        if (!enabled) return

        window.document.removeEventListener(
          keyToggleEvent, this._switchShowKey
        )
      },

      mounted () {
        _instances[this._uid] = this
      },

      methods: {
        _switchShowKey () {
          this._data._labels.showKey = !this._data._labels.showKey
        }
      }
    })
  }
}
