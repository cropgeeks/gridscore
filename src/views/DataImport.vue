<template>
  <b-container>
    <h1>{{ $t('pageImportTitle') }}</h1>

    <b-tabs content-class="mt-3">
      <b-tab :title="$t('tabTitleImportUuid')" active>
        <Import :useDatasetUuid="false" />
      </b-tab>
      <b-tab :title="$t('tabTitleImportData')">
        <ImportFlatData />
      </b-tab>
    </b-tabs>
  </b-container>
</template>

<script>
import Import from '@/components/Import'
import ImportFlatData from '@/components/ImportFlatData'

export default {
  components: {
    ImportFlatData,
    Import
  }
}
</script>

<style>

</style>
