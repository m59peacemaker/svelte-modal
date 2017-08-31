# svelte-modal

A vanilla JS basic popup modal made with Svelte. Use this as the base component for making nice, useful modals, like [svelte-dialog](https://github.com/m59peacemaker/svelte-dialog).

[View the demo.](https://m59peacemaker.github.io/svelte-modal/)

## install

```sh
$ npm install svelte-modal
```

## TODO

- Stop depending on a fork of svelta-extras
  - https://github.com/sveltejs/svelte-extras/pull/6
- This README is missing a lot of stuff. For now, just look at the [demo code](https://github.com/m59peacemaker/svelte-modal/tree/master/docs/src) and the [component source code](https://github.com/m59peacemaker/svelte-modal/blob/master/src/Modal.html).

## example

```js
import Modal from 'svelte-modal'

const content = document.createElement('p')
content.textContent = 'Modal content.'

const modal = new Modal({
  center: false, // false => aligned to top, true => aligned to center
  zIndexBase: 1, // adjust the relative z-index of the modal
  transitionDuration: 225, // duration of transition in and out
  pressScrimToDismiss: true, // press outside the modal to dismiss it
  escapeToDismiss: true, // press escape key to dismiss the modal
  slots: { default: content }
})

modal.on('result', result => {
  result // result of either modal.close or modal.dismiss
})

modal.on('closed', result => {
  result // result that was passed to `modal.close`
})

modal.on('dismissed', result => {
  result // result that was passed to `modal.dismissed`
})

modal.on('hidden', () => {}) // fires when the modal has finished transitioning out

modal.open()

modal.close('foo')
// or
modal.dismiss('bar')
```
