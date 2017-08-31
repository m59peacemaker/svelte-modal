# svelte-modal

A vanilla JS basic popup modal made with Svelte.

[View the demo.](https://m59peacemaker.github.io/svelte-modal/)

## install

```sh
$ npm install svelte-modal
```

## TODO

Stop depending on a fork of svelta-extras, via the acceptance of my PR or some other solution
This README is missing a lot of stuff
Figure out how to expose the vanilla js service AND vanilla JS component AND svelte component

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
  content: (slot, modal) => {} // function that receives an element `slot` and the modal instance and should add modal content to the element
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
