import Fuse from 'fuse.js'
import { IOptions } from './models/options'
import { ISearchResult } from './models/search-result'
import { append, remove } from './components/notification'
import EventEmitter from 'event-emitter-es6'

// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

function fuzzyMatch(search: string, results: Array<any>, matchKey?: string) {
  const options: any = {
    shouldSort: true,
    includeScore: true
  }
  if (matchKey) {
    options.keys = [matchKey]
  }

  const fuse = new Fuse(results, options)
  const fuzzyMatches: Array<any> = fuse.search(search)
  const exact =
    fuzzyMatches.find(m => m.score < 0.1) || (fuzzyMatches.length === 1 && fuzzyMatches[0])
  const singleFuzzyMatch = fuzzyMatches.length === 1 && fuzzyMatches[0]

  if (exact || singleFuzzyMatch) {
    return {
      exactMatch: exact.item || singleFuzzyMatch.item
    }
  }

  return {
    closeMatches: fuzzyMatches.length && fuzzyMatches.map(m => m.item)
  }
}

export default class MultiSearch extends EventEmitter {
  _options: IOptions
  _input: HTMLInputElement
  _focusFn = this._focus.bind(this)
  _blurFn = () => setTimeout(this._blur.bind(this))
  _keyPressFn = this._keyPress.bind(this)
  _recognition?: SpeechRecognition
  _alreadySearched: string[] = []

  searchItems: string[] = []
  exact: any[] = []
  close: any[] = []
  none: any[] = []

  set searching(value: boolean) {
    this.emit('searching', value)
  }

  set onSearching(listener: (...args: any[]) => void) {
    this.on('searching', listener)
  }

  set onSearched(listener: (...args: any[]) => void) {
    this.on('searched', listener)
  }

  constructor(input: HTMLInputElement, options: IOptions) {
    super()
    this._options = options
    this._input = input

    if (this._isRecEnabled()) {
      input.addEventListener('focus', this._focusFn)

      // set timeout to first call disable
      input.addEventListener('blur', this._blurFn)
    }

    input.addEventListener('keyup', this._keyPressFn)
  }

  _isRecEnabled() {
    // check if not disabled and speech _recognition available
    return (
      !window.sessionStorage.getItem('ARLY_DISABLE_REC') &&
      (window.SpeechRecognition || window.hasOwnProperty('webkitSpeechRecognition'))
    )
  }

  _focus() {
    const notification = append()
    this._record()
    notification.then(nr => nr.disable.then(this._disableRec.bind(this)))
  }

  _blur() {
    remove()
    this._recognition && this._recognition.stop()
  }

  _keyPress(event: any) {
    if (event.keyCode === 13) {
      this.search()
    } else {
      const value = event.target.value as string
      if (value) {
        this.searchItems = value.split(',').map(i => i.trim())
      }
    }
  }

  _record() {
    const SpeechRecognition =
      window.SpeechRecognition || ((window as any).webkitSpeechRecognition as SpeechRecognition)
    this._recognition = new SpeechRecognition()
    if (this._options.recLanguage) {
      this._recognition.lang = this._options.recLanguage
    }
    this._recognition.onresult = event => {
      const item = event.results
        .item(event.results.length - 1)[0]
        .transcript.trim()
        .replace(/\s/g, ', ')
      this.searchItems = item.split(',').map(i => i.trim())
      this._input.value = this._input.value ? `${this._input.value}, ${item}` : item
      this._input.blur()
      this.search()
    }

    this._recognition.start()
  }

  _disableRec() {
    window.sessionStorage.setItem('ARLY_DISABLE_REC', 'true')
    this._input.removeEventListener('focus', this._focusFn)
    this._input.removeEventListener('blur', this._blurFn)
    setTimeout(() => {
      this._input.focus()
    }, 500)
  }

  public search(): Promise<ISearchResult> {
    if (!this.searchItems.length) {
      return Promise.resolve({ exact: [], close: [], none: [] })
    }

    return new Promise(async resolve => {
      const { formatterFn, searchFn, valueKey } = this._options
      let { value } = this._input

      this.searching = true
      if (formatterFn) {
        try {
          value = await formatterFn(value)
        } catch (e) {
          console.warn('formatter failed with ', e)
        }
      }

      const values = value
        .split(',')
        .map(v => v.trim())
        .filter(v => !this._alreadySearched.includes(v))
      for (let i = 0; i < values.length; i++) {
        const search = values[i]
        const original = this.searchItems[i]
        const results = await searchFn(search)
        const { exactMatch, closeMatches } = fuzzyMatch(search, results, valueKey)

        if (exactMatch) {
          this.exact.push({
            search,
            original,
            result: exactMatch
          })
        } else if (closeMatches) {
          this.close.push({
            search,
            original,
            results: closeMatches
          })
        } else {
          this.none.push({
            search,
            original,
            results
          })
        }
      }

      this._alreadySearched = this._alreadySearched.concat(values)
      this.searching = false

      const { exact, close, none } = this
      this.emit('searched', { exact, close, none })
      resolve({ exact, close, none })
    })
  }

  public destroy() {
    this._input.removeEventListener('keypress', this._keyPressFn)
  }
}
