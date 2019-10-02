# Fancy Search

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A lib to improve your apps search functionality by adding the opt-outable speech recognition, multiple parallel searches and automatic result matching.
Have a look at following example or try it at [https://munchlab.de](munchlab.de)

![](munchlab.gif)

## Speech recognition

The Fancy Search gives the user the option to search via speech. The speech recognition gets turned on after clicking into the input field and turned off on blur. It allows the user to search one or multiple values. After a speech input (one or multiple words) the search will get triggered automatically. By default the speech recognitions language is the users browser language. If the html `lang` attribute is set, it uses this value.

When the speech input starts, a notification is shown which hidees automatically. The user can also disable the speech recognition by clicking on `Disable`. Or you set `ARLY_DISABLE_REC` to `true` to disable it completely.

## Multi Search

It allows the user to search multiple values at once by seperating those via comma. When typing them with the keyboard, the search gets triggered on enter or from the outside. Each word will be searched with the given search function in parallel. Only new entries will be searched.

## Automatic Result Matching

The results of each search will be compared with the search and the best matching will be choosen as exact match if it matches over 90% of the search. Otherwise those results which match over 50% will me returned as close  matches. If both cases fail, all results will be returned as none matches.

## Usage

Pass a html input element and some options to the search class to create an instance. 

```
import FancySearch from '@aurally/fancy-search';

fancySearch = new FancySearch(searchInput, {
  searchFn: search => fetch(`ingredients.json?search=${search}`).then(r => r.json()),
  formatterFn: searches => fetch(`translate.json?text=${searches}&to=en`).then(r => r.text()),
  valueKey: 'name'
});
fancySearch.onSearched = ({exact, close, none}) => {
  allSelectedIngredients = [...allSelectedIngredients, ...exact.map(m => m.result)]
  closeMatches = close
}
fancySearch.onSearching = isSearching => {
  searching = isSearching
}
```

## Options

- `searchFn` *MANDATORY* will be called with the search word as argument, must return an `any[]` or `string[]`
- `valueKey` *MANDATORY* if searchFn does not return `string[]`
- `formatterFn` formats all search values before searching them. For exxample to translate them.
- `recLanguage` set the speech recognition language