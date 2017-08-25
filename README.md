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
  transitionDuration: 200, // duration of transition in and out
  clickToDismiss: true, // click outside to dismiss the modal
  escapeToDismiss: true, // press escape key to dismiss the modal
  content // the root node of modal content
)

modal.on('closed', result => {
  result // result that was passed to `modal.close`
})

modal.on('dismissed', result => {
  result // result that was passed to `modal.dismissed`
})

modal.open()

modal.close('foo')
// or
modal.dismiss('bar')
```
