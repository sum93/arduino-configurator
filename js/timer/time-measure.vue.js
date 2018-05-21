Vue.component('information-boxes', {
  props:[
    'inputData'
  ],
  template: `
    <div class="col-md-6 mt-4 mt-md-0" v-cloak>
      <h4>Additional Information:</h4>
      <div class="col-12 information pb-2 pt-4">
        <p>
          Some info about the functonalities.
        </p>
        <h5 class="info-title">Mode:</h5>
        <p>
          <span v-if="inputData.mode == 0">Polling: uses all the processors capacities while measuring time intervals, but can be used for shorter widths (~2 us).<br/></span>
          <span v-if="inputData.mode == 1">Interrupt driven: the processor can run other codes than checking a flag untill the measure finihses. Slightly worse then polling mode when it comes to short pulse widths.<br/></span>
          <span>You can read more about the input capture unit in the <a href="http://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-42735-8-bit-AVR-Microcontroller-ATmega328-328P_Datasheet.pdf" target="_blank">datasheets</a> 20.9. section.</span>
        </p>
        <h5 class="info-title">Edge detection:</h5>
        <p>
          <span v-if="inputData.edge == 0">Duty cycle: first waits for a positive edge and after saving the registers value changes edge detection.<br/></span>
          <span v-if="inputData.edge == 1">Inverted duty cycle: first waits for a negative edge and after saving the registers value changes edge detection.<br/></span>
          <span v-if="inputData.edge == 2">Positive edges: using this detection we are able to measure the signals period on positive edges.<br/></span>
          <span v-if="inputData.edge == 3">Negative edges: using this detection we are able to measure the signals period on negative edges.<br/></span>
        </p>
        <h5 class="info-title">Input pin:</h5>
        <p>
          <span v-if="inputData.pin == 0">ICP1<br/></span>
          <span v-if="inputData.pin == 1">AIN1<br/></span>
          <span v-if="inputData.pin != 0 && inputData.pin != 1">ADCn<br/></span>
          <span>Read more <a v-bind:href="datasheet(0)" target="_blank">here</a>.</span>
        </p>
        <h5 class="info-title">Software extension:</h5>
        <p>
          <span v-if="inputData.software">Yes<br/></span>
          <span v-if="!inputData.software">No<br/></span>
          <span>Read more <a href="datasheet(0)" target="_blank">here</a>.</span>
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
          <label class="label-right col-form-label" for="mode">Mode:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model.number="inputData.mode" id="mode">
            <option value="0">Polling</option>
            <option value="1">Interrupt</option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="resolution">Resolution:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model.number="inputData.resolution" id="resolution">
            <option value="0">0.0625 us</option>
            <option value="1">0.5 us</option>
            <option value="2">4 us</option>
            <option value="3">16 us</option>
            <option value="4">64 us</option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="edge">Edge Detection:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model.number="inputData.edge" id="edge">
            <option value="0">Positive then negative edge</option>
            <option value="1">Negative then positive edge</option>
            <option value="2">Positive edges</option>
            <option value="3">Negative edges</option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="pin">Input Pin:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model.number="inputData.pin" id="pin">
            <option disabled>Digital:</option>
            <option value="0">- ICP1</option>
            <option disabled>Analog:</option>
            <option value="1">- AIN1</option>
            <option value="2">- ADC0</option>
            <option value="3">- ADC1</option>
            <option value="4">- ADC2</option>
            <option value="5">- ADC3</option>
            <option value="6">- ADC4</option>
            <option value="7">- ADC5</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <label class="label-right col-form-label" for="software">Software Extension:</label>
        </div>
        <div class="col-8 form-check">
          <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model="inputData.software" id="software">
        </div>
      </div>
    </div>
  `
})

