declare function $label(key: string, params: object, lang: string, markdown: boolean): string;

export type I36nConfig = {
  load: Function
  showKey?: boolean
}

export type I36nUseObject = {
  language: string
  showKey: boolean
  $label: Function
}


declare function provideI36n(lang: string, config: I36nConfig, app: any): void;
declare function useI36n(): I36nUseObject;

export {
  provideI36n,
  useI36n,
}
