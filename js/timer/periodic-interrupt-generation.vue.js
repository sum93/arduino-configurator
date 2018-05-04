new Vue({
  el: '#periodic-interrupt-generation',
  data: {
    domain      : 0,
    domainValue : 0,
    resultCode  : ''
  },
  computed: {
    numberOfCodeLines: function () {
      var lines = this.resultCode.split('\n').length;
      if (lines == 1)
        return 5;
      return lines;
    }
  },
  methods: {
    getCode: function () {
      // process input
      if (this.domain === 0)
        var period = this.domainValue;
      else
        var period = 1 / this.domainValue * 1000000;

      // calculates optimal resolution, and decides whether software extension needed
      var software = false;
      if (period <= 0.0625 * 65536) 
        var resolution = 0.0625;
      else if (period <= 0.5 * 65536)
        var resolution = 0.5;
      else if (period <= 4 * 65536)
        var resolution = 4;
      else if (period <= 16 * 65536)
        var resolution = 16;
      else {
        var resolution = 64;
        software = period > 65536 * resolution;
      }

      // calculates register value
      if (software) {
        var neededRegisterValue = Math.round(period / resolution);
        var overflowCount = Math.ceil(neededRegisterValue / 65536);
        var registerValue = Math.round(neededRegisterValue / overflowCount);
        var error = - (neededRegisterValue - overflowCount * registerValue);
        var relativeError = error / neededRegisterValue * 100;
      } else
        registerValue = Math.round(period / resolution);
      
      // code generation
      var resultCodeTmp = '#include "Arduino.h"\n';
      
      if (software)
        resultCodeTmp +=
          '\nuint16_t overflowCounter = 0;\n' +
          'uint16_t overflowCount = ' + overflowCount + ';\n';

      resultCodeTmp +=
        '\nvoid setup() {\n' +
        '\tcli();\n' +
        '\n\tTCCR1A = 0x00;\n' +
        '\tTCCR1B = _BV(WGM12);\n' +
        '\tTCCR1B |= ';

      if (resolution === 0.0625)
        resultCodeTmp += '_BV(CS10);\n';
      else if (resolution === 0.5)
        resultCodeTmp += '_BV(CS11);\n';
      else if (resolution === 4)
        resultCodeTmp += '_BV(CS11) | _BV(CS10);\n';
      else if (resolution === 16)
        resultCodeTmp += '_BV(CS12);\n';
      else
        resultCodeTmp += '_BV(CS12) | _BV(CS10);\n';
            
      resultCodeTmp +=
        '\tTCCR1C = 0x00;\n' +
        '\n\tTIMSK1 = _BV(OCIE1A);\n' +
        '\tTIFR1 |= _BV(OCF1A);\n' +
        '\n\tTCNT1 = 0x0000;\n';
    
      if (software)
        resultCodeTmp += 
          '\n\t// error: ' + error * resolution + ' us, relative error: ' + relativeError + ' %\n' +
          '\tOCR1A = 0x' + registerValue.toString(16) + ';\n';
      else
        resultCodeTmp += '\n\tOCR1A = 0x' + registerValue.toString(16) + ';\n';
                
      resultCodeTmp +=
        '\n\tsei();\n' +
        '}\n' +
        '\nvoid loop() {\n' +
        '\t //\n' +
        '}\n' +
        '\nISR(TIMER1_COMPA_vect) {\n';
    
      if (software)
        resultCodeTmp +=
          '\toverflowCounter++;\n' +
          '\tif (overflowCounter == overflowCount) {\n' +
          '\t\toverflowCounter = 0;\n' +
          '\n\t\t// Place your code here.\n' +
          '\t}\n';

      else
        resultCodeTmp +=
          '\t// Place your code here.\n' +
          '}\n';

        this.resultCode = resultCodeTmp;
    }
  }
})
