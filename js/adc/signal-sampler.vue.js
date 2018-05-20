
Vue.component('information-boxes', {
  props: [
    'inputData'
  ],
  template: `
    <div class="col-md-6 mt-4 mt-md-0" v-cloak>
      <h4>Additional Information:</h4>
      <div class="col-12 information py-2">
        <h5 class="info-title">Reference Voltage:</h5>
        <p>
          <span v-if="inputData.referenceVoltage == 0">Vcc - supply voltage: uses the supply voltage as reference which is 5 V.<br/></span>
          <span v-if="inputData.referenceVoltage == 1">Bandgap - inner voltage reference: this voltage reference provides a very close voltage to 1.1 V at most temperature.<br/></span>
          <span v-if="inputData.referenceVoltage == 2">AREF - external reference voltage: you can use your own voltage reference connecting it to the AREF pin.<br/></span>
          <span>Note that, if you have a voltage connected to the AREF pin you can't use the other reference options.<br/>You can read more about voltage references <a v-bind:href="datasheet(311)" target="_blank">here</a>.</span>
        </p>
        <h5 class="info-title">Input Channel:</h5>
        <p>
          <span v-if="inputData.inputSource != 6">Analog inputs: use these inputs to measure an external signals voltage or current.<br/></span>
          <span v-if="inputData.inputSource == 6">Inner temperature sensor: this is a built in sensor connected to the ADCs multiplexer unit. You can read more about this sensor <a v-bind:href="datasheet(316)" target="_blank">here</a>.<br/></span>
          <span>You can switch between input channels by modifiing the multiplexers register, however in free running mode it is not advised.<br/>You can read more about input channels <a v-bind:href="datasheet(311)" target="_blank">here</a>.</span>
        </p>
        <h5 class="info-title">Trigger Source:</h5>
        <p>
          <span v-if="inputData.triggerSource == 0">Manual: you have to start a conversation by software every time you want to measure a channel.<br/></span>
          <span v-if="inputData.triggerSource == 1">Free runnung: the ADC will start convesarions after it finish one, untill you stop it by software.<br/></span>
          <span v-if="inputData.triggerSource == 2">Analog comparator: the units interrupt is used as a trigger event for the ADC. You can read more <a v-bind:href="datasheet(299)" target="_blank">here</a>.<br/></span>
          <span v-if="inputData.triggerSource == 3">External interrupt: you can connect your external trigger source on pin 2.<br/></span>
          <span v-if="inputData.triggerSource == 4">Timer 0 - overflow: this case you are able to use the preconfigured timers overflow event as a trigger source.<br/></span>
          <span v-if="inputData.triggerSource == 5">Timer 1 - compare match B: you can configure the frequency by OCR1A in CTC mdoe and set the exact time of the trigger by OCR1B.<br/></span>
          <span v-if="inputData.triggerSource == 6">Timer 1 - overflow: you can configure the timers frequency in CTC mode by OCR1A, an overflow triggers a conversation.<br/></span>
          <span v-if="inputData.triggerSource == 7">Timer 1 - input capture: this trigger source allows you to start convesion based on the signal on ICP1 input at pin 8.<br/></span>
          <span v-if="inputData.triggerSource == 5 || inputData.triggerSource == 6 || inputData.triggerSource == 7">You can read a lot more about Timer 1 and its modes <a v-bind:href="datasheet(149)" target="_blank">here</a>.<br/></span>
          <span>You can read more about trigger sources <a v-bind:href="datasheet(307)" target="_blank">here</a>.</span>
        </p>
        <h5 class="info-title">Justification:</h5>
        <p>
          <span v-if="inputData.leftAdjusted">Left: using this is easier to use the ADC in 8 bit mode, because you only have to read the high byte of the resutl.<br/></span>
          <span v-if="!inputData.leftAdjusted">Right: use this if you want a 10 bit result.<br/></span>
          <span>You can read more about lowering the resoultion in the <a v-bind:href="datasheet(305)" target="_blank">datasheets</a>.</span>
        </p>
      </div>
    </div>
  `,
  methods: {
    datasheet: function (pageNumber){
      return 'http://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-42735-8-bit-AVR-Microcontroller-ATmega328-328P_Datasheet.pdf' + '#page=' + pageNumber;
    }
  }
});

