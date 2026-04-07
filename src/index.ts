import { ref, reactive, watch, provide, inject, type Ref, type App } from 'vue'
import md from 'snarkdown'
import { replace, extractPlaceholders } from '@jota-one/replacer'

// Types
type LabelsObject = Record<string, string | string[]>

export type LabelFuncPayload = {
  key: string
  params?: Record<string, string | number | undefined | null> | null
  lang?: string | null
  markdown?: boolean
}

export type LabelFunc = (
  keyOrArgsObj: string | LabelFuncPayload,
  params?: Record<string, string | number | undefined | null> | null,
  lang?: string | null,
  markdown?: boolean
) => string

export type LabelsFunc = (
  key: string,
  params?: Record<string, string | number | undefined | null> | null,
  lang?: string | null,
  markdown?: boolean
) => string[]

export type I36nConfig = {
  load(ln: string): Promise<LabelsObject>
  showKey?: Ref<boolean>
}

export type I36nInstance = {
  language: Ref<string>
  showKey: Ref<boolean>
  t: LabelFunc
  tList: LabelsFunc
  setLanguage(ln: string): Promise<boolean>
  loadTranslations(ln: string): Promise<void>
}

// Module-level singleton & symbol
const i36nSymbol = Symbol()
const i36n = {} as I36nInstance

export const getI36n = (): I36nInstance => i36n

export const initI36n = (language: string, { load, showKey = ref(false) }: I36nConfig): void => {
  const loaded = ref(0)
  const labels = reactive<Record<string, LabelsObject>>({})
  const currentLanguage = ref(language)

  const _key = (lang: string, key: string): string | string[] => {
    if (!labels[lang]) {
      return `{${key}}`
    }
    if (Array.isArray(labels[lang][key])) {
      return (labels[lang][key] as string[]).map((item, index) => {
        const placeholders = extractPlaceholders(item)
        const plh = placeholders.length > 0 ? ', [' + placeholders.join(',') + ']' : ''
        return `{${key}[${index}]${plh}}`
      })
    }
    const placeholders = extractPlaceholders(labels[lang][key] as string)
    const plh = placeholders.length > 0 ? ', [' + placeholders.join(',') + ']' : ''
    return `{${key}${plh}}`
  }

  const _format = (
    value: string | string[],
    params: Record<string, unknown> | null | undefined,
    source: LabelsObject,
    markdown = true
  ): string | string[] => {
    const mdFn = markdown ? md : (a: string) => a
    if (Array.isArray(value)) {
      return value.map(v => mdFn(replace(v, params, source)))
    }
    return mdFn(replace(value, params, source))
  }

  const t: LabelFunc = (keyOrArgsObj, _params?, _lang = null, _markdown = true) => {
    if (loaded.value === 0) return ' '

    if (showKey.value) {
      const key = typeof keyOrArgsObj === 'object' ? keyOrArgsObj.key : keyOrArgsObj
      return _key(currentLanguage.value, key) as string
    }

    const langLabels = labels[currentLanguage.value]
    if (!langLabels) return ' '

    const isObjectArgMode = typeof keyOrArgsObj === 'object' && !(keyOrArgsObj instanceof Array)
    const key = isObjectArgMode ? (keyOrArgsObj as LabelFuncPayload).key : (keyOrArgsObj as string)
    const params = isObjectArgMode ? (keyOrArgsObj as LabelFuncPayload).params : _params
    const lang = isObjectArgMode ? ((keyOrArgsObj as LabelFuncPayload).lang ?? null) : _lang
    const markdown = isObjectArgMode ? ((keyOrArgsObj as LabelFuncPayload).markdown ?? true) : _markdown

    const refLabels = lang ? labels[lang] : langLabels
    return _format(refLabels[key], params, refLabels, markdown) as string || `{${key}}`
  }

  const tList: LabelsFunc = (key, _params?, _lang = null, _markdown = true) => {
    if (loaded.value === 0) return []

    if (showKey.value) {
      return _key(currentLanguage.value, key) as string[]
    }

    const langLabels = labels[currentLanguage.value]
    if (!langLabels) return []

    const refLabels = _lang ? labels[_lang] : langLabels
    return _format(refLabels[key], _params, refLabels, _markdown) as string[] || []
  }

  const loadTranslations = async (ln: string): Promise<void> => {
    labels[ln] = await load(ln)
    loaded.value += 1
  }

  let _switching = false
  const setLanguage = async (ln: string): Promise<boolean> => {
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

  watch(currentLanguage, setLanguage, { immediate: true })

  i36n.language = currentLanguage
  i36n.showKey = showKey
  i36n.t = t
  i36n.tList = tList
  i36n.setLanguage = setLanguage
  i36n.loadTranslations = loadTranslations
}

export const provideI36n = (language: string, config: I36nConfig, app?: App): void => {
  initI36n(language, config)
  if (app) {
    app.provide(i36nSymbol, i36n)
  } else {
    provide(i36nSymbol, i36n)
  }
}

export const useI36n = (): I36nInstance => inject(i36nSymbol) as I36nInstance
