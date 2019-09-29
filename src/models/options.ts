export interface IOptions {
  searchFn: (search: string) => Promise<any>
  formatterFn?: (searches: string) => Promise<string>
  valueKey?: string
  recLanguage?: string
}

export const DefaultOptions = {
  valueKey: 'value'
}
