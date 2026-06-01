// node_modules
import { gsap } from 'gsap';

export const fadeInElement = (element: HTMLElement | null): void => {
  if (!element) {
    return;
  }
  gsap.from(element, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
  });
};

export const slideUpElement = (element: HTMLElement | null): void => {
  if (!element) {
    return;
  }
  gsap.from(element, {
    opacity: 0,
    y: 20,
    duration: 0.4,
    ease: 'power2.out',
  });
};

export const slideDownElement = (element: HTMLElement | null): void => {
  if (!element) {
    return;
  }
  gsap.from(element, {
    opacity: 0,
    y: -20,
    duration: 0.4,
    ease: 'power2.out',
  });
};

export const dropdownEnter = (el: Element, done: () => void): void => {
  gsap.fromTo(
    el,
    { opacity: 0, y: -6, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out', onComplete: done },
  );
};

export const dropdownLeave = (el: Element, done: () => void): void => {
  gsap.to(el, {
    opacity: 0,
    y: -4,
    scale: 0.98,
    duration: 0.15,
    ease: 'power2.in',
    onComplete: done,
  });
};

export const pageEnter = (element: Element, done: () => void): void => {
  gsap.from(element, {
    opacity: 0,
    x: 20,
    duration: 0.3,
    ease: 'power2.out',
    onComplete: done,
  });
};

export const pageLeave = (element: Element, done: () => void): void => {
  gsap.to(element, {
    opacity: 0,
    x: -20,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: done,
  });
};
