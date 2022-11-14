<template>
  <div>
    <div class="text-center" v-if="loading">
      <b-spinner style="width: 3rem; height: 3rem;" variant="primary" type="grow" />
      <p class="text-muted mt-3" v-if="$t('modalTextLoading')">{{ $t('modalTextLoading') }}</p>
    </div>

    <b-row>
      <b-col cols=12 md=6 class="mb-3">
        <b-card class="h-100" no-body>
          <b-card-body class="d-flex flex-column">
            <b-card-title>{{ $t('cardTitleGermplasmGridRowCol') }}</b-card-title>
            <b-card-sub-title class="mb-3">{{ $t('cardSubtitleGermplasmGridRowCol') }}</b-card-sub-title>
            <b-row>
              <b-col cols=12 md=6>
                <!-- Field layout rows -->
                <b-form-group label-for="rows" :description="$t('formDescriptionSettingsRow')" >
                  <template v-slot:label>
                    <BIconLayoutThreeColumns rotate="90" /><span> {{ $t('formLabelSettingsRows') }}</span>
                  </template>
                  <b-form-input id="rows" number type="number" :min="1" required v-model.number="localRows" />
                </b-form-group>
              </b-col>
              <b-col cols=12 md=6>
                <!-- Field layout cols -->
                <b-form-group label-for="cols" :description="$t('formDescriptionSettingsCol')">
                  <template v-slot:label>
                    <BIconLayoutThreeColumns /><span> {{ $t('formLabelSettingsCols') }}</span>
                  </template>
                  <b-form-input id="cols" number type="number" :min="1" required v-model.number="localCols" />
                </b-form-group>
              </b-col>
            </b-row>

            <b-button @click="show" class="align-self-start mt-auto"><BIconArrowClockwise /> {{ $t('buttonChange') }}</b-button>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col cols=12 md=6 class="mb-3">
        <b-card class="h-100" no-body>
          <b-card-body class="d-flex flex-column">
            <b-card-title>{{ $t('cardTitleGermplasmGridImport') }}</b-card-title>
            <b-card-sub-title class="mb-3">{{ $t('cardSubtitleGermplasmGridImport') }}</b-card-sub-title>
            <b-form-radio-group buttons v-model="userInputType" class="align-self-start">
              <b-form-radio value="names"><BIconFileText /> {{ $t('dropdownImportGermplasmGridNames') }}</b-form-radio>
              <b-form-radio value="reps"><BIconFileDiff /> {{ $t('dropdownImportGermplasmGridReps') }}</b-form-radio>
            </b-form-radio-group>
            <b-form :validated="formValidated" id="germplasm-grid-form">
              <b-form-group label-for="user-input"
                            :label="userInputType === 'names' ? $t('formLabelSetupGermplasmNames') : $t('formLabelSetupGermplasmReps')"
                            :state="formValidated"
                            :invalid-feedback="formFeedback.input">
                <b-form-textarea id="user-input"
                                @keydown.tab.prevent="tabber($event)"
                                rows=6
                                wrap="off"
                                required
                                :state="formValidated"
                                :placeholder="$t(userInputType === 'names' ? 'formPlaceholderVarietiesGrid' : 'formPlaceholderVarietiesGridRep')"
                                v-model="userInput" />
                <!-- Variety names file loading -->
                <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="userInputFile" />
              </b-form-group>
            </b-form>
            <b-button class="align-self-start mt-auto" @click="loadUserInput" :disabled="!userInput"><BIconArrowDownSquare /> {{ $t('buttonImport') }}</b-button>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <div class="table-responsive responsive-wrapper">
      <table :id="`table-spreadsheet-${id}`" ref="table" class="table table-striped table-bordered grid-table" ></table>
    </div>
  </div>
</template>

<script>
import { BIconArrowDownSquare, BIconFileText, BIconFileDiff, BIconLayoutThreeColumns, BIconArrowClockwise } from 'bootstrap-vue'

let germplasm = [[]]

