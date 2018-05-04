new Vue({
  el: '#signal-sampler',
  data: {
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
    resultCode             : ''
  },
  methods: {
    getCode: function () {
      // inputs
      var referenceVoltage = this.referenceVoltage;
      var inputSource = this.inputSource;
      var triggerSource = this.triggerSource;
      var leftAdjusted = this.leftAdjusted;

      //additional inputs if analog comparator involved
      if (triggerSource == 2) {
        var comparatorInterruptMode = this.comparatorInterruptMode;
        var comparatorBandgap = this.comparatorBandgap;
      }

      //additional inputs if timer involved, calculations
      else if (triggerSource == 4 || triggerSource == 5 || triggerSource == 6 || triggerSource == 7) {
        // input process
        if (domain == 0)
          var period = this.domainValue;
        else
          var period = this.domainValue * 1000000;

        // Timer 0
        if (triggerSource == 4 || triggerSource == 5) {
          // calculate optimal resolution
          var resolution = 0;
          if (period <= 256 * 0.0625)
            resolution = 0.0625;
          else if (period <= 256 * 0.5)
            resolution = 0.5;
          else if (period <= 256 * 4)
            resolution = 4;
          else if (period <= 256 * 16)
            resolution = 16;
          else
            resolution = 64;

          // calculate register value
          var timerRegisterValue = Math.round(period / resolution) - 1;

          if (timerRegisterValue > 255) {
            this.resultCode = '// Frequency or period is out of range!\n';
            return;
          }
        }
        // Timer 1
        else if (triggerSource == 6 || triggerSource == 7) {
          // calculate optimal resolution
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

          if (timerRegisterValue > 65535) {
            this.resultCode = '// Frequency or period is out of range!\n';
            return;
          }
        }
      } else if (triggerSource == 8) {
        var resolution = this.resolution;
        var inputCapture = this.inputCapture;
      }

      var resultCode =
        '#include "Arduino.h"\n' +
        '\nvoid setup() {\n' +
        '\tcli();\n' +
        '\n\t// Disable power reduction on ADC\n' +
        '\tPRR &= ~_BV(PRADC);\n';

      if (triggerSource == 8)
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
          resultCode += '\tADMUX |= _BV(MUX1) & _BV(MUX0)\n';
        else if (inputSource == 4)
          resultCode += '\tADMUX |= _BV(MUX2);\n';
        else if (inputSource == 5)
          resultCode += '\tADMUX |= _BV(MUX2) & _BV(MUX0)\n';
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
          resultCode += '\tADCSRB = _BV(ADTS1) & _BV(ADTS0);\n';
        else if (triggerSource == 5)
          resultCode += '\tADCSRB = _BV(ADTS2);\n';
        else if (triggerSource == 6)
          resultCode += '\tADCSRB = _BV(ADTS2) & _BV(ADTS0);\n';
        else if (triggerSource == 7)
          resultCode += '\tADCSRB = _BV(ADTS2) & _BV(ADTS1);\n';
        else if (triggerSource == 8)
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
      else if (triggerSource == 4 || triggerSource == 5) {
        resultCode +=
          '\n\t// Timer 0 setup\n' +
          '\t// This will affect Timer0, which is used by some Arduino functions\n' +
          '\t// Set to CTC mode\n' +
          '\tTCCR0A = _BV(WGM01);\n' +
          '\t// Set the prescaler value\n';

        if (resolution == 0.0625)
          resultCode += '\tTCCR0B = _BV(CS00);\n';
        else if (resolution == 0.5)
          resultCode += '\tTCCR0B = _BV(CS01);\n';
        else if (resolution == 4)
          resultCode += '\tTCCR0B = _BV(CS01) & _BV(CS00);\n';
        else if (resolution == 16)
          resultCode += '\tTCCR0B = _BV(CS02);\n';
        else if (resolution == 64)
          resultCode += '\tTCCR0B = _BV(CS02) & _BV(CS00);\n';

        resultCode +=
          '\n\t// Set OCR0A\n' +
          '\tOCR0A = 0x' + timerRegisterValue.toString(16) +';\n';
      }
      else if (triggerSource == 6 || triggerSource == 7 || triggerSource == 8) {
        resultCode +=
          '\n\t// Timer 1 setup\n'
          '\t// This will affect Timer1, which is used by the Servo library\n';

        if (triggerSource == 6 || triggerSource == 7) {
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
        else if (triggerSource == 8) {
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

      if (triggerSource != 0)
        resultCode +=
          '\nvolatile boolean stopADC = false;\n' +
          'volatile float result = 0;\n';

      if (triggerSource == 8)
        resultCode +=
          '\nvolatile uint16_t inputCaptureReqister = 0;\n' +
          'volatile boolean converting = 0;\n';

      resultCode += '\nvoid loop() {\n';

      if (triggerSource == 0)
        resultCode +=
          '\t// Manual conversion functions\n' +
          '\t// startConversion();\n' +
          '\t// isConverted();\n' +
          '\t// getConvertedValue();\n';
      else {
        resultCode +=
          '\t// Trigger driven conversion functions\n' +
          '\t// startConversions();\n' +
          '\t// stopConversions();\n';

        if (triggerSource == 4 || triggerSource == 5)
          resultCode += '\n\t// setOutCmpReg0A(value);\n';
        else if (triggerSource == 6 || triggerSource == 7) {
          resultCode += '\n\t// setOutCmpReg1A(value);\n';
          if (triggerSource == 6)
            resultCode += '\t// setOutCmpReg1B(value);\n';
        }
        else if (triggerSource == 8)
          resultCode += '\n\t// setInputCaptureEdge(true);\n';
      }

      resultCode += '}\n';

      if (triggerSource == 0) {
        resultCode += 
          '\nvoid startConversion() {\n' +
          '\tADCSRA |= _BV(ADSC);\n' +
          '}\n' +
          '\nboolean isConverted() {\n' +
          '\treturn !(ADCSRA & _BV(ADSC));\n' +
          '}\n' +
          '\nfloat getConvertedValue() {\n';

        if (referenceVoltage == 0)
          resultCode += '\treturn ADC * 5 / 1024;\n';
        else if(referenceVoltage == 1)
          resultCode += '\treturn ADC * 1.1 / 1024;\n';
        else
          resultCode += '\t// return ADC * YOUR_REFERENCE_VOLTAGE / 1024;\n';
        resultCode += '}\n'
      }
      else {
        resultCode +=
          '\nvoid startConversions() {\n' +
          '\tstopADC = false;\n' +
          '\tADCSRA |= _BV(ADSC);\n' +
          '}\n' +
          '\nvoid stopConversions() {\n' +
          '\tstopADC = true;\n' +
          '}\n' +
          '\nISR(ADC_vect) {\n';

        if (triggerSource == 8)
          resultCode += '\tprocessing = false;\n';

        if (referenceVoltage == 0)
          resultCode += '\tresult = ADC * 5 / 1024;\n';
        else if (referenceVoltage == 1)
          resultCode += '\tresult = ADC * 1.1 / 1024;\n';
        else
          resultCode += '\t// result = ADC * YOUR_REFERENCE_VOLTAGE / 1024;\n';

        resultCode +=
          '\tif (stopADC)\n' +
          '\t\tADCSRA &= ~_BV(ADSC);\n' +
          '}\n';

        if (triggerSource == 4 || triggerSource == 5)
          resultCode +=
              '\nvoid setOutCmpReg0A(uint16_t value) {\n' +
              '\tOCR0A = value;\n' +
              '}\n';
        else if (triggerSource == 6 || triggerSource == 7) {
          resultCode +=
            '\nvoid setOutCmpReg1A(uint16_t value) {\n' +
            '\tOCR1A = value;\n' +
            '}\n';

          if (triggerSource == 6)
            resultCode +=
              '\nvoid setOutCmpReg1B(uint16_t value) {\n' +
              '\tOCR1B = value;\n' +
              '}\n';
        }
        else if (triggerSource == 8)
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
})
