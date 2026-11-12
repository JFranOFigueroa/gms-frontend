<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import landingBackground from '@/assets/global-landing-background.png'

const auth = useAuthStore()
const loginDestination = computed(() => auth.isAuthenticated ? '/dashboard' : '/auth/login')
const imageStyle = { backgroundImage: `url(${landingBackground})` }
</script>

<template>
  <!-- Página de toda la plataforma. No depende del gimnasio o del constructor privado. -->
  <div class="global-landing">
    <main class="global-scene" :style="imageStyle">
      <header class="global-header">
        <RouterLink class="global-logo" to="/" aria-label="GMS - Inicio">Gym</RouterLink>
        <nav class="global-navigation" aria-label="Accesos principales">
          <RouterLink class="global-nav-button" to="/checkin">Check-in</RouterLink>
          <RouterLink class="global-nav-button global-nav-primary" to="/guest-access">Clase muestra</RouterLink>
          <RouterLink class="global-nav-button" :to="loginDestination">
            {{ auth.isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión' }}
          </RouterLink>
        </nav>
      </header>

      <section class="global-intro" aria-label="Bienvenido a Gym">
        <h1>Tu energía.<br />Tu gimnasio.</h1>
        <p>Cada entrenamiento es un paso más. Mantente<br class="global-desktop-break" /> conectado con tu gimnasio y vive tu progreso.</p>
        <!-- Se conserva el botón de la referencia, sin navegación por el momento. -->
        <button class="global-explore" type="button">Explorar gimnasios</button>
        <div class="global-owner-message">
          ¿Administras un gimnasio?
          <span class="global-owner-link">Descubre nuestra plataforma</span>
        </div>
      </section>

      <div class="global-feature-captions" aria-label="Funcionalidades destacadas">
        <span>Entrenamiento</span>
        <span>Check-in rápido</span>
        <span>Tus rutinas</span>
      </div>
    </main>

    <div class="global-mobile-features" aria-label="Funcionalidades destacadas">
      <div class="global-mobile-feature first" :style="imageStyle">Entrenamiento</div>
      <div class="global-mobile-feature second" :style="imageStyle">Check-in rápido</div>
      <div class="global-mobile-feature third" :style="imageStyle">Tus rutinas</div>
    </div>
  </div>
</template>

<style scoped>
.global-landing {
  min-height: 100dvh;
  background: #05070a;
  color: #fff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.global-scene {
  position: relative;
  width: 100%;
  min-height: min(100svh, 56.28vw);
  aspect-ratio: 1672 / 941;
  background-position: center top;
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
.global-header {
  position: absolute;
  left: 3%;
  right: 2%;
  top: 2.3%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}
.global-logo {
  color: #fff;
  font-size: clamp(28px, 2.95vw, 50px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.05em;
  text-decoration: none;
}
.global-navigation {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.4vw, 24px);
}
.global-nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(90px, 8vw, 145px);
  height: clamp(34px, 2.5vw, 44px);
  padding: 0 18px;
  border: 2px solid #fff;
  border-radius: 999px;
  color: #fff;
  font-size: clamp(12px, 1.08vw, 18px);
  font-weight: 700;
  line-height: 1;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
}
.global-nav-primary {
  background: #0758f8;
  border-color: #0758f8;
  min-width: clamp(122px, 11vw, 185px);
}
.global-nav-button:hover, .global-nav-button:focus-visible {
  box-shadow: 0 0 0 3px #ffffff6b;
}
.global-intro {
  position: absolute;
  left: 3.45%;
  top: 14.2%;
  max-width: 47%;
}
.global-intro h1 {
  margin: 0;
  font-size: clamp(46px, 5.45vw, 96px);
  font-weight: 900;
  letter-spacing: -.052em;
  line-height: .99;
  text-shadow: 0 2px 10px #0005;
}
.global-intro p {
  margin: clamp(12px, 1.4vw, 24px) 0 0;
  font-size: clamp(16px, 1.47vw, 26px);
  font-weight: 400;
  line-height: 1.38;
}
.global-explore {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: clamp(20px, 1.9vw, 33px);
  min-height: clamp(48px, 3.94vw, 67px);
  padding: 0 clamp(20px, 2.35vw, 40px);
  border: 0;
  border-radius: 100px;
  color: white;
  background: #0758fa;
  font-size: clamp(16px, 1.45vw, 25px);
  font-weight: 700;
  white-space: nowrap;
  cursor: default;
}
.global-owner-message {
  margin-top: clamp(32px, 3.7vw, 63px);
  font-size: clamp(12px, 1.04vw, 18px);
  white-space: nowrap;
}
.global-owner-link {
  color: #45dbe8;
  text-decoration: underline;
  font-weight: 700;
}
.global-feature-captions {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: end;
  left: 0;
  right: 0;
  bottom: 1.8%;
  pointer-events: none;
}
.global-feature-captions span {
  padding-left: 6%;
  font-size: clamp(18px, 1.75vw, 31px);
  font-weight: 800;
  letter-spacing: -.025em;
  text-shadow: 0 2px 12px #000;
}
.global-mobile-features { display: none; }

@media (max-width: 900px) {
  .global-scene {
    height: min(760px, 100svh);
    min-height: min(640px, 100svh);
    aspect-ratio: auto;
    background-size: cover;
    background-position: 56% center;
  }
  .global-scene::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #020b1edb, #020b1e5c 80%);
  }
  .global-header { top: 24px; left: 5%; right: 5%; align-items: center; flex-wrap: wrap; }
  .global-navigation { gap: 8px; }
  .global-nav-button { min-width: auto; padding: 0 12px; }
  .global-intro { top: 27%; left: 5%; right: 5%; max-width: 610px; }
  .global-intro h1 { font-size: clamp(44px, 8vw, 74px); }
  .global-intro p { font-size: clamp(16px, 2.7vw, 22px); }
  .global-owner-message { white-space: normal; }
  .global-feature-captions { display: none; }
  .global-mobile-features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .global-mobile-feature {
    display: flex;
    min-height: 170px;
    align-items: flex-end;
    padding: 14px;
    border: 1px solid white;
    font-weight: 800;
    background-size: 300% auto;
    background-repeat: no-repeat;
    text-shadow: 0 2px 10px #000;
  }
  .global-mobile-feature.first { background-position: left bottom; }
  .global-mobile-feature.second { background-position: center bottom; }
  .global-mobile-feature.third { background-position: right bottom; }
}
@media (max-width: 550px) {
  .global-header { align-items: flex-start; }
  .global-navigation { width: 100%; justify-content: space-between; }
  .global-nav-button { min-width: 0; height: 38px; padding: 0 7px; font-size: 10px; }
  .global-intro { top: 30%; }
  .global-intro h1 { font-size: clamp(34px, 10vw, 60px); }
  .global-desktop-break { display: none; }
  .global-mobile-features { grid-template-columns: 1fr; }
  .global-mobile-feature { min-height: 220px; background-size: 300% auto; font-size: 24px; }
}
</style>
