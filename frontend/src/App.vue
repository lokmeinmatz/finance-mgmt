<script setup lang="ts">
import { provide } from 'vue';
import { ImportService, ImportServiceKey } from './import.service';

// dependency injection
provide(ImportServiceKey, new ImportService())
</script>

<template>
  <nav>
    <ul>
      <li>
        <router-link id="logo-wrapper" to="/">
          <div id="logo">Logo here</div>
        </router-link>
      </li>
    </ul>
    <ul>
      <li>
        <router-link to="/import">Import</router-link>
      </li>
      <li>
        <router-link to="/overview">Overview</router-link>
      </li>
    </ul>
  </nav>
  <div class="router-outlet">
    <router-view></router-view>
  </div>
</template>

<style lang="scss">
$primary-hue: 190;
@import "../node_modules/@picocss/pico/scss/pico.scss";

@media only screen and (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    // empty
  }
}

* {
  box-sizing: border-box;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  --primary: #1a2d4b;

  & nav {
    padding: 0.5em;
    display: flex;
    --spacing: 0.3rem;
    & #logo-wrapper {
      padding: 0;
      background-color: #2c3e50;
    }
  }

  & .router-outlet {
    margin: 0 auto;
    max-width: 600px;
    padding: 0 1rem;

    @media screen and (min-width: 1000px) {
      max-width: 800px;
    }
  }
}


</style>
