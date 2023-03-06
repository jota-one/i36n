import test from 'ava'
import {getI36n, initI36n} from "./src/index.js";

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
    bar: "J'aime encore plus {tool}!"
  },
  baz: [
    'Mais il y a plus:',
    'Connaissez-vous {cms}?',
    'Au faut, vous ai-je dit que {foo}?'
  ]
}
const load = ln => Promise.resolve(translations[ln])

test.before(() => {
  initI36n('en', {
    load
  })
})
test('read a translated string', t => {
  const { $label } = getI36n()
  t.is($label.value('foo'), translations.en.foo)
})

test('read a translated string with param', t => {
  const { $label } = getI36n()
  t.is($label.value('bar', { tool: 'drosse'}), 'I like drosse even more!')
})

test('changing language should dynamically load translations', async t => {
  const { $label, setLanguage } = getI36n()
  t.is($label.value('foo'), translations.en.foo)
  await setLanguage('fr')
  t.is($label.value('foo'), translations.fr.foo)
})

test('read a list of translations + use existing translation keys inside another one', t => {
  const { $labels } = getI36n()
  t.deepEqual($labels.value('baz'), [
    'But there is more:',
    'Do you know {cms}?',
    `Btw, did I tell you that ${translations.en.foo}?`
  ])
})

test('showKey flag allows to see keys instead of translated strings', t => {
  const { $label, showKey } = getI36n()
  showKey.value = true
  t.is($label.value('foo'), `{foo}`)
  showKey.value = false
})
