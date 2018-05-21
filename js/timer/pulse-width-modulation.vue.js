Vue.component('information-boxes', {
  props: [
    'inputData'
  ],
  template: `
    <div class="col-md-6 mt-4 mt-md-0" v-cloak>
      <h4>Additional Information:</h4>
      <div class="col-12 information pb-2 pt-4">
        <p>
          In this application we use the Timer/Counter1 unit for PWM waveform generation. More functionality provided than the built in function.<br/>
          While using the generated code, you won't be able to use the Servo library neither the analonWrite builtin function on pin 9 and 10.<br/>
          You can read more about PWM modes <a v-bind:href="datasheet(162)" target="_blank">here</a>.
        </p>
        <h5 class="title">Frequency:</h5>
        <p>
          <span v-if="inputData.frequency != 15 && inputData.frequency != 16">Preset frequencies: try to use one of these, since they have the most functionality.<br/></span>
          <span v-if="inputData.frequency == 15">OCR1A - this allows you to achive higher PWM resolution and you can set custom frequencies, but revokes the ability to use the OC1A output.<br/></span>
          <span v-if="inputData.frequency == 16">ICR1 - allow you to set custom frequencies and achive higher PWM resoulution, but since the register is not double buffered you can't load low values in it, otherwise it would miss it.</span>
        </p>
      </div>
    </div>
  `,
  methods: {
    datasheet: function (pageNumber){
      return 'http://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-42735-8-bit-AVR-Microcontroller-ATmega328-328P_Datasheet.pdf' + '#page=' + pageNumber;
    }
  }
})

Vue.component('input-field', {
  props: [
    'inputData'
  ],
  template: `
    <div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="usage">Usage:</label>
        </div>
        <div class="col-8">
          <select class="form-control" id="usage" v-model.number="inputData.usage" v-on:change="setFrequency()">
            <option value="0">Power Regulation / Retrification / DAC Applications</option>
            <option value="1">Motor Control (phase correct)</option>
            <option value="2">Motor Control (phase and frequency correct)</option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="frequency">Frequency:</label>
        </div>
        <div id="frequencySelect" class="col-8">
          <select class="form-control" v-model.number="inputData.frequency" id="frequency">
            <option v-if="inputData.usage != 2" disabled>8-bit mode:</option>
            <option v-if="inputData.usage != 2" value="0">- 62500 Hz</option>
            <option v-if="inputData.usage != 2" value="1">- 7812.5 Hz</option>
            <option v-if="inputData.usage != 2" value="2">- 976.56 Hz</option>
            <option v-if="inputData.usage != 2" value="3">- 122.07 Hz</option>
            <option v-if="inputData.usage != 2" value="4">- 15.26 Hz</option>
            <option v-if="inputData.usage != 2" disabled>9-bit mode:</option>
            <option v-if="inputData.usage != 2" value="5">- 31250 Hz</option>
            <option v-if="inputData.usage != 2" value="6">- 3906.25 Hz</option>
            <option v-if="inputData.usage != 2" value="7">- 488.28 Hz</option>
            <option v-if="inputData.usage != 2" value="8">- 61.04 Hz</option>
            <option v-if="inputData.usage != 2" value="9">- 7.63 Hz</option>
            <option v-if="inputData.usage != 2" disabled>10-bit mode:</option>
            <option v-if="inputData.usage != 2" value="10">- 15625 Hz</option>
            <option v-if="inputData.usage != 2" value="11">- 1953.13 Hz</option>
            <option v-if="inputData.usage != 2" value="12">- 244.14 Hz</option>
            <option v-if="inputData.usage != 2" value="13">- 30.52 Hz</option>
            <option v-if="inputData.usage != 2" value="14">- 3.81 Hz</option>
            <option disabled>Custom:</option>
            <option value="15">- Using OCR1A</option>
            <option value="16">- Using ICR1</option>
          </select>
        </div>
      </div>
      <div v-cloak>
        <div v-if="inputData.frequency == 15 || inputData.frequency == 16" class="form-group row">
          <div class="col-4">
            <label class="label-right col-form-label" for="customFrequency">Custom frequency (Hz):</label>
          </div>
          <div class="col-8">
            <input type="number" class="form-control" v-model.number="inputData.customFrequency" id="customFrequency">
          </div>
        </div>
      </div>
      <h5>Outputs:</h5>
      <div v-if="inputData.frequency != 15">
        <div class="form-group row">
          <div class="col-4">
            <label class="label-right col-form-label" for="activeA">Active A:</label>
          </div>
          <div class="col-8 form-check">
            <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model.number="inputData.activeA" id="activeA">
          </div>
        </div>
        <div class="form-group row">
          <div class="col-4">
            <label class="label-right col-form-label" for="invertedA">Inverted A:</label>
          </div>
          <div class="col-8 form-check">
            <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model.number="inputData.invertedA" id="invertedA">
          </div>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="activeB">Active B:</label>
        </div>
        <div class="col-8 form-check">
          <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model.number="inputData.activeB" id="activeB">
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="invertedB">Inverted B:</label>
        </div>
        <div class="col-8 form-check">
          <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model.number="inputData.invertedB" id="invertedB">
        </div>
      </div>
    </div>
  `,
  setFrequency: function () {
    if (this.inputData.usage == 2)
      this.inputData.frequency = 15;
  }
})

new Vue({
  el: '#pulse-width-modulation',
  data: {
    inputData: {
      usage          : 0,
      frequency      : 0,
      customFrequency: 0,
      activeA        : false,
      invertedA      : false,
      activeB        : false,
      invertedB      : false
    },
    resultCode     : ''
  },
  methods: {
    getCode: function () {
      // inputs
      var usage = this.inputData.usage;
      var frequency = this.inputData.frequency;
      if (frequency == 15 || frequency == 16) {
        var customFrequency = this.inputData.customFrequency;
        if(!customFrequency) {
          this.resultCode = '// Specify a custom frequency!';
          return;
        }
      }
      if (frequency != 15) {
        var activeA = this.inputData.activeA;
        var invertedA = this.inputData.invertedA;
      }
      var activeB = this.inputData.activeB;
      var invertedB = this.inputData.activeB;

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
        if (activeA) {
          resultCode += '\tpinMode(9, OUTPUT);\n';

          if (invertedA)
            resultCode += '\tTCCR1A |= _BV(COM1A1) | _BV(COM1A0);\n';
          else
            resultCode += '\tTCCR1A |= _BV(COM1A1);\n';
        }
      }
      if (activeB) {
        resultCode += '\tpinMode(10, OUTPUT);\n';

        if (activeB && !invertedB)
          resultCode += '\tTCCR1B |= _BV(COM1B1);\n';
        if (activeB && invertedB)
          resultCode += '\tTCCR1B |= _BV(COM1B1) | _BV(COM1B0);\n';
      }

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
    }
  }
})
