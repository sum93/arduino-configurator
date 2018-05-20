Vue.component('input-field', {
  props: [
    'inputData'
  ],
  template: `
    <div>
      <div class="form-group row">
        <div class="col-4">
          <label id="domainLabel" class="label-right col-form-label" for="domain">Domain:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model.number="inputData.domain" id="domain">
            <option value="0">Time</option>
            <option value="1">Frequency</option>
          </select>
        </div>
      </div>
      <div id="time" class="form-group row">
        <div class="col-4">
          <label id="domainValueLabel" class="label-right col-form-label" v-if="inputData.domain == 0" for="domainValue">Period (us):</label>
          <label id="domainValueLabel" class="label-right col-form-label" v-if="inputData.domain == 1" for="domainValue" v-cloak>Frequency (Hz):</label>
        </div>
        <div class="col-8">
          <input type="number" class="form-control" v-model.number="inputData.domainValue" id="domainValue">
        </div>
      </div>
    </div>
  `
});

new Vue({
  el: '#periodic-interrupt-generation',
  data: {
    inputData   : {
      domain      : 0,
      domainValue : 0
    },
    resultCode  : ''
  },
  methods: {
    getCode: function () {
      var domain = this.inputData.domain;
      var domainValue = this.inputData.domainValue;

      // process inputs
      if (domain === 0)
        var period = domainValue;
      else
        var period = 1 / domainValue * 1000000;

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
