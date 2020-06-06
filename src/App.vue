<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="primary">
      <b-navbar-brand :to="{ name: 'home' }" class="d-flex align-items-center">
        <img src="img/gridscore.svg" height="40px" class="d-inline-block align-top mr-3" alt="GridScore">
        GridScore
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item :to="{ name: 'about' }">About</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <b-container fluid class="mt-3">
      <router-view :key="$route.path" />
    </b-container>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="scss">
@import '~bootswatch/dist/sandstone/variables';
@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-vue/src/index.scss';
@import '~bootswatch/dist/sandstone/bootswatch';
</style>
