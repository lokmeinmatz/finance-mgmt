<script setup lang="ts">
</script>

<template>
  <div id="app-root">
    <nav class="pure-menu pure-menu-horizontal">
      <div id="logo">Logo here</div>
      <ul class="pure-menu-list">
        <router-link to="/import">Import</router-link>
      </ul>
    </nav>
   <router-view></router-view>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  --primary: #1a2d4b;
  & nav.pure-menu {
    padding: 0.5em;
    background-color: var(--primary);
    display: flex;
    color: white;

    & #logo {
      background-color: #2c3e50;
    }

    & .pure-menu-list {
      margin-left: 1em;
      & a {
        color: white;
      }
    }
  }
}


</style>
