import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../project/project.store'
import type { CompositionElement } from '../project/project.types'
import styles from './stage.module.css'

interface DragState {
  id: string
  mode: 'move' | 'resize' | 'rotate'
  startX: number
  startY: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

/**
 * Handles de manipulação direta sobre o Stage. O desenho real (e a gravação)
 * continuam no WebGL; este overlay só converte gestos em configuração.
 *
 * Durante o arraste, os eventos de ponteiro são propagados via rAF para não
 * inundar o Zustand/React a cada sub-pixél. Como a CompositionLayer agora
 * atualiza os itens in place, cada atualização é barata em vez de reconstruir
 * a composição inteira.
 */
export function CompositionOverlay(): JSX.Element {
  const elements = useProjectStore((s) => s.config.elements)
  const selectedId = useProjectStore((s) => s.selectedElementId)
  const selectElement = useProjectStore((s) => s.selectElement)
  const updateElement = useProjectStore((s) => s.updateElement)
  const removeElement = useProjectStore((s) => s.removeElement)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pendingRef = useRef<{
    id: string
    patch: Partial<CompositionElement>
  } | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) return
      const element = useProjectStore.getState().config.elements.find((item) => item.id === selectedId)
      if (!element) return
      if (event.key === 'Escape') {
        selectElement(null)
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !element.locked) {
        event.preventDefault()
        removeElement(element.id)
        return
      }
      const step = event.shiftKey ? 3 : 1
      const delta: Partial<CompositionElement> =
        event.key === 'ArrowLeft'
          ? { x: element.x - step }
          : event.key === 'ArrowRight'
            ? { x: element.x + step }
            : event.key === 'ArrowUp'
              ? { y: element.y - step }
              : event.key === 'ArrowDown'
                ? { y: element.y + step }
                : {}
      if (Object.keys(delta).length && !element.locked) {
        event.preventDefault()
        updateElement(element.id, delta)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, selectElement, updateElement, removeElement])

  const flushPending = useCallback((): void => {
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = null
    rafRef.current = null
    updateElement(pending.id, pending.patch)
  }, [updateElement])

  const scheduleFlush = useCallback((): void => {
    pendingRef.current ??= null
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(flushPending)
  }, [flushPending])

  const beginDrag = (
    event: React.PointerEvent<HTMLElement>,
    element: CompositionElement,
    mode: DragState['mode'],
  ): void => {
    if (element.locked) return
    event.preventDefault()
    event.stopPropagation()
    selectElement(element.id)
    dragRef.current = {
      id: element.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: React.PointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    const overlay = overlayRef.current
    if (!drag || !overlay) return
    const rect = overlay.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    const scaleX = 100 / rect.width
    const scaleY = 100 / rect.height
    let patch: Partial<CompositionElement>
    if (drag.mode === 'move') {
      patch = {
        x: drag.x + dx * scaleX,
        y: drag.y + dy * scaleY,
      }
    } else if (drag.mode === 'resize') {
      patch = {
        width: Math.max(2, drag.width + dx * scaleX),
        height: Math.max(1, drag.height + dy * scaleY),
      }
    } else {
      patch = { rotation: drag.rotation + dx * 0.5 }
    }
    pendingRef.current = { id: drag.id, patch }
    scheduleFlush()
  }

  const endDrag = (): void => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const pending = pendingRef.current
    pendingRef.current = null
    if (pending) updateElement(pending.id, pending.patch)
    dragRef.current = null
  }

  // Garante que um rAF pendente não fique órfão se o overlay desmontar.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  if (!elements.length) return <div ref={overlayRef} className={styles.compositionOverlay} aria-hidden="true" />

  return (
    <div ref={overlayRef} className={styles.compositionOverlay} aria-label="Camadas editáveis do Stage">
      {elements.map((element, index) =>
        !element.visible ? null : (
          <div
            key={element.id}
            className={`${styles.elementBox} ${selectedId === element.id ? styles.elementBoxSelected : ''} ${element.locked ? styles.elementBoxLocked : ''}`}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.width}%`,
              height: `${element.height}%`,
              transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
              zIndex: index + 1,
            }}
            role="button"
            tabIndex={0}
            aria-label={`${element.name}${element.locked ? ' (bloqueado)' : ''}`}
            aria-pressed={selectedId === element.id}
            onPointerDown={(event) => beginDrag(event, element, 'move')}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onFocus={() => selectElement(element.id)}
          >
            {selectedId === element.id ? <span className={styles.elementLabel}>{element.name}</span> : null}
            {selectedId === element.id && !element.locked ? (
              <>
                <button
                  type="button"
                  className={styles.rotateHandle}
                  aria-label="Rotacionar elemento"
                  onPointerDown={(event) => beginDrag(event, element, 'rotate')}
                />
                <button
                  type="button"
                  className={styles.resizeHandle}
                  aria-label="Redimensionar elemento"
                  onPointerDown={(event) => beginDrag(event, element, 'resize')}
                />
              </>
            ) : null}
          </div>
        ),
      )}
    </div>
  )
}
