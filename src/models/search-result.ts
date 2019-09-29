export interface ISearchResult {
  exact?: {
    search: string
    original: string
    result: any
  }[]
  close?: {
    search: string
    original: string
    results: any[]
  }[]
  none?: {
    search: string
    original: string
    results: any[]
  }[]
}
