import ModalComponent from './Modal.html'

const Modal = function (options = {}) {
  const modal = new ModalComponent({
    data: options,
    target: document.body
  })
  const open = modal.open
  modal.open = (...args) => { // hack so that the element transitions in as it should
    setTimeout(() => open.apply(modal, args))
    return modal
  }
  return modal
}

export default Modal
