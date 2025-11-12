export type PluginEnterFrom = 'main' | 'panel' | 'hotkey' | 'redirect'

export interface PluginEnterAction<TPayload = unknown, TOption = unknown> {
  code: string
  type: string
  payload: TPayload
  option: TOption
  from?: PluginEnterFrom
}

