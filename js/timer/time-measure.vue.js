new Vue({
  el: '#time-measure',
  data: {
    mode      : 0,
    resolution: 0,
    edge      : 0,
    pin       : 0,
    software  : false,
    resultCode: ''
  },
  methods: {
    getCode: function () {
      // inputs
      var mode       = this.mode;
      var resolution = this.resolution;
      var edge       = this.edge;
      var pin        = this.pin;
      var software   = this.software;
      var resultCode = this.resultCode;

      // code generation
      var resultCodeTmp = '#include "Arduino.h"\n';

      if (mode == 0) {
        resultCodeTmp +=
          '\nuint16_t startTimestamp;\n' +
          'uint16_t endTimestamp;\n';
        if (software)
          resultCodeTmp += 'uint16_t overflowCounter = 0;\n';
      } else {
        resultCodeTmp +=
          '\nvolatile uint16_t startTimestamp;\n' +
          'volatile uint16_t endTimestamp;\n' +
          'volatile boolean newData;\n';

        if (software)
          resultCodeTmp += 'volatile uint16_t overflowCounter = 0;\n';
      }

      resultCodeTmp +=
        '\nvoid setup() {\n' +
        '\tcli();\n';
                    
      if (pin == 0)
        resultCodeTmp += '\n\tpinMode(8, INPUT);\n'
      else
        resultCodeTmp +=
          '\n\tACSR = _BV(ACBG) | _BV(ACIC);\n' +
          '\t// 70 us delay for Bandgap to initialize\n' +
          '\tdelayMicroseconds(70);\n';

      if (pin == 1)
        resultCodeTmp += '\tpinMode(7, INPUT);\n';

      if (pin != 0 && pin != 1) {
        resultCodeTmp +=
          '\tADCSRA &= ~_BV(ADEN);\n' +
          '\tADCSRB |=  _BV(ACME);\n';
        if (pin == 2)
          resultCodeTmp += '\tpinMode(A0, INPUT);\n';
        else if (pin == 3)
          resultCodeTmp +=
            '\tADMUX = _BV(MUX0);\n' +
            '\tpinMode(A1, INPUT);\n';
        else if (pin == 4)
          resultCodeTmp +=
            '\tADMUX = _BV(MUX1);\n' +
            '\tpinMode(A2, INPUT);\n';
        else if (pin == 5)
          resultCodeTmp +=
            '\tADMUX = _BV(MUX1) | _BV(MUX0);\n' +
            '\tpinMode(A3, INPUT);\n';
        else if (pin == 6)
          resultCodeTmp +=
            '\tADMUX = _BV(MUX2);\n' +
            '\tpinMode(A4, INPUT);\n';
        else
          resultCodeTmp +=
            '\tADMUX = _BV(MUX2) | _BV(MUX0)\n' +
            '\tpinMode(A5, INPUT);\n';
      }
        
      resultCodeTmp +=
        '\n\tTCCR1A = 0x00;\n' +
        '\tTCCR1B = ';

      if (edge == 2)
        resultCodeTmp += '_BV(ICES1) | ';

      if (resolution == 0)
        resultCodeTmp += '_BV(CS10);\n';
      else if (resolution == 1)
        resultCodeTmp += '_BV(CS11);\n';
      else if (resolution == 2)
        resultCodeTmp += '_BV(CS11) | _BV(CS10);\n';
      else if (resolution == 3)
        resultCodeTmp += '_BV(CS12);\n';
      else
        resultCodeTmp += '_BV(CS12) | _BV(CS10);\n';

      resultCodeTmp += '\tTCCR1C = 0x00;\n';

      if (mode == 1) {
        resultCodeTmp +=
          '\n\tTIFR1 |= _BV(ICF1);\n' +
          '\tTIMSK1 = _BV(ICIE1);\n';
      }

      resultCodeTmp +=
        '\n\tsei();\n' +
        '}\n' +
        '\nvoid loop() {\n';

      if (mode == 0)
        resultCodeTmp += '\t// measureTime();\n';

      if (mode == 1)
        resultCodeTmp += '\t// calculateTime()\n';

      resultCodeTmp += '}\n';

      if (mode == 0) {
        if (software)
          resultCodeTmp += '\nuint32_t measureTime() {\n';
        else
          resultCodeTmp += '\nuint16_t measureTime() {\n';

        resultCodeTmp += '\tcli();\n';

        if (edge == 0)
          resultCodeTmp += '\tTCCR1B |= _BV(ICES1);\n';
        if (edge == 1)
          resultCodeTmp += '\tTCCR1B &= ~_BV(ICES1);\n';

        resultCodeTmp +=
          '\twhile(!(TIFR1 & _BV(ICF1)));\n' +
          '\tstartTimestamp = ICR1;\n';

        if (edge == 0)
          resultCodeTmp += '\n\tTCCR1B &= ~_BV(ICES1);\n';
        if (edge == 1)
          resultCodeTmp += '\n\tTCCR1B |= _BV(ICES1);\n';
        
        resultCodeTmp += '\tTIFR1 |= _BV(ICF1)'
        
        if (software)
          resultCodeTmp += ' | _BV(TOV1);\n';
        else
          resultCodeTmp += ';\n';
        
        resultCodeTmp += '\twhile(!(TIFR1 & _BV(ICF1)))';
        
        if (software)
          resultCodeTmp +=
            ' {\n' +
            '\t\tif(((TIFR1 & _BV(TOV1)) == 0x01) && (startTimestamp < ICR1)) {\n' +
            '\t\t\tTIFR1 |= _BV(TOV1);\n' +
            '\t\t\toverflowCounter++;\n' +
            '\t\t}\n' +
            '\t}\n';
        else
          resultCodeTmp += ';\n';
        
        resultCodeTmp +=
          '\tendTimestamp = ICR1;\n' +
          '\tsei();\n';
        
        if (software)
          resultCodeTmp +=
            '\n\tif (startTimestamp < endTimestamp)\n' +
            '\t\treturn ((uint32_t)overflowCounter << 16) + (endTimestamp - startTimestamp);\n' +
            '\telse\n' +
            '\t\treturn ((uint32_t)overflowCounter << 16) + (65536 - (startTimestamp - endTimestamp));\n';
        else
          resultCodeTmp +=
            '\n\tif (startTimestamp < endTimestamp)\n' +
            '\t\treturn endTimestamp - startTimestamp;\n' +
            '\telse\n' +
            '\t\treturn 65536 - (startTimestamp - endTimestamp);\n';
        
        resultCodeTmp += '}\n';
      }

      if (mode == 1) {
        resultCodeTmp += 
          '\n// this function returns the measured time,\n' +
          '// if a measure is completed, else returns 0\n' +
          'uint32_t calculateTime() {\n' +
          '\tif(newData) {\n' +
          '\t\tnewData = false;\n';

        if (software)
          resultCodeTmp +=
            '\n\t\tif (startTimestamp < endTimestamp)\n' +
            '\t\t\treturn ((uint32_t)overflowCounter << 16) + (endTimestamp - startTimestamp);\n' +
            '\t\telse\n' +
            '\t\t\treturn ((uint32_t)overflowCounter << 16) + (65536 - (startTimestamp - endTimestamp));\n';
        else 
          resultCodeTmp +=
            '\n\t\tif (startTimestamp < endTimestamp)\n' +
            '\t\t\treturn endTimestamp - startTimestamp;\n' +
            '\t\telse\n' +
            '\t\t\treturn 65536 - (startTimestamp - endTimestamp);\n';

        resultCodeTmp +=
          '\t} else\n'+
          '\t\treturn 0;\n'+
          '}\n' +
          '\nISR(TIMER1_CAPT_vect) {\n' +
          '\tTIFR1 |= _BV(ICF1);\n' +
          '\n\tstatic boolean state;\n' +
          '\n\tif (state) {\n' +
          '\t\tendTimestamp = ICR1;\n';

        if (edge == 0)
          resultCodeTmp += '\t\tTCCR1B |= _BV(ICES1);\n';
        if (edge == 1)
          resultCodeTmp += '\t\tTCCR1B &= ~_BV(ICES1);\n';

        resultCodeTmp +=
          '\t\tnewData = true;\n' +
          '\t} else {\n' +
          '\t\tstartTimestamp = ICR1;\n';

        if (edge == 0)
          resultCodeTmp += '\t\tTCCR1B &= ~_BV(ICES1);\n';
        if (edge == 1)
          resultCodeTmp += '\t\tTCCR1B |= _BV(ICES1);\n';

        if (software)
          resultCodeTmp +=
            '\t\tTIMSK1 |= _BV(OCIE1A);\n' +
            '\t\tTIFR1 |= _BV(TOV1);\n';
          
        resultCodeTmp +=
          '\t}\n\n' +
          '\tstate = !state;\n' +
          '}\n\n';

        if (software)
          resultCodeTmp +=
            'ISR(TIMER1_OVF_vect) {\n' +
            '\tTIFR1 |= _BV(TOV1);\n' +
            '\toverflowCounter++;\n' +
            '}\n';
      }

      this.resultCode = resultCodeTmp;
    }
  }
})
