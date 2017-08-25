# svelte-modal

A vanilla JS basic popup modal made with Svelte.

[View the demo.](https://m59peacemaker.github.io/svelte-modal/)

## install

```sh
$ npm install svelte-modal
```

## example

```js
import { Modal } from 'svelte-modal'

const content = document.createElement('p')
content.textContent = 'Modal content.'

const modal = new Modal(
  open: false, // initially closed
  center: false, // false => aligned to top, true => aligned to center
  zIndexBase: 1, // adjust the relative z-index of the modal
  clickDismiss: true, // click outside to dismiss the modal
  escapeDismiss: true, // press escape key to dismiss the modal
  transitionDuration: 200, // duration of transition in and out
  content // the root node of modal content
)

modal.open().then(({ event, data }) => {
  event // => 'close' 'dismissed'
  data // => data that was passed to `modal.close` or `modal.dismiss`
})

modal.close('foo')
modal.dismiss('bar')
```
