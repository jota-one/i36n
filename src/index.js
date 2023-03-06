import { ref, reactive, watch, computed, provide, inject } from 'vue'
import md from 'snarkdown'
import { replace, extractPlaceholders } from '@jota-one/replacer'

const i36nSymbol = Symbol()
const i36n = {}

export const getI36n = function() {
  return i36n
}

export const initI36n = function (language, { load, showKey = ref(false) }) {
  const loaded = ref(0)
  const labels = reactive({})
  const currentLanguage = ref(language)

  const _key = (language, key) => {
    if (!labels[language]) {
      return `{${key}}`
    }
    if (Array.isArray(labels[language][key])) {
      return labels[language][key].map((item, index) => {
        const placeholders = extractPlaceholders(item)
        let plh = ''
        if (placeholders.length > 0) {
          plh = ', [' + placeholders.join(',') + ']'
        }
        return `{${key}[${index}]${plh}}`
      })
    }
    const placeholders = extractPlaceholders(labels[language][key])
    let plh = ''
    if (placeholders.length > 0) {
      plh = ', [' + placeholders.join(',') + ']'
    }
    return `{${key}${plh}}`
  }

  const _format = (value, params, source, markdown = true) => {
    const mdFn = markdown ? md : a => a
    if (Array.isArray(value)) {
      return value.map(v => mdFn(replace(v, params, source)))
    }
    return mdFn(replace(value, params, source))
  }

  const abstractLabel = defaultValue => {
    if (loaded.value === 0) {
      return () => defaultValue
    }

    const langLabels = labels[currentLanguage.value]

    if (showKey.value) {
      return key => _key(currentLanguage.value, key)
    }

    return langLabels
      ? (keyOrArgsObj, _params, _lang = null, _markdown = true) => {
        const isObjectArgMode =
          typeof keyOrArgsObj === 'object' && !(keyOrArgsObj instanceof Array)

        const key = isObjectArgMode ? keyOrArgsObj.key : keyOrArgsObj
        const params = isObjectArgMode ? keyOrArgsObj.params : _params
        const lang = isObjectArgMode ? keyOrArgsObj.lang : _lang
        const markdown = isObjectArgMode ? keyOrArgsObj.markdown : _markdown

        const refLabels = lang ? labels[lang] : langLabels
        return _format(refLabels[key], params, refLabels, markdown) || `{${key}}`
      }
      : () => defaultValue
  }

  const $label = computed(() => {
    return abstractLabel(' ')
  })

  const $labels = computed(() => {
    return abstractLabel([])
  })

  const loadTranslations = async ln => {
    labels[ln] = await load(ln)
    loaded.value += 1
  }

  const setLanguage = async ln => {
    if (ln && !_switching) {
      _switching = true

      if (!labels[ln]) {
        await loadTranslations(ln)
      }
      currentLanguage.value = ln

      _switching = false
    }
    return true
  }

  let _switching = false
  watch(currentLanguage, setLanguage, { immediate: true })

  i36n.language = currentLanguage
  i36n.showKey = showKey
  i36n.$label = $label
  i36n.$labels = $labels
  i36n.setLanguage = setLanguage
  i36n.loadTranslations = loadTranslations
}

export const provideI36n = function (language, { load, showKey = ref(false) }, app) {
  initI36n(language, { load, showKey })

  if (app) {
    app.provide(i36nSymbol, i36n)
  } else {
    provide(i36nSymbol, i36n)
  }
}

export const useI36n = function () {
  return inject(i36nSymbol)
}
