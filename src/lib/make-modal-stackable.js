const activeModals = []

const makeModalStackable = modal => {
  modal.on('opening', () => {
    activeModals.forEach(modal => modal.background())
    modal.foreground()
    activeModals.push(modal)
    const deactivate = () => {
      hiddenListener.cancel()
      destroyListener.cancel()
      activeModals.pop()
      const nextModal = activeModals[activeModals.length - 1]
      // without setTimeout, the esc key event that dismisses a modal will also dismiss the next one
      nextModal && setTimeout(() => nextModal.foreground())
    }
    const hiddenListener = modal.on(modal.constructor.FIRES.hiding, deactivate)
    const destroyListener = modal.on('destroy', deactivate)
  })
}

export default makeModalStackable
