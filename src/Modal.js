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

  if (!options.persist) {
    // TODO: this is bugged...
    modal.on('hidden', publicModal.destroy)
  }

  return publicModal
}

export default Modal
