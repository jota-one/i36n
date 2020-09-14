import Vue from 'vue'
import VueCompositionAPI, { ref, watch, computed, provide, inject } from '@vue/composition-api'
import md from 'snarkdown'
import { replace, extractPlaceholders } from '@jota-one/replacer'

const _instances = {}
const _labels = {}
let _switching = false
let _currentLanguage

const _format = (value, params, source) => {
  if (Array.isArray(value)) {
    return value.map(v => md(replace(v, params, source)))
  }
  return md(replace(value, params, source))
}

const _load = async (cb, language) => {
  if (!_labels[language]) {
    _labels[language] = await cb(language)
  }
}

const _key = (language, key) => {
  if (Array.isArray(_labels[language][key])) {
    return _labels[language][key].map((item, index) => {
      const placeholders = extractPlaceholders(item)
      let plh = ''
      if (placeholders.length > 0) {
        plh = ', [' + placeholders.join(',') + ']'
      }
      return `{${key}[${index}]${plh}}`
    })
  }
  const placeholders = extractPlaceholders(_labels[language][key])
  let plh = ''
  if (placeholders.length > 0) {
    plh = ', [' + placeholders.join(',') + ']'
  }
  return `{${key}${plh}}`
}

Vue.use(VueCompositionAPI)
const loadedSymbol = Symbol()
const showKeySymbol = Symbol()

const provideI36n = function (language, showKey, { load }) {
  const loaded = ref(0)

  watch(() => language, async () => {
    if (language && !_switching) {
      _switching = true
      _currentLanguage = language

      await _load(load, language)
      loaded.value += 1

      for (const instance of Object.values(_instances)) {
        instance._data._labels.loaded = this._data._labels.loaded
      }

      _switching = false
    }
  }, { immediate: true })


  provide(showKeySymbol, ref(showKey))
  provide(loadedSymbol, loaded)
}

const useI36n = function () {
  const showKey = inject(showKeySymbol)
  const loaded = inject(loadedSymbol)

  const $label = computed(() => {
    const labels = _labels[_currentLanguage]

    if (showKey.value) {
      return key => _key(_currentLanguage, key)
    }

    return loaded.value > 0
      ? (key, params) => {
        return (labels && _format(labels[key], params, labels)) || `{${key}}`
      }
      : () => ' '
  })

  // beforeDestroy () {
  //   delete _instances[this._uid]
  // },
  //
  // mounted () {
  //   _instances[this._uid] = this
  // }

  return {
    $label
  }
}

export { useI36n, provideI36n }
