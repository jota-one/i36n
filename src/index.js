import { ref, reactive, watch, computed, provide, inject } from 'vue'
import md from 'snarkdown'
import { replace, extractPlaceholders } from '@jota-one/replacer'

const i36nSymbol = Symbol()

const provideI36n = function (language, { load, showKey = ref(false) }, app) {
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
      ? (key, params, lang = null, markdown = true) => {
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

  let _switching = false
  watch(() => currentLanguage.value, async ln => {
    if (ln && !_switching) {
      _switching = true

      if (!labels[ln]) {
        await loadTranslations(ln)
      }

      _switching = false
    }
  }, { immediate: true })

  const i36n = {
    language: currentLanguage,
    showKey,
    $label,
    $labels,
    loadTranslations,
  }

  if (app) {
    app.provide(i36nSymbol, i36n)
  } else {
    provide(i36nSymbol, i36n)
  }
}

const useI36n = function () {
  return inject(i36nSymbol)
}

export { useI36n, provideI36n }