Vue.component('input-field', {
  props: [
    'inputData'
  ],
  template: `
    <div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="referenceVoltage">Reference Voltage:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model="inputData.referenceVoltage" id="referenceVoltage">
            <option v-if="!(inputData.inputSource == 6)" value="0">Vcc - 5 V</option>
            <option value="1">Internal - 1.1 V</option>
            <option v-if="!(inputData.inputSource == 6)" value="2">External</option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="inputSource">Input Channel:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model="inputData.inputSource" v-on:change="setSources()" id="inputSource">
            <option value="0">Analog input 0</option>
            <option value="1">Analog input 1</option>
            <option value="2">Analog input 2</option>
            <option value="3">Analog input 3</option>
            <option value="4">Analog input 4</option>
            <option value="5">Analog input 5</option>
            <option value="6">Temperature Sensor</option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="triggerSource">Trigger Source:</label>
        </div>
        <div class="col-8">
          <select class="form-control" v-model="inputData.triggerSource" id="triggerSource">
            <option value="0">Manual</option>
            <option v-if="!(inputData.inputSource == 6)" disabled>Automatic (interrupt driven):</option>
            <option v-if="!(inputData.inputSource == 6)" value="1">- Free running (on ADC conversion end)</option>
            <option v-if="!(inputData.inputSource == 6)" value="2">- Analog comparator</option>
            <option v-if="!(inputData.inputSource == 6)" value="3">- External interrupt 0</option>
            <option v-if="!(inputData.inputSource == 6)" value="4">- Timer 0 - overflow</option>
            <option v-if="!(inputData.inputSource == 6)" value="5">- Timer 1 - compare match B</option>
            <option v-if="!(inputData.inputSource == 6)" value="6">- Timer 1 - overflow</option>
            <option v-if="!(inputData.inputSource == 6)" value="7">- Timer 1 - capture event</option>
          </select>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-4">
          <label class="label-right col-form-label" for="leftAdjusted">Left Adjusted:</label>
        </div>
        <div class="col-8 form-check">
          <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model="inputData.leftAdjusted" id="leftAdjusted">
        </div>
      </div>
      <div v-if="inputData.triggerSource == 2" v-cloak>
        <h5 class="col-12">Comparator setup:</h5>
        <div class="form-group row">
          <div class="col-4">
              <label class="label-right col-form-label" for="comparatorInterruptMode">Interrupt Mode:</label>
            </div>
            <div class="col-8">
              <select class="form-control" v-model="inputData.comparatorInterruptMode" id="comparatorInterruptMode">
                <option value="0">Toggle</option>
                <option value="1">Falling edge</option>
                <option value="2">Rising edge</option>
                </select>
            </div>
        </div>
        <div class="form-group row">
          <div class="col-4">
            <label class="label-right col-form-label" for="comparatorBandgap">Bandgap:</label>
          </div>
          <div class="col-8 form-check">
            <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model="inputData.comparatorBandgap" id="comparatorBandgap">
          </div>
        </div>
      </div>
      <div v-if="inputData.triggerSource == 5 || inputData.triggerSource == 6" v-cloak>
        <h5 class="col-12">Timer 1 setup:</h5>
        <div class="form-group row">
          <div class="col-4">
            <label class="label-right col-form-label" for="domain">Domain:</label>
          </div>
          <div class="col-8">
            <select class="form-control" v-model="inputData.domain" id="domain">
              <option value="0">Time</option>
              <option value="1">Frequency</option>
            </select>
          </div>
        </div>
        <div id="time" class="form-group row">
          <div class="col-4">
            <label class="label-right col-form-label" v-if="inputData.domain == 0" for="domainValue">Period (us):</label>
            <label class="label-right col-form-label" v-if="inputData.domain == 1" for="domainValue">Frequency (Hz):</label>
          </div>
          <div class="col-8">
            <input type="number" class="form-control" v-model="inputData.domainValue" id="domainValue">
          </div>
        </div>
      </div>
      <div v-if="inputData.triggerSource == 7" v-cloak>
        <h5 class="col-12">Timer 1 setup:</h5>
        <div class="form-group row">
          <div class="col-4">
            <label class="label-right col-form-label" for="resolution">Resolution:</label>
          </div>
          <div class="col-8">
            <select class="form-control" v-model="inputData.resolution" id="resolution">
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
            <label class="label-right col-form-label" for="inputCapture">Capture on rising edge:</label>
          </div>
          <div class="col-8 form-check">
            <input type="checkbox" class="form-check-input position-static label-right mt-3" v-model="inputData.inputCapture" id="inputCapture">
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    setSources: function() {
      if (this.inputData.inputSource == 6) {
        this.inputData.referenceVoltage = 1;
        this.inputData.triggerSource = 0;
      }
    }
  }
});

new Vue({
  el: '#signal-sampler',
  data: {
    inputData: {
      referenceVoltage       : 0,
      inputSource            : 0,
      triggerSource          : 0,
      leftAdjusted           : false,
      comparatorInterruptMode: 0,
      comparatorBandgap      : 0,
      domain                 : 0,
      domainValue            : 0,
      resolution             : 0,
      inputCapture           : 0,
    },
    resultCode             : '',
  },
  methods: {
    getCode: function () {
      // inputs
      var referenceVoltage = this.inputData.referenceVoltage;
      var inputSource = this.inputData.inputSource;
      var triggerSource = this.inputData.triggerSource;
      var leftAdjusted = this.inputData.leftAdjusted;

      //additional inputs if analog comparator involved
      if (triggerSource == 2) {
        var comparatorInterruptMode = this.inputData.comparatorInterruptMode;
        var comparatorBandgap = this.inputData.comparatorBandgap;
      }

      //additional inputs if timer involved, calculations
      else if (triggerSource == 5 || triggerSource == 6) {
        // input process
        if (this.inputData.domain == 0)
          var period = this.inputData.domainValue;
        else
          var period = 1 / this.inputData.domainValue * 1000000;

        // calculate optimal resolution for Timer 1
        var resolution = 0;
        if (period <= 65535 * 0.0625)
          resolution = 0.0625;
        else if (period <= 65535 * 0.5)
          resolution = 0.5;
        else if (period <= 65535 * 4)
          resolution = 4;
        else if (period <= 65535 * 16)
          resolution = 16;
        else
          resolution = 64;

        // calculate register value
        var timerRegisterValue = Math.round(period / resolution) - 1;

        if (timerRegisterValue > 65535 || (timerRegisterValue * resolution < 104)) {
          this.resultCode = '// Frequency or period is out of range!\n';
          return;
        }
      }

      // set Timer 1 resolution, and capture edge
      else if (triggerSource == 7) {
        var resolution = this.inputData.resolution;
        var inputCapture = this.inputData.inputCapture;
      }

      var resultCode = '#include "Arduino.h"\n';

      if (triggerSource == 5 || triggerSource == 6 || triggerSource == 7) {
        resultCode +=
          '\n/*\n' +
          ' * This application configures Timer 1,\n' +
          ' * so you won\'t be able to use the Servo library\n' +
          ' * nor the analogWrite() function on pins 9 and 10\n' +
          ' */\n';
      }

      resultCode +=
        '\nvoid setup() {\n' +
        '\tcli();\n' +
        '\n\t// Disable power reduction on ADC\n' +
        '\tPRR &= ~_BV(PRADC);\n';

      if (triggerSource == 7)
        resultCode += '\n\tpinMode(8, INPUT);\n';
      
      resultCode += '\n\t// Set reference voltage\n';

      if (referenceVoltage == 0)
        resultCode += '\tADMUX = _BV(REFS0);\n'
      else if(referenceVoltage == 1)
        resultCode += '\tADMUX = _BV(REFS1) & _BV(REFS0);\n'
      else if(referenceVoltage == 2)
        resultCode += '\tADMUX = 0x00;\n'

      if (leftAdjusted)
        resultCode += 
          '\n\t// Left adjusted result\n' +
          '\tADMUX |= _BV(ADLAR);\n';

      if (inputSource != 0) {
        resultCode += '\n\t// Select input source\n';

        if (inputSource == 1)
          resultCode += '\tADMUX |= _BV(MUX0);\n';
        else if (inputSource == 2)
          resultCode += '\tADMUX |= _BV(MUX1);\n';
        else if (inputSource == 3)
          resultCode += '\tADMUX |= _BV(MUX1) & _BV(MUX0);\n';
        else if (inputSource == 4)
          resultCode += '\tADMUX |= _BV(MUX2);\n';
        else if (inputSource == 5)
          resultCode += '\tADMUX |= _BV(MUX2) & _BV(MUX0);\n';
        else
          resultCode += '\tADMUX |= _BV(MUX3);\n';
      }

      resultCode +=
        '\n\t// Sets the prescaler /128 assuming a 16MHz core, so the ADC will get 125kHz\n' +
        '\tADCSRA = _BV(ADPS2) & _BV(ADPS1) & _BV(ADPS0);\n';

      resultCode += '\n\t// Trigger source setup\n';

      if (triggerSource == 0)
        resultCode += '\tADCSRB = 0x00;\n';
      else {
        resultCode += '\tADCSRA |= _BV(ADIE) | _BV(ADATE);\n';

        if (triggerSource == 1)
          resultCode += '\tADCSRB = 0x00;\n';
        else if (triggerSource == 2)
          resultCode += '\tADCSRB = _BV(ADTS0);\n';
        else if (triggerSource == 3)
          resultCode += '\tADCSRB = _BV(ADTS1);\n';
        else if (triggerSource == 4)
          resultCode += '\tADCSRB = _BV(ADTS2);\n';
        else if (triggerSource == 5)
          resultCode += '\tADCSRB = _BV(ADTS2) & _BV(ADTS0);\n';
        else if (triggerSource == 6)
          resultCode += '\tADCSRB = _BV(ADTS2) & _BV(ADTS1);\n';
        else if (triggerSource == 7)
          resultCode += '\tADCSRB = _BV(ADTS2) & _BV(ADTS1) & _BV(ADTS0);\n';
      }

      if (triggerSource == 2) {
        resultCode +=
          '\n\t// Analog comparator setup\n' +
          '\tACSR = 0x00;\n';

        if (comparatorBandgap)
          resultCode +=
            '\t// Bandgap compare reference\n' +
            '\tACSR |= _BV(ACBG);\n';

        if (comparatorInterruptMode != 0) {
          resultCode += '\t// Interrupt Mode\n';

          if (comparatorInterruptMode == 1)
            resultCode += '\tACSR |= _BV(ACIS1);\n';
          else
            resultCode += '\t_BV(ACIS1) & _BV(ACIS0);\n';
        }
      }
      else if (triggerSource == 5 || triggerSource == 6 || triggerSource == 7) {
        resultCode +=
          '\n\t// Timer 1 setup\n'
          '\t// This will affect Timer1, which is used by the Servo library\n';

        if (triggerSource == 5 || triggerSource == 6) {
          resultCode +=
            '\t// Set to CTC mode\n' +
            '\tTCCR1A = 0x00;\n' +
            '\tTCCR1B = _BV(WGM12);\n' +
            '\t// Set the prescaler value\n';

          if (resolution == 0.0625)
            resultCode += '\tTCCR1B |= _BV(CS10);\n';
          else if (resolution == 0.5)
            resultCode += '\tTCCR1B |= _BV(CS11);\n';
          else if (resolution == 4)
            resultCode += '\tTCCR1B |= _BV(CS11) & _BV(CS10);\n';
          else if (resolution == 16)
            resultCode += '\tTCCR1B |= _BV(CS12);\n';
          else if (resolution == 64)
            resultCode += '\tTCCR1B |= _BV(CS12) & _BV(CS10);\n';

          resultCode +=
            '\tTCCR1C = 0x00;\n' +
            '\t// Set OCR1A\n' +
            '\tOCR1A = 0x' + timerRegisterValue.toString(16) + ';\n';
        }
        else if (triggerSource == 7) {
          resultCode +=
            '\t// Set to normal mode' +
            '\tTCCR1A = 0x00;\n' +
            '\t// Set the prescaler value\n';

          if (resolution == 0)
            resultCode += '\tTCCR1B = _BV(CS10);\n';
          else if (resolution == 1)
            resultCode += '\tTCCR1B = _BV(CS11);\n';
          else if (resolution == 2)
            resultCode += '\tTCCR1B = _BV(CS11) | _BV(CS10);\n';
          else if (resolution == 3)
            resultCode += '\tTCCR1B = _BV(CS12);\n';
          else
            resultCode += '\tTCCR1B = _BV(CS12) | _BV(CS10);\n';

          if (inputCapture)
            resultCode += '\tTCCR1B |= _BV(ICES1);\n';

          resultCode +=
            '\tTCCR1C = 0x00;\n' +
            '\t// Enable input capture interrupt\n' +
            '\tTIMSK1 = _BV(ICIE1);\n';
        }
      }

      resultCode +=
        '\n\tsei();\n' +
        '}\n';

      if (triggerSource == 0)
        resultCode += '\nfloat result = 0;\n';
      else
        resultCode +=
          '\nvolatile boolean stopADC = false;\n' +
          'volatile float result = 0;\n' +
          'volatile boolean conversationEnded = false;\n';

      if (triggerSource == 7)
        resultCode +=
          '\nvolatile uint16_t inputCaptureReqister = 0;\n' +
          'volatile boolean converting = 0;\n';

      resultCode += '\nvoid loop() {\n';

      if (triggerSource == 0)
        resultCode +=
          '\t// Manual conversion functions\n' +
          '\t// startConversion();\n';
      else
        resultCode +=
          '\t// Trigger driven conversion functions\n' +
          '\t// startConversions();\n' +
          '\t// stopConversions();\n';

      resultCode +=
        '\t// isConverted();\n' +
        '\t// getConvertedValue();\n';

      if (triggerSource == 5 || triggerSource == 6) {
        resultCode += '\n\t// setOutCmpReg1A(value);\n';
        if (triggerSource == 5)
          resultCode += '\t// setOutCmpReg1B(value);\n';
      }
      else if (triggerSource == 7)
        resultCode += '\n\t// setInputCaptureEdge(true);\n';

      resultCode += '}\n';

      if (triggerSource == 0)
        resultCode += 
          '\nvoid startConversion() {\n' +
          '\tADCSRA |= _BV(ADSC);\n' +
          '}\n';
      else
        resultCode +=
          '\nvoid startConversions() {\n' +
          '\tstopADC = false;\n' +
          '\tADCSRA |= _BV(ADSC);\n' +
          '}\n' +
          '\nvoid stopConversions() {\n' +
          '\tstopADC = true;\n' +
          '}\n'

      resultCode += '\nboolean isConverted() {\n';

      if (triggerSource == 0)
        resultCode +=
          '\tif (!(ADCSRA & _BV(ADSC))) {\n' +
          '\t\tresult = ADC;\n' +
          '\t\treturn true;\n' +
          '\t}\n' +
          '\treturn false;\n';
      
      else
        resultCode += '\treturn conversationEnded;\n';

      resultCode +=
        '}\n' +
        '\nfloat getConvertedValue() {\n';

      if (referenceVoltage == 0)
        resultCode += '\treturn result * 5 / 1024;\n';
      else if(referenceVoltage == 1)
        resultCode += '\treturn result * 1.1 / 1024;\n';
      else
        resultCode += '\t// return result * YOUR_REFERENCE_VOLTAGE / 1024;\n';

      if (triggerSource != 0)
        resultCode += '\tconversationEnded = false;\n';

      resultCode += '}\n';

      if (triggerSource != 0){
        resultCode += '\nISR(ADC_vect) {\n';

        if (triggerSource == 7)
          resultCode += '\tprocessing = false;\n';

        resultCode +=
          '\tresult = ADC;\n' +
          '\tconversationEnded = true;\n' +
          '\tif (stopADC)\n' +
          '\t\tADCSRA &= ~_BV(ADSC);\n' +
          '}\n';

        if (triggerSource == 5 || triggerSource == 6) {
          resultCode +=
            '\nvoid setOutCmpReg1A(uint16_t value) {\n' +
            '\tOCR1A = value;\n' +
            '}\n';

          if (triggerSource == 5)
            resultCode +=
              '\nvoid setOutCmpReg1B(uint16_t value) {\n' +
              '\tOCR1B = value;\n' +
              '}\n';
        }
        else if (triggerSource == 7)
          resultCode +=
            '\nvoid setInputCaptureEdge(boolean positiveEdge) {\n' +
            '\tif (positiveEdge);\n' +
            '\t\tTCCR1B |= _BV(ICES1);\n' +
            '\telse\n' +
            '\t\tTCCR1B &= ~_BV(ICES1);\n' +
            '}\n' +
            '\nISR(TIMER1_CAPT_vect) {\n' +
            '\tif (!processing) {\n' +
            '\t\tconverting = true;\n' +
            '\t\tinputCaptureReqister = ICR;\n' +
            '\t}\n' +
            '}\n';
      }

      this.resultCode = resultCode;
    }
  }
});
