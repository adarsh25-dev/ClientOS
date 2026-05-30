<template>
  <div class="dark bg-background text-on-surface antialiased overflow-x-clip min-h-screen flex flex-col relative">

    <LandingTopNav />
    <LandingHero />
    <LandingFeatures />
    <LandingTestimonials />
    <LandingFooter />
  </div>
</template>

<script setup>
import LandingTopNav from '../../components/landing/LandingTopNav.vue'
import LandingHero from '../../components/landing/LandingHero.vue'
import LandingFeatures from '../../components/landing/LandingFeatures.vue'
import LandingTestimonials from '../../components/landing/LandingTestimonials.vue'
import LandingFooter from '../../components/landing/LandingFooter.vue'
</script>


