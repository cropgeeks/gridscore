<template>
  <b-modal :title="$t('modalTitleSettings')"
           :ok-title="$t('buttonOk')"
           :cancel-title="$t('buttonCancel')"
           size="lg"
           @ok.prevent="onSubmit"
           ref="settingsModal">
    <b-form @submit.prevent="onSubmit" id="settings-form">
      <b-row>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelSettingsRows')" label-for="rows">
            <b-form-input id="rows" :state="state.rows" type="number" min="1" required autofocus v-model="rows" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelSettingsCols')" label-for="cols">
            <b-form-input id="cols" :state="state.cols" type="number" min="1" required v-model="cols" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelSettingsTraits')" label-for="traits">
            <b-form-textarea id="traits" :state="state.traits" rows=6 required v-model="traits" />
            <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="traitsFile" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelSettingsVarieties')" label-for="varieties">
            <b-form-textarea id="varieties" :state="state.varieties" rows=6 required v-model="varieties" />
            <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="varietiesFile" />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
  </b-modal>
</template>

<script>
export default {
  data: function () {
    return {
      rows: 1,
      cols: 1,
      traits: null,
      varieties: null,
      formValidated: false,
      state: {
        rows: null,
        cols: null
      },
      traitsFile: null,
      varietiesFile: null
    }
  },
  watch: {
    traitsFile: function (newValue) {
      if (newValue) {
        this.loadTraitsFile()
      }
    },
    varietiesFile: function (newValue) {
      if (newValue) {
        this.loadVarietiesFile()
      }
    }
  },
  methods: {
    loadTraitsFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.traits = event.target.result
        this.traitsFile = null
      }
      reader.readAsText(this.traitsFile)
    },
    loadVarietiesFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.varieties = event.target.result
        this.varietiesFile = null
      }
      reader.readAsText(this.varietiesFile)
    },
    show: function () {
      this.rows = this.dataset.rows
      this.cols = this.dataset.cols
      this.traits = this.dataset.traits.join('\n')
      let varieties = []
      this.dataset.data.forEach(r => {
        for (let c = 1; c <= this.cols; c++) {
          varieties.push(r[c].name)
        }
      })
      this.varieties = varieties.join('\n')
      this.formValidated = false
      this.state = {
        rows: null,
        cols: null
      }
      this.traitsFile = null
      this.varietiesFile = null
      this.$refs.settingsModal.show()
    },
    hide: function () {
      this.$refs.settingsModal.hide()
    },
    onSubmit: function (e) {
      this.formValidated = true
      this.state.rows = this.rows > 0
      this.state.cols = this.cols > 0

      if (this.state.rows && this.state.cols) {
        this.$emit('settings-changed', {
          rows: parseInt(this.rows),
          cols: parseInt(this.cols),
          traits: this.traits.split('\n'),
          varieties: this.varieties.split('\n')
        })
        this.hide()
      }
    }
  }
}
</script>

<style>
#settings-form .form-group textarea {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
#settings-form .form-group textarea + .b-form-file * {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
