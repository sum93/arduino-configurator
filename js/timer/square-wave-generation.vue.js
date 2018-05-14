new Vue({
  el: '#square-wave-generation',
  data: {
    frequency: 0,
    offsetB  : 0,
    activeA  : false,
    activeB  : false,
    resultCode  : ''
  },
  methods: {
    getCode: function () {
      // inputs
      var frequency = this.frequency;
      var offsetB   = this.offsetB;
      var activeA   = this.activeA;
      var activeB   = this.activeB;

      if(offsetB > 180 || offsetB < 0) {
        this.resultCode = '// Offset is out of range!\n';
        return;
      }

      // calculations
      // calculating half period
      var halfPeriod = 1 / (2 * frequency) * 1000000;

      // determine if half period in range
      if (halfPeriod < 0.0625 || halfPeriod > 64 * 65535) {
        this.resultCode = '// Frequency is out of range!\n';
        return;
      }

      // calculating resolution
      var resolution = 0;
      if (halfPeriod <= 0.0625 * 65536) 
        resolution = 0.0625;
      else if (halfPeriod <= 0.5 * 65536)
        resolution = 0.5;
      else if (halfPeriod <= 4 * 65536)
        resolution = 4;
      else if (halfPeriod <= 16 * 65536)
        resolution = 16;
      else
        resolution = 64;

      // calculating register values
      var frequencyRegisterValue = Math.round(halfPeriod / resolution);
      var offsetRegisterValue = Math.round(Math.abs(180 - offsetB) / 180 * frequencyRegisterValue);


      var resultCode =
        '#include "Arduino.h"\n' +
        '\nvoid setup() {\n' +
        '\tcli();\n';

      if (activeA || activeB){
        if (activeA)
          resultCode += '\n\tpinMode(9, OUTPUT);';
        if (activeB)
          resultCode += '\n\tpinMode(10, OUTPUT);';

        resultCode += '\n';
      }

        
      resultCode += '\n\tTCCR1A = ';

      if (!activeA && !activeB)
        resultCode += '0x00;\n';
      else if (activeA && !activeB)
        resultCode += '_BV(COM1A0);\n';
      else if (!activeA && activeB)
        resultCode += '_BV(COM1B0);\n';
      else
        resultCode += '_BV(COM1A0) | _BV(COM1B0);\n';

      resultCode +=
        '\tTCCR1B = _BV(WGM12);\n' +
        '\tTCCR1B |= ';

      if (resolution == 0.0625)
        resultCode += '_BV(CS10);\n';
      else if (resolution == 0.5)
        resultCode += '_BV(CS11);\n';
      else if (resolution == 4)
        resultCode += '_BV(CS11) | _BV(CS10);\n';
      else if (resolution == 16)
        resultCode += '_BV(CS12);\n';
      else
        resultCode += '_BV(CS12) | _BV(CS10);\n';

      resultCode +=
        '\tTCCR1C = 0x00;\n' +
        '\n\tTCNT1 = 0x0000;\n' +
        '\n\tOCR1A = 0x' + frequencyRegisterValue.toString(16) + ';\n' +
        '\tOCR1B = 0x' + offsetRegisterValue.toString(16) + ';\n';

      resultCode +=
        '\n\tsei();\n' +
        '}\n' +
        '\nvoid loop() {\n' +
        '\t //\n' +
        '}\n';

      this.resultCode = resultCode;
    }
  }
})
