Vue.component('input-field', {
  props: [
    'inputData'
  ],
  template: `
    <div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="frequency">Frequency (Hz):</label>
        </div>
        <div class="col-8">
          <input type="number" class="form-control" v-model.number="inputData.frequency" id="frequency">
        </div>
      </div>
      <div class="form-group row" v-if="inputData.activeB">
        <div class="col-4">
          <label class="label-right col-form-label" for="offsetB">Output B's offset (°):</label>
        </div>
        <div class="col-8">
          <input type="number" class="form-control" v-model.number="inputData.offsetB" id="offsetB">
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="activeA">Output A active:</label>
        </div>
        <div class="col-8 form-check">
          <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model="inputData.activeA" id="activeA">
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="activeB">Output B active:</label>
        </div>
        <div class="col-8 form-check">
          <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model="inputData.activeB" id="activeB">
        </div>
      </div>
    </div>
  `
})

Vue.component('information-boxes', {
  props: [
    'inputData'
  ],
  template: `
    <div class="col-md-6 mt-4 mt-md-0" v-cloak>
      <h4>Additional Information:</h4>
      <div class="col-12 information pb-2 pt-4">
        <p>
          This mode uses the output compare unit A and B of the Timer/Counter1 unit to generate square wave.<br/>
          The output compare units' output can switch states based on the compare match event between the compare registers and the timer register.<br/>
          While using the generated code, you won't be able to use the Servo library neither the analonWrite builtin function on pin 9 and 10.<br/>
          You can read more about the output compare units <a v-bind:href="datasheet(157)" target="_blank">here</a>.
        </p>
        <div v-if="inputData.activeB">
          <h5 class="title">Output B's offset:</h5>
          <p>
            The frequency is set by the OCR1A register, but we are free to modify the OCR1B register. This means we can generate different waves in different phase up to 180°.
          </p>
        </div>
      </div>
    </div>
  `,
  methods: {
    datasheet: function (pageNumber){
      return 'http://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-42735-8-bit-AVR-Microcontroller-ATmega328-328P_Datasheet.pdf' + '#page=' + pageNumber;
    }
  }
})

new Vue({
  el: '#square-wave-generation',
  data: {
    inputData: {
      frequency: 0,
      offsetB  : 0,
      activeA  : false,
      activeB  : false
    },
    resultCode: ''
  },
  methods: {
    getCode: function () {
      // inputs
      var frequency = this.inputData.frequency;
      var offsetB   = this.inputData.offsetB;
      var activeA   = this.inputData.activeA;
      var activeB   = this.inputData.activeB;

      if(activeB == 1 && (offsetB > 180 || offsetB < 0)) {
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
