<script setup lang="ts">
import { provide, ref } from 'vue';
import { ImportService, ImportServiceKey } from './import.service';

const isOnline = ref<undefined | boolean>(undefined)

async function checkOnlineStatus() {
  const res = await fetch(`/api/status`)
  if (res.status === 200 && (await res.json()).status === 'online') {
    isOnline.value = true
  } else {
    isOnline.value = false
  }
}

checkOnlineStatus()

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
  <div class="router-outlet" v-if="isOnline === true">
    <router-view></router-view>
  </div>
  <div v-else-if="isOnline === false">
    <h2 aria-busy="true">Connectiong to server...</h2>
  </div>
  <div v-else>
    <h2>The server is unreachable!</h2>
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
    padding: 0 1rem;
  }
}


</style>