export default {
  components: {
    BIconArrowDownSquare,
    BIconFileText,
    BIconFileDiff,
    BIconLayoutThreeColumns,
    BIconArrowClockwise
  },
  props: {
    rows: {
      type: Number,
      default: 1
    },
    cols: {
      type: Number,
      default: 1
    },
    prevGermplasm: {
      type: Array,
      default: null
    }
  },
  data: function () {
    const id = this.uuidv4()
    return {
      id: id,
      loading: false,
      userInput: null,
      userInputType: 'names',
      userInputFile: null,
      formValidated: null,
      formFeedback: {
        input: null,
        table: null
      },
      localRows: 1,
      localCols: 1
    }
  },
  watch: {
    rows: function (newValue) {
      this.localRows = newValue
      this.resetGermplasm()
    },
    cols: function (newValue) {
      this.localCols = newValue
      this.resetGermplasm()
    },
    userInputFile: function (newValue) {
      if (newValue) {
        this.loadUserInputFile()
      }
    }
  },
  methods: {
    loadUserInputFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.userInput = event.target.result.replace(/\r/g, '')
        this.userInputFile = null
      }
      reader.readAsText(this.userInputFile)
    },
    resetGermplasm: function () {
      const result = []

      for (let row = 0; row < this.localRows; row++) {
        const r = []
        for (let col = 0; col < this.localCols; col++) {
          r.push({
            name: '',
            rep: null
          })
        }

        result.push(r)
      }

      germplasm = result
    },
    loadUserInput: function () {
      const gridData = this.userInput.split('\n').filter(n => n !== null && n.length > 0).map(r => r.split('\t').map(v => v.trim()))

      if (gridData.length !== this.localRows) {
        this.formValidated = false
        this.formFeedback.input = this.$t('formFeedbackDataGridImportInvalidRowCount', { provided: gridData.length, expected: this.localRows })
        return
      } else {
        for (let row = 0; row < this.localRows; row++) {
          if (gridData[row].length !== this.localCols) {
            this.formValidated = false
            this.formFeedback.input = this.$t('formFeedbackDataGridImportInvalidColumnCount', { rowIndex: row + 1, provided: gridData[row].length, expected: this.localCols })
            return
          }
        }
      }

      for (let row = 0; row < this.localRows; row++) {
        for (let col = 0; col < this.localCols; col++) {
          const tableGermplasm = document.querySelector(`#germplasm-${row}-${col}`).value
          const tableRep = document.querySelector(`#rep-${row}-${col}`).value

          if (this.userInputType === 'names') {
            germplasm[row][col].name = gridData[row][col]
            // Set the value from the table here, this is important, because the direct input into the table is not synchronized with the `germplasm` 2d array until the user hits save or loads another input (here)
            germplasm[row][col].rep = tableRep
          } else {
            // Set the value from the table here, this is important, because the direct input into the table is not synchronized with the `germplasm` 2d array until the user hits save or loads another input (here)
            germplasm[row][col].name = tableGermplasm
            germplasm[row][col].rep = gridData[row][col]
          }
        }
      }

      this.updateTable()

      this.userInput = null
      this.formValidated = null
      this.formFeedback = {
        input: null,
        table: null
      }
    },
    tabber: function (event) {
      const text = this.userInput
      const originalSelectionStart = event.target.selectionStart
      const textStart = text.slice(0, originalSelectionStart)
      const textEnd = text.slice(originalSelectionStart)

      this.userInput = `${textStart}\t${textEnd}`
      event.target.value = this.userInput // required to make the cursor stay in place.
      event.target.selectionEnd = event.target.selectionStart = originalSelectionStart + 1
    },
    emitResult: function () {
      const result = []
      const germplasmRepId = new Map()
      for (let row = 0; row < this.localRows; row++) {
        const r = []
        for (let col = 0; col < this.localCols; col++) {
          const germplasm = document.querySelector(`#germplasm-${row}-${col}`).value
          const rep = document.querySelector(`#rep-${row}-${col}`).value

          if (germplasm === '' && rep === '') {
            r.push({
              name: '',
              rep: null
            })
          } else {
            let id = germplasm
            if (rep) {
              id += '-' + rep
            }

            const other = germplasmRepId.get(id)
            if (other) {
              this.formValidated = false
              this.formFeedback.table = this.$t('formFeedbackDataGridImportDuplicateGermplasmRep', { germplasm: germplasm, rep: rep || 'N/A', rowOne: row + 1, colOne: col + 1, rowTwo: other.row + 1, colTwo: other.col + 1 })
              this.$emit('grid-error', this.formFeedback.table)
              return
            } else {
              germplasmRepId.set(id, { col: col, row: row })
            }

            r.push({
              name: germplasm,
              rep: rep
            })
          }
        }
        result.push(r)
      }

      germplasm = result

      this.$emit('grid-updated', {
        data: result,
        cols: this.localCols,
        rows: this.localRows
      })

      this.hide()
    },
    removeTable: function () {
      this.$refs.table.innerHTML = ''
    },
    createElement: function (parent, type) {
      const element = document.createElement(type)
      parent.appendChild(element)
      return element
    },
    updateTable: function () {
      const table = this.$refs.table
      // Clear the table
      table.innerHTML = ''

      // Create the head and header row
      const tHead = this.createElement(table, 'thead')
      const tRow = this.createElement(tHead, 'tr')
      // Blank element top left
      this.createElement(tRow, 'th')

      // Column headers
      for (let col = 0; col < this.localCols; col++) {
        const th = this.createElement(tRow, 'th')
        th.innerHTML = col + 1
      }

      const tBody = this.createElement(table, 'tbody')

      for (let row = 0; row < this.localRows; row++) {
        // Create a new row
        const rowElement = this.createElement(tBody, 'tr')
        // Row header
        this.createElement(rowElement, 'th').innerHTML = row + 1

        for (let col = 0; col < this.localCols; col++) {
          // New cell
          const cell = this.createElement(rowElement, 'td')
          cell.id = `cell-${row}-${col}`
          const dataCell = germplasm[row][col]
          // Germplasm name input
          const cellId = this.createElement(cell, 'small')
          cellId.className = 'text-muted'
          cellId.innerHTML = this.$t('pageSetupGermplasmGridTableCellRowCol', { row: row + 1, col: col + 1 })
          const g = this.createElement(cell, 'input')
          g.id = `germplasm-${row}-${col}`
          g.value = dataCell.name
          g.placeholder = 'Name/Id'
          g.className = 'grid-input'
          // Rep input
          const rep = this.createElement(cell, 'input')
          rep.id = `rep-${row}-${col}`
          // rep.type = 'number'
          rep.className = 'grid-input'
          rep.placeholder = 'Rep'
          // rep.min = 1
          rep.value = dataCell.rep
        }
      }

      this.loading = false
    },
    /**
     * Generates a v4 UUID
     */
    uuidv4: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
    show: function () {
      if (this.prevGermplasm && this.prevGermplasm.length === this.localRows && this.prevGermplasm.reduce((a, b) => a && (b.length === this.localCols), true)) {
        germplasm = JSON.parse(JSON.stringify(this.prevGermplasm))
      } else {
        this.resetGermplasm()
      }
      this.loading = true
      this.$nextTick(() => {
        this.updateTable()
      })
    },
    hide: function () {
      this.removeTable()
    }
  }
}
</script>

<style>
.responsive-wrapper {
  /* max-height: 60vh; */
  /* overflow-y: auto; */
}
.grid-table td > * {
  display: block;
}
.grid-table td .grid-input {
  min-width: 100px;
  height: calc(1.5em + 0.75rem + 2px);
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}
.grid-table td .grid-input:nth-child(2) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 0;
}
.grid-table td .grid-input:nth-child(3) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
#germplasm-grid-form .form-group textarea {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
#germplasm-grid-form .form-group textarea + .b-form-file * {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
