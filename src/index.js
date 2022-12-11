import * as es from './util'
import {func} from "prop-types";

const defaultOption = {
  background: 'rgb(150,150,150)',
  opacity: 0.5,
  zIndex: 99,
  duration: 700,
  timing: 'ease',
  outDuration: 800,
  touchScrollTimeout: 100
}

const {tag, edit, offset, elementToArray, isSelfTag, styles} = es

// Inject styles into head
tag('style', {
  innerHTML: `.ripleParent__{pointer-events:none;overflow:hidden;background:transparent;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.riple__{border-radius:50%;position: absolute;will-change:transform; pointer-events:none;}@keyframes ripple__{0%{transform: translate(-50%,-50%) scale(0);}100%{transform: translate(-50%,-50%) scale(1);}}`,
  appendTo: document.head,
})

function ripple(elmnt = '_', option = {}) {
  // Configuration
  option = {
    ...defaultOption,
    ...option,
  }
  const {
    background,
    opacity,
    zIndex,
    duration,
    timing,
    height,
    width,
    triggerOnChild = true,
    triggerExcept = '_',
    outDuration,
    touchScrollTimeout
  } = option

  const isTouch = 'ontouchstart' in window;
  const createRippleEvents = isTouch ? 'touchstart' : 'mousedown';
  const removeRippleEvents = isTouch ? 'touchend touchcancel' : 'mouseleave mouseup'

  function createRipple(e) {
    const childExceptions = elementToArray(triggerExcept, this)
    if (childExceptions.indexOf(e.target) > -1) return
    if (e.target !== this && !triggerOnChild) return

    const isStatic = styles(this, 'position').toLowerCase() === 'static'

    if (isStatic) this.style.position = 'relative'

    // Touch Events
    let cy, cx

    const offsetTop = offset(this).top
    const offsetLeft = offset(this).left

    // Check if the event is touch or not
    try {
      if (e.touches[1]) return // multi-touch will not be triggerred
      cx = e.touches[0].pageX - offsetLeft
      cy = e.touches[0].pageY - offsetTop
    } catch {
      cx = e.pageX - offsetLeft
      cy = e.pageY - offsetTop
    }
    // #############

    // Elements to append in
    const {offsetWidth, offsetHeight} = this
    const divParent = tag('div', {
      appendTo: this,
      className: 'ripleParent__',
      style: {
        zIndex,
        height: offsetHeight + 'px',
        width: offsetWidth + 'px',
        borderRadius: styles(this, 'borderRadius'),
        clipPath: styles(this, 'clipPath'),
        transition: `opacity ${outDuration}ms linear`,
      },
    })

    tag('div', {
      appendTo: divParent,
      className: 'riple__',
      style: {
        top: cy + 'px',
        left: cx + 'px',
        opacity,
        width: width || offsetWidth * Math.PI + 'px',
        height: height || offsetWidth * Math.PI + 'px',
        background,
        animation: `ripple__ ${duration}ms ${timing} both`,
      },
    })
    return divParent;
  }

  function removeRipple(divParent) {
    if (divParent) {
      divParent.style.opacity = 0
      setTimeout(() => {
        divParent.remove();
      }, outDuration) // extend the duration to maintain element animation
    }
    edit(this).off(removeRippleEvents, removeRipple)
  }

  // Check if it is Element
  const elements = elementToArray(elmnt)
  // Add the event

  elements.forEach((el) => {
    if (isSelfTag(el))
      return console.error(
        'Ripple is not allowed on self closing tag you need to wrap it',
      )
    let removeDiv = null;
    let touchStartTimeOutId = null;
    let touchEndTimeOutId = null;
    const timeout = isTouch ? touchScrollTimeout : 0;

    edit(el).on("touchmove", function () {
      clearTimeout(touchStartTimeOutId);
      clearTimeout(touchEndTimeOutId);
    })
    edit(el).on(createRippleEvents, function (e) {
      clearTimeout(touchStartTimeOutId);
      if (removeDiv) {
        removeRipple.call(this, removeDiv);
        removeDiv = null;
      }
      touchStartTimeOutId = setTimeout(() => {
        removeDiv = createRipple.call(this, e);
      }, timeout);
    });
    edit(el).on(removeRippleEvents, function (e) {
      e.stopPropagation();
      clearTimeout(touchEndTimeOutId);
      touchEndTimeOutId = setTimeout(() => {
        removeRipple.call(this, removeDiv);
      }, timeout);
    });
  })
  return {
    destroy: () => {
      elements.forEach((el) => edit(el).off(event, createRipple))
    },
  }
}

ripple.utils = es
export default ripple