new Vue({
  el: '#time-measure',
  data: {
    inputData: {
      mode      : 0,
      resolution: 0,
      edge      : 0,
      pin       : 0,
      software  : false,
    },
    resultCode: ''
  },
  methods: {
    getCode: function () {
      // inputs
      var mode       = this.inputData.mode;
      var resolution = this.inputData.resolution;
      var edge       = this.inputData.edge;
      var pin        = this.inputData.pin;
      var software   = this.inputData.software;
      var resultCode = this.inputData.resultCode;

      // code generation
      var resultCode = '#include "Arduino.h"\n';

      if (mode == 0) {
        resultCode +=
          '\nuint16_t startTimestamp;\n' +
          'uint16_t endTimestamp;\n';
        if (software)
          resultCode += 'uint16_t overflowCounter = 0;\n';
      } else {
          resultCode +=
          '\nvolatile uint16_t startTimestamp;\n' +
          'volatile uint16_t endTimestamp;\n' +
          'volatile boolean newData;\n';

        if (software)
          resultCode += 'volatile uint16_t overflowCounter = 0;\n';
      }

      resultCode +=
        '\nvoid setup() {\n' +
        '\tcli();\n';
                    
      if (pin == 0)
        resultCode += '\n\tpinMode(8, INPUT);\n'
      else
        resultCode +=
          '\n\tACSR = _BV(ACBG) | _BV(ACIC);\n' +
          '\t// 70 us delay for Bandgap to initialize\n' +
          '\tdelayMicroseconds(70);\n';

      if (pin == 1)
        resultCode += '\tpinMode(7, INPUT);\n';

      if (pin != 0 && pin != 1) {
        resultCode +=
          '\tADCSRA &= ~_BV(ADEN);\n' +
          '\tADCSRB |=  _BV(ACME);\n';
        if (pin == 2)
          resultCode += '\tpinMode(A0, INPUT);\n';
        else if (pin == 3)
          resultCode +=
            '\tADMUX = _BV(MUX0);\n' +
            '\tpinMode(A1, INPUT);\n';
        else if (pin == 4)
          resultCode +=
            '\tADMUX = _BV(MUX1);\n' +
            '\tpinMode(A2, INPUT);\n';
        else if (pin == 5)
          resultCode +=
            '\tADMUX = _BV(MUX1) | _BV(MUX0);\n' +
            '\tpinMode(A3, INPUT);\n';
        else if (pin == 6)
          resultCode +=
            '\tADMUX = _BV(MUX2);\n' +
            '\tpinMode(A4, INPUT);\n';
        else
          resultCode +=
            '\tADMUX = _BV(MUX2) | _BV(MUX0)\n' +
            '\tpinMode(A5, INPUT);\n';
      }
        
      resultCode +=
        '\n\tTCCR1A = 0x00;\n' +
        '\tTCCR1B = ';

      if (edge == 2)
        resultCode += '_BV(ICES1) | ';

      if (resolution == 0)
        resultCode += '_BV(CS10);\n';
      else if (resolution == 1)
        resultCode += '_BV(CS11);\n';
      else if (resolution == 2)
        resultCode += '_BV(CS11) | _BV(CS10);\n';
      else if (resolution == 3)
        resultCode += '_BV(CS12);\n';
      else
        resultCode += '_BV(CS12) | _BV(CS10);\n';

      resultCode += '\tTCCR1C = 0x00;\n';

      if (mode == 1) {
        resultCode +=
          '\n\tTIFR1 |= _BV(ICF1);\n' +
          '\tTIMSK1 = _BV(ICIE1);\n';
      }

      resultCode +=
        '\n\tsei();\n' +
        '}\n' +
        '\nvoid loop() {\n';

      if (mode == 0)
        resultCode += '\t// measureTime();\n';

      if (mode == 1)
        resultCode += '\t// calculateTime()\n';

      resultCode += '}\n';

      if (mode == 0) {
        if (software)
          resultCode += '\nuint32_t measureTime() {\n';
        else
          resultCode += '\nuint16_t measureTime() {\n';

        resultCode += '\tcli();\n';

        if (edge == 0)
          resultCode += '\tTCCR1B |= _BV(ICES1);\n';
        if (edge == 1)
          resultCode += '\tTCCR1B &= ~_BV(ICES1);\n';

        resultCode +=
          '\twhile(!(TIFR1 & _BV(ICF1)));\n' +
          '\tstartTimestamp = ICR1;\n';

        if (edge == 0)
          resultCode += '\n\tTCCR1B &= ~_BV(ICES1);\n';
        if (edge == 1)
          resultCode += '\n\tTCCR1B |= _BV(ICES1);\n';
        
        resultCode += '\tTIFR1 |= _BV(ICF1)'
        
        if (software)
          resultCode += ' | _BV(TOV1);\n';
        else
          resultCode += ';\n';
        
        resultCode += '\twhile(!(TIFR1 & _BV(ICF1)))';
        
        if (software)
          resultCode +=
            ' {\n' +
            '\t\tif(((TIFR1 & _BV(TOV1)) == 0x01) && (startTimestamp < ICR1)) {\n' +
            '\t\t\tTIFR1 |= _BV(TOV1);\n' +
            '\t\t\toverflowCounter++;\n' +
            '\t\t}\n' +
            '\t}\n';
        else
          resultCode += ';\n';
        
        resultCode +=
          '\tendTimestamp = ICR1;\n' +
          '\tsei();\n';
        
        if (software)
          resultCode +=
            '\n\tif (startTimestamp < endTimestamp)\n' +
            '\t\treturn ((uint32_t)overflowCounter << 16) + (endTimestamp - startTimestamp);\n' +
            '\telse\n' +
            '\t\treturn ((uint32_t)overflowCounter << 16) + (65536 - (startTimestamp - endTimestamp));\n';
        else
          resultCode +=
            '\n\tif (startTimestamp < endTimestamp)\n' +
            '\t\treturn endTimestamp - startTimestamp;\n' +
            '\telse\n' +
            '\t\treturn 65536 - (startTimestamp - endTimestamp);\n';
        
        resultCode += '}\n';
      }

      if (mode == 1) {
        resultCode += 
          '\n// this function returns the measured time,\n' +
          '// if a measure is completed, else returns 0\n' +
          'uint32_t calculateTime() {\n' +
          '\tif(newData) {\n' +
          '\t\tnewData = false;\n';

        if (software)
          resultCode +=
            '\n\t\tif (startTimestamp < endTimestamp)\n' +
            '\t\t\treturn ((uint32_t)overflowCounter << 16) + (endTimestamp - startTimestamp);\n' +
            '\t\telse\n' +
            '\t\t\treturn ((uint32_t)overflowCounter << 16) + (65536 - (startTimestamp - endTimestamp));\n';
        else 
          resultCode +=
            '\n\t\tif (startTimestamp < endTimestamp)\n' +
            '\t\t\treturn endTimestamp - startTimestamp;\n' +
            '\t\telse\n' +
            '\t\t\treturn 65536 - (startTimestamp - endTimestamp);\n';

        resultCode +=
          '\t} else\n'+
          '\t\treturn 0;\n'+
          '}\n' +
          '\nISR(TIMER1_CAPT_vect) {\n' +
          '\tTIFR1 |= _BV(ICF1);\n' +
          '\n\tstatic boolean state;\n' +
          '\n\tif (state) {\n' +
          '\t\tendTimestamp = ICR1;\n';

        if (edge == 0)
          resultCode += '\t\tTCCR1B |= _BV(ICES1);\n';
        if (edge == 1)
          resultCode += '\t\tTCCR1B &= ~_BV(ICES1);\n';

        resultCode +=
          '\t\tnewData = true;\n' +
          '\t} else {\n' +
          '\t\tstartTimestamp = ICR1;\n';

        if (edge == 0)
          resultCode += '\t\tTCCR1B &= ~_BV(ICES1);\n';
        if (edge == 1)
          resultCode += '\t\tTCCR1B |= _BV(ICES1);\n';

        if (software)
          resultCode +=
            '\t\tTIMSK1 |= _BV(OCIE1A);\n' +
            '\t\tTIFR1 |= _BV(TOV1);\n';
          
        resultCode +=
          '\t}\n\n' +
          '\tstate = !state;\n' +
          '}\n\n';

        if (software)
          resultCode +=
            'ISR(TIMER1_OVF_vect) {\n' +
            '\tTIFR1 |= _BV(TOV1);\n' +
            '\toverflowCounter++;\n' +
            '}\n';
      }

      this.resultCode = resultCode;
    }
  }
})
