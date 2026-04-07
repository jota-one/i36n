import { beforeAll, it, expect } from 'vitest'
import { getI36n, initI36n } from './index.js'

const translations = {
  en: {
    foo: 'I like i36n very much',
    bar: 'I like {tool} even more!',
    baz: [
      'But there is more:',
      'Do you know {cms}?',
      'Btw, did I tell you that {foo}?'
    ]
  },
  fr: {
    foo: "J'aime beaucoup i36n",
    bar: "J'aime encore plus {tool}!",
    baz: [
      'Mais il y a plus:',
      'Connaissez-vous {cms}?',
      'Au fait, vous ai-je dit que {foo}?'
    ]
  }
}

const load = (ln: string) => Promise.resolve(translations[ln as keyof typeof translations])

beforeAll(() => {
  initI36n('en', { load })
})

it('read a translated string', () => {
  const { t } = getI36n()
  expect(t('foo')).toBe('I like i36n very much')
})

it('read a translated string with param', () => {
  const { t } = getI36n()
  expect(t('bar', { tool: 'hypercontent' })).toBe('I like hypercontent even more!')
})

it('changing language should dynamically load translations', async () => {
  const { t, setLanguage } = getI36n()
  await setLanguage('fr')
  expect(t('foo')).toBe("J'aime beaucoup i36n")
  await setLanguage('en')
})

it('read a list of translations + use existing translation keys inside another one', () => {
  const { tList } = getI36n()
  expect(tList('baz', { cms: 'hypercontent' })).toEqual([
    'But there is more:',
    'Do you know hypercontent?',
    'Btw, did I tell you that I like i36n very much?'
  ])
})

it('showKey flag allows to see keys instead of translated strings', () => {
  const { t, showKey } = getI36n()
  showKey.value = true
  expect(t('foo')).toBe('{foo}')
  showKey.value = false
})

it('showKey flag allows to see keys and placeholders instead of translated strings', () => {
  const { t, showKey } = getI36n()
  showKey.value = true
  expect(t('bar')).toBe('{bar, [tool]}')
  showKey.value = false
})

it('ignore unused placeholders', () => {
  const { t } = getI36n()
  expect(t('bar', { tool: 'hypercontent', unused: 'nope' })).toBe('I like hypercontent even more!')
})
