import ModalComponent from './Modal.html'

const getPrototypeKeys = object => Object.getOwnPropertyNames(Object.getPrototypeOf(object))
const uncontextify = object => {
  getPrototypeKeys(object).forEach(key => object[key] = object[key].bind(object))
  return object
}

const Modal = function (options = {}) {
  options = Object.assign(
    { persist: false },
    options,
    { initialState: ModalComponent.STATES.hidden }
  )

  const contentElement = document.createElement('div')
  const modal = new ModalComponent({
    data: options,
    target: document.body,
    slots: {
      default: contentElement
    }
  })

  const { on, open, close, dismiss, destroy }  = uncontextify(modal)
  const publicModal = { on, open, close, dismiss, destroy }

  options.content(contentElement, publicModal)

  // TODO: destroy() is bugged in svelte with certain slot situations
  //   temporarily wrapped in try catch to suppress error msg
  const suppressedDestroy = () => { try { return destroy() } catch (err) {} }
  publicModal.destroy = suppressedDestroy

  if (!options.persist) {
    modal.on('hidden', publicModal.destroy)
  }

  return publicModal
}

export default Modal
