import { ref, reactive, watch, computed, provide, inject } from '@vue/composition-api'
import md from 'snarkdown'
import { replace, extractPlaceholders } from '@jota-one/replacer'

const i36nSymbol = Symbol()

const provideI36n = function (language, { load }) {
  const loaded = ref(0)
  const labels = reactive({})
  const currentLanguage = ref(language)
  const showKey = ref(false)

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

  const _format = (value, params, source) => {
    if (Array.isArray(value)) {
      return value.map(v => md(replace(v, params, source)))
    }
    return md(replace(value, params, source))
  }

  const $label = computed(() => {
    if (loaded.value === 0) {
      return () => ' '
    }

    const langLabels = labels[currentLanguage.value]

    if (showKey.value) {
      return key => _key(currentLanguage.value, key)
    }

    return langLabels
      ? (key, params) => _format(langLabels[key], params, langLabels) || `{${key}}`
      : () => ' '
  })

  let _switching = false
  watch(() => currentLanguage.value, async ln => {
    if (ln && !_switching) {
      _switching = true

      if (!labels[ln]) {
        labels[ln] = await load(ln)
        loaded.value += 1
      }

      _switching = false
    }
  }, { immediate: true })

  const i36n = {
    language: currentLanguage,
    showKey,
    $label
  }

  provide(i36nSymbol, i36n)
}

const useI36n = function () {
  return inject(i36nSymbol)
}

export { useI36n, provideI36n }
