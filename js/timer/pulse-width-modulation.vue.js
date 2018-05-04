new Vue({
  el: '#pulse-width-modulation',
  data: {
    usage          : 0,
    frequency      : 0,
    customFrequency: 0,
    activeA        : false,
    invertedA      : false,
    activeB        : false,
    invertedB      : false,
    resultCode     : ''
  },
  methods: {
    getCode: function () {
      // inputs
      var usage = this.usage;
      var frequency = this.frequency;
      if (frequency == 15 || frequency == 16) {
        var customFrequency = this.customFrequency;
        if(!customFrequency) {
          this.resultCode = '// Specify a custom frequency!';
          return;
        }
      }
      if (frequency != 15) {
        var activeA = this.activeA;
        var invertedA = this.invertedA;
      }
      var activeB = this.activeB;
      var invertedB = this.activeB;

      // calculations
      if (customFrequency) {
        var period = 1000000 / customFrequency;
        if (period < 0.0625 * 4 || period > 64 * 65536) {
          this.resultCode = '// Frequency is out of range!\n';
          return;
        }
        // calculate optimal resolution
        var resolution = 0;
        if (period <= 0.0625 * 65536) 
          resolution = 0.0625;
        else if (period <= 0.5 * 65536)
          resolution = 0.5;
        else if (period <= 4 * 65536)
          resolution = 4;
        else if (period <= 16 * 65536)
          resolution = 16;
        else {
          resolution = 64;
        }
        // calculates register value
        var frequencyRegisterValue = Math.round(period / resolution) - 1;
      }

      // decides which is the maximum register value
      var maxRegisterValue = 0;
      if (frequency < 5)
        maxRegisterValue = 255;
      else if (frequency < 10)
        maxRegisterValue = 511;
      else if (frequency < 15)
        maxRegisterValue = 1023;
      else
        maxRegisterValue = frequencyRegisterValue;

      // code generation
      var resultCode =
        '#include "Arduino.h"\n' +
        '\nvoid setup() {\n' +
        '\tcli();\n' +
        '\n\t// PWM mode\n';

      if (usage == 0) {
        if (frequency < 5)
          resultCode +=
            '\tTCCR1A = _BV(WGM10);\n' +
            '\tTCCR1B = _BV(WGM12);\n';
        else if (frequency >= 5 && frequency < 10)
          resultCode +=
            '\tTCCR1A = _BV(WGM11);\n' +
            '\tTCCR1B = _BV(WGM12);\n';
        else if (frequency >= 10 && frequency < 15)
          resultCode +=
            '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n' +
            '\tTCCR1B = _BV(WGM12);\n';
        else if (frequency == 15)
          resultCode +=
            '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n' +
            '\tTCCR1B = _BV(WGM13) | _BV(WGM12);\n';
        else
          resultCode +=
            '\tTCCR1A = _BV(WGM11);\n' +
            '\tTCCR1B = _BV(WGM13) | _BV(WGM12);\n';
      }
      else if (usage == 1) {
        if (frequency < 5)
          resultCode +=
            '\tTCCR1A = _BV(WGM10);\n' +
            '\tTCCR1B = 0x00;\n';
        else if (frequency >= 5 && frequency < 10)
          resultCode +=
            '\tTCCR1A = _BV(WGM11);\n' +
            '\tTCCR1B = 0x00;\n';
        else if (frequency >= 10 && frequency < 15)
          resultCode +=
            '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n' +
            '\tTCCR1B = 0x00;\n';
        else if (frequency == 15)
          resultCode +=
            '\tTCCR1A = _BV(WGM11);\n' +
            '\tTCCR1B = _BV(WGM13);\n';
        else
          resultCode +=
            '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n' +
            '\tTCCR1B = _BV(WGM13);\n';
      }
      else {
        if (frequency == 15)
          resultCode +=
            '\tTCCR1A = 0x00;\n' +
            '\tTCCR1B = _BV(WGM13);\n';
        else
          resultCode +=
            '\tTCCR1A = _BV(WGM10);\n' +
            '\tTCCR1B = _BV(WGM13);\n';
      }

      resultCode += '\n\t// Prescaler\n';

      if (frequency == 0 | frequency == 5 | frequency == 10 | resolution == 0.0625)
        resultCode += '\tTCCR1B |= _BV(CS10);\n';
      else if (frequency == 1 | frequency == 6 | frequency == 11 | resolution == 0.5)
        resultCode += '\tTCCR1B |= _BV(CS11);\n';
      else if (frequency == 2 | frequency == 7 | frequency == 12 | resolution == 4)
        resultCode += '\tTCCR1B |= _BV(CS11) | _BV(CS10);\n';
      else if (frequency == 3 | frequency == 8 | frequency == 13 | resolution == 16)
        resultCode += '\tTCCR1B |= _BV(CS12);\n';
      else
        resultCode += '\tTCCR1B |= _BV(CS12) | _BV(CS10);\n';

      resultCode += '\n\t// Outputs\n';

      if (frequency != 15) {
        if (activeA && !invertedA)
          resultCode += '\tTCCR1A |= _BV(COM1A1);\n';
        else if (activeA && invertedA)
          resultCode += '\tTCCR1A |= _BV(COM1A1) | _BV(COM1A0);\n';
      }
      if (activeB && !invertedB)
        resultCode += '\tTCCR1B |= _BV(COM1B1);\n';
      if (activeB && invertedB)
        resultCode += '\tTCCR1B |= _BV(COM1B1) | _BV(COM1B0);\n';

      resultCode += '\n\tTCCR1C = 0x00;\n';

      if (frequency == 15)
        resultCode +=
          '\n\t// Custom frequency\n' +
          '\tOCR1A = 0x' + frequencyRegisterValue.toString(16) + ';\n';
      else if (frequency == 16)
          resultCode +=
            '\n\t// Custom frequency\n' +
            '\tICR1 = 0x' + frequencyRegisterValue.toString(16) + ';\n';
              
      resultCode +=
        '\n\tsei();\n' +
        '}\n' +
        '\nvoid loop() {\n' +
        '\t// setOutCmpRegA(value);\n' +
        '\t// setOutCmpRegB(value);\n' +
        '\t// setOutADutyCycle(value);\n' +
        '\t// setOutBDutyCycle(value);\n' +
        '}\n' +
        '\n// value between 0 and ' + maxRegisterValue + ' inclusively\n' +
        'void setOutCmpRegA(uint16_t value) {\n' +
        '\tOCR1A = value;\n' +
        '}\n' +
        '\n// value between 0 and ' + maxRegisterValue + ' inclusively\n' +
        'void setOutCmpRegB(uint16_t value) {\n' +
        '\tOCR1B = value;\n' +
        '}\n' +
        '\n// value between 0 and 100 inclusively\n' +
        'void setOutADutyCycle(uint16_t value) {\n' +
        '\tif (value < 0 || value < 100)\n' +
        '\t\treturn;\n' +
        '\n\tvalue = ' + maxRegisterValue + ' / 100 * value;\n' +
        '\tOCR1A = value;\n' +
        '}\n' +
        '\n// value between 0 and 100 inclusively\n' +
        'void setOutBDutyCycle(uint16_t value) {\n' +
        '\tif (value < 0 || value < 100)\n' +
        '\t\treturn;\n' +
        '\n\tvalue = ' + maxRegisterValue + ' / 100 * value;\n' +
        '\tOCR1B = value;\n' +
        '}\n';

        this.resultCode = resultCode;
    },
    setFrequency: function () {
      if (this.usage == 2)
        this.frequency = 15;
    }
  }
})
