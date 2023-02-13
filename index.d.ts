import {ComputedRef, Ref} from "vue";

export type labelFunc = (key: string, params?: Record<string, string | number | undefined | null> | null, lang?: string | null, markdown?: boolean) => string;

export type labelsFunc = (key: string, params?: Record<string, string | number | undefined | null> | null, lang?: string | null, markdown?: boolean) => string[];

export type I36nConfig = {
  load: Function
  showKey: Ref<boolean>
}

export type I36nUseObject = {
  language: Ref<string>
  showKey: Ref<boolean>
  $label: ComputedRef<labelFunc>
  $labels: ComputedRef<labelsFunc>
  loadTranslations: Function
}


export function provideI36n(lang: string, config: I36nConfig, app?: any): void;
export function useI36n(): I36nUseObject;
export function initI36n(lang: string, config: I36nConfig): void;
export function getI36n(): I36nUseObject
