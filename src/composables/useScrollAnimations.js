import { onMounted, onUnmounted, nextTick } from 'vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

export function useScrollAnimations() {
  let triggers = []

  const initAnimations = () => {
    // 1. Page hero animations
    const heroElements = document.querySelectorAll('[data-animate="hero"]')
    if (heroElements.length > 0) {
      const heroAnim = gsap.from(heroElements, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.08
      })
      triggers.push(heroAnim)
    }

    // 2. Section headers
    const headers = document.querySelectorAll('[data-animate="section-header"]')
    headers.forEach(header => {
      const headerAnim = gsap.from(header, {
        x: -20,
        opacity: 0,
        duration: 0.6,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })
      triggers.push(headerAnim)
    })

    // 3. Card grids
    const cardGrids = document.querySelectorAll('[data-animate="card-grid"]')
    cardGrids.forEach(grid => {
      const gridAnim = gsap.from(grid.children, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: grid,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })
      triggers.push(gridAnim)
    })

    // 4. Count-up animations for stats
    const countUps = document.querySelectorAll('[data-animate="count-up"]')
    countUps.forEach(el => {
      const targetVal = parseInt(el.getAttribute('data-target') || '0')
      const obj = { val: 0 }
      
      const countAnim = gsap.to(obj, {
        val: targetVal,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
        onUpdate: () => {
          el.innerText = Math.floor(obj.val)
        },
        onComplete: () => {
          el.innerText = targetVal
        }
      })
      triggers.push(countAnim)
    })
  }

  onMounted(() => {
    nextTick(() => {
      // Register GSAP ScrollTrigger plugin
      gsap.registerPlugin(ScrollTrigger)
      initAnimations()
    })
  })

  onUnmounted(() => {
    // Kill all scroll triggers created in this lifecycle
    triggers.forEach(t => {
      if (t.scrollTrigger) {
        t.scrollTrigger.kill()
      }
      t.kill()
    })
    triggers = []
  })
}
