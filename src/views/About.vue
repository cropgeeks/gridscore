<template>
  <b-container class="pt-3">
    <div class="text-center">
      <img src="img/gridscore.svg" fluid  class="about-header-logo" alt="GridScore logo">
      <h1 class="py-3">{{ $t('appTitle') }}</h1>
    </div>
    <p>{{ $t('pageAboutParagraphOne') }}</p>
    <p v-html="$t('pageAboutParagraphTwo')" />
  </b-container>
</template>

<script>
export default {

}
</script>

<style>
.about-header-logo {
  max-height: 200px;
}
</style>
