export default {
  data: function () {
    return {
      guideOrderTypes: [{
        name: 'up-left',
        initialDirection: 'u',
        text: 'widgetGuideOrderUpLeft',
        valid: (x, y) => !this.guideOrderNextUpLeft({ x: x, y: y, direction: 'u' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextUpLeft),
        image: require('@/assets/scoring-order-u-l.svg')
      }, {
        name: 'up-right',
        initialDirection: 'u',
        text: 'widgetGuideOrderUpRight',
        valid: (x, y) => !this.guideOrderNextUpRight({ x: x, y: y, direction: 'u' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextUpRight),
        image: require('@/assets/scoring-order-u-r.svg')
      }, {
        name: 'down-left',
        initialDirection: 'd',
        text: 'widgetGuideOrderDownLeft',
        valid: (x, y) => !this.guideOrderNextDownLeft({ x: x, y: y, direction: 'd' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextDownLeft),
        image: require('@/assets/scoring-order-d-l.svg')
      }, {
        name: 'down-right',
        initialDirection: 'd',
        text: 'widgetGuideOrderDownRight',
        valid: (x, y) => !this.guideOrderNextDownRight({ x: x, y: y, direction: 'd' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextDownRight),
        image: require('@/assets/scoring-order-d-r.svg')
      }, {
        name: 'left-up',
        initialDirection: 'l',
        text: 'widgetGuideOrderLeftUp',
        valid: (x, y) => !this.guideOrderNextLeftUp({ x: x, y: y, direction: 'l' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextLeftUp),
        image: require('@/assets/scoring-order-l-u.svg')
      }, {
        name: 'left-down',
        initialDirection: 'l',
        text: 'widgetGuideOrderLeftDown',
        valid: (x, y) => !this.guideOrderNextLeftDown({ x: x, y: y, direction: 'l' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextLeftDown),
        image: require('@/assets/scoring-order-l-d.svg')
      }, {
        name: 'right-down',
        initialDirection: 'r',
        text: 'widgetGuideOrderRightDown',
        valid: (x, y) => !this.guideOrderNextRightDown({ x: x, y: y, direction: 'r' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextRightDown),
        image: require('@/assets/scoring-order-r-d.svg')
      }, {
        name: 'right-up',
        initialDirection: 'r',
        text: 'widgetGuideOrderRightUp',
        valid: (x, y) => !this.guideOrderNextRightUp({ x: x, y: y, direction: 'r' }).finished,
        cellSequence: start => this.guideCellSequence(start.x, start.y, start.direction, this.guideOrderNextRightUp),
        image: require('@/assets/scoring-order-r-u.svg')
      }]
    }
  },
  methods: {
    guideCellSequence: function (startX, startY, startDirection, nextMethod) {
      const cells = []

      cells.push({ x: startX, y: startY, direction: startDirection })

      let x = startX
      let y = startY
      let direction = startDirection

      let canContinue = true
      while (canContinue) {
        // Get the next cell according to the nextMethod
        const next = nextMethod({ x, y, direction })

        if (next.finished) {
          // Stop iterating
          canContinue = false
          delete next.finished
        } else {
          // Go to next cell
          x = next.x
          y = next.y
          direction = next.direction
          cells.push(next)
        }
      }

      return cells
    },
    guideOrderNextRightUp: function (current) {
      delete current.speak
      if (current.direction === 'r') {
        if (current.x < this.storeCols - 1) {
          current.x++
        } else if (current.y > 0) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'l'
          current.y--
        } else {
          current.finished = true
        }
      } else {
        if (current.x > 0) {
          current.x--
        } else if (current.y > 0) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'r'
          current.y--
        } else {
          current.finished = true
        }
      }

      return current
    },
    guideOrderNextRightDown: function (current) {
      delete current.speak
      if (current.direction === 'r') {
        if (current.x < this.storeCols - 1) {
          current.x++
        } else if (current.y < this.storeRows - 1) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'l'
          current.y++
        } else {
          current.finished = true
        }
      } else {
        if (current.x > 0) {
          current.x--
        } else if (current.y < this.storeRows - 1) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'r'
          current.y++
        } else {
          current.finished = true
        }
      }

      return current
    },
    guideOrderNextLeftDown: function (current) {
      delete current.speak
      if (current.direction === 'l') {
        if (current.x > 0) {
          current.x--
        } else if (current.y < this.storeRows - 1) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'r'
          current.y++
        } else {
          current.finished = true
        }
      } else {
        if (current.x < this.storeCols - 1) {
          current.x++
        } else if (current.y < this.storeRows - 1) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'l'
          current.y++
        } else {
          current.finished = true
        }
      }

      return current
    },
    guideOrderNextLeftUp: function (current) {
      delete current.speak
      if (current.direction === 'l') {
        if (current.x > 0) {
          current.x--
        } else if (current.y > 0) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'r'
          current.y--
        } else {
          current.finished = true
        }
      } else {
        if (current.x < this.storeCols - 1) {
          current.x++
        } else if (current.y > 0) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'l'
          current.y--
        } else {
          current.finished = true
        }
      }

      return current
    },
    guideOrderNextDownRight: function (current) {
      delete current.speak
      if (current.direction === 'd') {
        if (current.y < this.storeRows - 1) {
          current.y++
        } else if (current.x < this.storeCols - 1) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'u'
          current.x++
        } else {
          current.finished = true
        }
      } else {
        if (current.y > 0) {
          current.y--
        } else if (current.x < this.storeCols - 1) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'd'
          current.x++
        } else {
          current.finished = true
        }
      }

      return current
    },
    guideOrderNextDownLeft: function (current) {
      delete current.speak
      if (current.direction === 'd') {
        if (current.y < this.storeRows - 1) {
          current.y++
        } else if (current.x > 0) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'u'
          current.x--
        } else {
          current.finished = true
        }
      } else {
        if (current.y > 0) {
          current.y--
        } else if (current.x > 0) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'd'
          current.x--
        } else {
          current.finished = true
        }
      }

      return current
    },
    guideOrderNextUpRight: function (current) {
      delete current.speak
      if (current.direction === 'u') {
        if (current.y > 0) {
          current.y--
        } else if (current.x < this.storeCols - 1) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'd'
          current.x++
        } else {
          current.finished = true
        }
      } else {
        if (current.y < this.storeRows - 1) {
          current.y++
        } else if (current.x < this.storeCols - 1) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'u'
          current.x++
        } else {
          current.finished = true
        }
      }

      return current
    },
    guideOrderNextUpLeft: function (current) {
      delete current.speak
      if (current.direction === 'u') {
        if (current.y > 0) {
          current.y--
        } else if (current.x > 0) {
          current.speak = 'widgetGuideOrderUturnLeft'
          current.direction = 'd'
          current.x--
        } else {
          current.finished = true
        }
      } else {
        if (current.y < this.storeRows - 1) {
          current.y++
        } else if (current.x > 0) {
          current.speak = 'widgetGuideOrderUturnRight'
          current.direction = 'u'
          current.x--
        } else {
          current.finished = true
        }
      }

      return current
    }
  }
}
