function getTimeMeasureCode() {
    var mode = document.getElementById('mode').value;
    var resolution = document.getElementById('resolution').value;
    var edge = document.getElementById('edge').value;
    var pin = document.getElementById('pin').value;
    var software = document.getElementById('software').checked;

    var resultCode = '#include "Arduino.h"\n';

    if (mode === 'polling')
        resultCode += '\nuint16_t startTimestamp;\n' +
                        'uint16_t endTimestamp;\n';

    if (mode === 'interrupt') {
        resultCode += '\nvolatile uint16_t startTimestamp;\n' +
                        'volatile uint16_t endTimestamp;\n' +
                        'volatile boolean newData;\n';
        if (software)
            resultCode += 'volatile uint16_t overflowCounter = 0;\n' + 
                            'uint32_t result;\n';
        else
            resultCode += 'uint16_t result;\n';
    }

    resultCode += '\nvoid setup() {\n' +
                    '\tcli();\n';
                    
    if (pin === 'ICP1')
        resultCode += '\n\tpinMode(8, INPUT);\n'
    else
        resultCode += '\n\tACSR  = _BV(ACBG) | _BV(ACIC);\n' +
                        '\tTIFR1 = _BV(ICF1);\n';

    if (pin === 'AIN1')
        resultCode += '\tpinMode(7, INPUT);\n';

    if (pin !== 'ICP1' && pin !== 'AIN1') {
        resultCode += '\tADCSRA &= ~_BV(ADEN);\n' +
                        '\tADCSRB |=  _BV(ACME);\n';
        switch (pin) {
            case 'ADC1':
                resultCode += '\n';
                break;
            case 'ADC1':
                resultCode += '\tADMUX = _BV(MUX0);\n';
                break;
            case 'ADC2':
                resultCode += '\tADMUX = _BV(MUX1);\n';
                break;
            case 'ADC3':
                resultCode += '\tADMUX = _BV(MUX1) | _BV(MUX0);\n';
                break;
            case 'ADC4':
                resultCode += '\tADMUX = _BV(MUX2);\n';
                break;
            case 'ADC5':
                resultCode += '\tADMUX = _BV(MUX2) | _BV(MUX0)\n';
                break;
        }
    }
        
    resultCode += '\n\tTCCR1A = 0x00;\n'
        + '\tTCCR1B = ';

    if (edge === 'period_up')
        resultCode += '_BV(ICES1) | ';

    switch (resolution) {
        case '0.0625 us':
            resultCode += '_BV(CS10);\n';
            break;
        case '0.5 us':
            resultCode += '_BV(CS11);\n';
            break;
        case '4 us':
            resultCode += '_BV(CS11) | _BV(CS10);\n';
            break;
        case '16 us':
            resultCode += '_BV(CS12);\n';
            break;
        case '64 us':
            resultCode += '_BV(CS12) | _BV(CS10);\n';
            break;
    }

    resultCode += '\tTCCR1C = 0x00;\n';

    if (mode === 'interrupt') {
        if (pin === 'ICP1')
            resultCode += '\n\tTIFR1 |= _BV(ICF1);\n'
                + '\tTIMSK1 = _BV(ICIE1);\n';
        else
            resultCode += '\n\tTIMSK1 = _BV(ICIE1);\n';
    }

    resultCode += '\n\tsei();\n' +
                    '}\n' +
                    '\nvoid loop() {\n';

    if (mode === 'polling')
        resultCode += '\tmeasureTime();\n';

    if (mode === 'interrupt') {
        resultCode += '\tif(newData) {\n' +
                        '\t\tnewData = false;\n';
        if (software)
            resultCode += '\n\t\tif (startTimestamp < endTimestamp)\n' +
                            '\t\t\tresult = ((uint32_t)overflowCounter << 16) + (endTimestamp - startTimestamp);\n' +
                            '\t\telse\n' +
                            '\t\t\tresult = ((uint32_t)overflowCounter << 16) + (65536 - (startTimestamp - endTimestamp));\n';
        else 
            resultCode += '\n\t\tif (startTimestamp < endTimestamp)\n' +
                            '\t\t\tresult = endTimestamp - startTimestamp;\n' +
                            '\t\telse\n' +
                            '\t\t\tresult = 65536 - (startTimestamp - endTimestamp);\n';
            
        resultCode += '\t}\n';
    }

    resultCode += '}\n';
                    
    if (mode === 'polling') {
        if (software)
            resultCode += '\nuint32_t measureTime() {\n';
        else
            resultCode += '\nuint16_t measureTime() {\n';
        
        resultCode += '\tcli();\n';
        
        if (edge === 'high')
            resultCode += '\tTCCR1B |= _BV(ICES1);\n';
        if (edge === 'low')
            resultCode += '\tTCCR1B &= ~_BV(ICES1);\n';
        
        resultCode += '\twhile(!(TIFR1 & _BV(ICF1)));\n' +
                        '\tstartTimestamp = ICR1;\n';
                        
        if (edge === 'high')
            resultCode += '\n\tTCCR1B &= ~_BV(ICES1);\n';
        if (edge === 'low')
            resultCode += '\n\tTCCR1B |= _BV(ICES1);\n';
        
        resultCode += '\tTIFR1 |= _BV(ICF1)'
        
        if (software)
            resultCode += ' | _BV(TOV1);\n';
        else
            resultCode += ';\n';
        
        resultCode += '\twhile(!(TIFR1 & _BV(ICF1)))';
        
        if (software)
            resultCode += ' {\n' +
                            '\t\tif(((TIFR1 & _BV(TOV1)) == 0x01) && (startTimestamp < ICR1)) {\n' +
                            '\t\t\tTIFR1 |= _BV(TOV1);\n' +
                            '\t\t\toverflowCounter++;\n' +
                            '\t\t}\n' +
                            '\t}\n';
        else
            resultCode += ';\n';
        
        resultCode += '\tendTimestamp = ICR1;\n' +
                        '\tsei();\n';
        
        if (software)
            resultCode += '\n\tif (startTimestamp < endTimestamp)\n' +
                            '\t\treturn ((uint32_t)overflowCounter << 16) + (endTimestamp - startTimestamp);\n' +
                            '\telse\n' +
                            '\t\treturn ((uint32_t)overflowCounter << 16) + (65536 - (startTimestamp - endTimestamp));\n';
        else
            resultCode += '\n\tif (startTimestamp < endTimestamp)\n' +
                            '\t\treturn endTimestamp - startTimestamp;\n' +
                            '\telse\n' +
                            '\t\treturn 65536 - (startTimestamp - endTimestamp);\n';
        
        resultCode += '}\n';
    }

    if (mode === 'interrupt') {
        resultCode += '\nISR(TIMER1_CAPT_vect) {\n' +
                        '\tTIFR1 |= _BV(ICF1);\n' +
                        '\n\tstatic boolean state;\n' +
                        '\n\tif (state) {\n' +
                        '\t\tendTimestamp = ICR1;\n';
        
        if (edge === 'high')
            resultCode += '\t\tTCCR1B |= _BV(ICES1);\n';
        if (edge === 'low')
            resultCode += '\t\tTCCR1B &= ~_BV(ICES1);\n';
        
        resultCode += '\t\tnewData = true;\n' +
                        '\t} else {\n' +
                        '\t\tstartTimestamp = ICR1;\n';
                        
        if (edge === 'high')
            resultCode += '\t\tTCCR1B &= ~_BV(ICES1);\n';
        if (edge === 'low')
            resultCode += '\t\tTCCR1B |= _BV(ICES1);\n';
        
        if (software)
            resultCode += '\t\tTIMSK1 |= _BV(OCIE1A);\n' +
                            '\t\tTIFR1 |= _BV(TOV1);\n';
        
        resultCode += '\t}\n\n' +
                        '\tstate = !state;\n' +
                        '}\n\n';
                        
        if (software)
            resultCode += 'ISR(TIMER1_OVF_vect) {\n' +
                            '\tTIFR1 |= _BV(TOV1);\n' +
                            '\toverflowCounter++;\n' +
                            '}\n';
    }

    document.getElementById('result').value = resultCode;
}

function getPeriodicEventCode() {
    // inputs
    if (document.getElementById('domainSelector').value === 'Time')
        var period = document.getElementById('domainSelected').value;
    else
        var period = 1 / document.getElementById('domainSelected').value * 1000000;

    // variables
    var resolution;
    var software = false;
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
        software = period > 65536 * resolution;
    }

    if (software) {
        var neededRegisterValue = Math.round(period / resolution);
        var overflowCount = Math.ceil(neededRegisterValue / 65536);
        var registerValue = Math.round(neededRegisterValue / overflowCount);
        var error = -(neededRegisterValue - overflowCount * registerValue);
        var relativeError = error / neededRegisterValue * 100;
    } else
        registerValue = Math.round(period / resolution);

    /*var resultCode = 'Required period: ' + period + ' us\n'
        + 'Selected resolution: ' + resolution + '\n'
        + 'Need software extension: ' + software + '\n';
    if (software)
        resultCode += 'Needed register value: ' + neededRegisterValue + '\n'
            + 'Provided register value: ' + (overflowCount * registerValue) + '\n'
            + 'Error: ' + error + ' %';*/
            
    var resultCode = '#include "Arduino.h"\n';
        
    if (software)
        resultCode += '\nuint16_t overflowCounter = 0;\n'
            + 'uint16_t overflowCount = ' + overflowCount + ';\n'
        
    resultCode += '\nvoid setup() {\n'
        + '\tcli();\n'
        + '\n\tTCCR1A = 0x00;\n'
        + '\tTCCR1B = _BV(WGM12);\n'
        + '\tTCCR1B |= ';
        
    switch (resolution) {
        case (0.0625):
            resultCode += '_BV(CS10);\n';
            break;
        case (0.5):
            resultCode += '_BV(CS11);\n';
            break;
        case (4):
            resultCode += '_BV(CS11) | _BV(CS10);\n';
            break;
        case (16):
            resultCode += '_BV(CS12);\n';
            break;
        case (64):
            resultCode += '_BV(CS12) | _BV(CS10);\n';
            break;
    }
        
    resultCode += '\tTCCR1C = 0x00;\n'
        + '\n\tTIMSK1 = _BV(OCIE1A);\n'
        + '\tTIFR1 |= _BV(OCF1A);\n'
        + '\n\tTCNT1 = 0x0000;\n';

    if (software)
        resultCode += '\n\t// error: ' + error * resolution + ' us, relative error: ' + relativeError + ' %\n'
            + '\tOCR1A = 0x' + registerValue.toString(16) + ';\n';
    else
        resultCode += '\n\tOCR1A = 0x' + registerValue.toString(16) + ';\n';
            
    resultCode += '\n\tsei();\n'
        + '}\n'
        + '\nvoid loop() {\n'
        + '\t //\n'
        + '}\n'
        + '\nISR(TIMER1_COMPA_vect) {\n';

    if (software)
        resultCode += '\toverflowCounter++;\n'
            + '\tif (overflowCounter == overflowCount) {\n'
            + '\t\toverflowCounter = 0;\n'
            + '\n\t\t// Place your code here.\n'
            + '\t}\n'
    else
        resultCode += '\t// Place your code here.\n'
        
    resultCode +='}\n';

    document.getElementById('result').value = resultCode;
}

function getClockGenerationCode() {
    // inputs
    var frequency = document.getElementById('frequency').value;
    var offsetB   = document.getElementById('offsetB').value;
    var activeA   = document.getElementById('activeA').checked;
    var activeB   = document.getElementById('activeB').checked;

    if(offsetB > 180 || offsetB < 0) {
        document.getElementById('result').value = '// Offset is out of range!\n';
        return;
    }

    var halfPeriod = 1 / (2 * frequency) * 1000000;
    if (halfPeriod < 0.0625 || halfPeriod > 64 * 65535) {
        document.getElementById('result').value = '// Frequency is out of range!\n';
        return;
    }
    var resolution = 0;
    if (halfPeriod <= 0.0625 * 65536) 
        resolution = 0.0625;
    else if (halfPeriod <= 0.5 * 65536)
        resolution = 0.5;
    else if (halfPeriod <= 4 * 65536)
        resolution = 4;
    else if (halfPeriod <= 16 * 65536)
        resolution = 16;
    else {
        resolution = 64;
    }
    var frequencyRegisterValue = Math.round(halfPeriod / resolution);

    var offsetRegisterValue = Math.round(Math.abs(180 - offsetB) / 180 * frequencyRegisterValue);


    var resultCode = '#include "Arduino.h"\n'
        + '\nvoid setup() {\n'
        + '\tcli();\n'
        + '\n\tTCCR1A = ';

    if (!activeA && !activeB)
        resultCode += '0x00;\n';
    else if (activeA && !activeB)
        resultCode += '_BV(COM1A0);\n';
    else if (!activeA && activeB)
        resultCode += '_BV(COM1B0);\n';
    else
        resultCode += '_BV(COM1A0) | _BV(COM1B0);\n';

    resultCode += '\tTCCR1B = _BV(WGM12);\n'
        + '\tTCCR1B |= ';
        
    switch (resolution) {
        case (0.0625):
            resultCode += '_BV(CS10);\n';
            break;
        case (0.5):
            resultCode += '_BV(CS11);\n';
            break;
        case (4):
            resultCode += '_BV(CS11) | _BV(CS10);\n';
            break;
        case (16):
            resultCode += '_BV(CS12);\n';
            break;
        case (64):
            resultCode += '_BV(CS12) | _BV(CS10);\n';
            break;
    }
        
    resultCode += '\tTCCR1C = 0x00;\n'
        + '\n\tTCNT1 = 0x0000;\n'
        + '\n\tOCR1A = 0x' + frequencyRegisterValue.toString(16) + ';\n'
        + '\tOCR1B = 0x' + offsetRegisterValue.toString(16) + ';\n';
            
    resultCode += '\n\tsei();\n'
        + '}\n'
        + '\nvoid loop() {\n'
        + '\t //\n'
        + '}\n';

    /* var resultCode = 'Frequency: ' + frequency + ' Hz\n'
        + "Output B's offset: " + offsetB + ' °\n'
        + 'Output A active: ' + activeA + '\n'
        + 'Output B active: ' + activeB + '\n'
        + '\nResolution: ' + resolution + ' us\n'
        + 'Register value: ' + frequencyRegister + '\n'
        + '\nOffset register value: ' + offsetRegister + '\n'; */

    document.getElementById('result').value = resultCode;
}

function getPwmCode() {
    // variables
    var pwmMode = document.getElementById('usage').value;
    var frequency = document.getElementById('frequency').value;
    if (frequency == 15 || frequency == 16) {
        var customFrequency = document.getElementById('customFrequency').value;
        if(!customFrequency) {
            document.getElementById('result').value = '// Specify a custom frequency!';
            return;
        }
    }
    if (frequency != 15) {
        var activeA = document.getElementById('activeA').checked;
        var invertedA = document.getElementById('invertedA').checked;
    }
    var activeB = document.getElementById('activeB').checked;
    var invertedB = document.getElementById('invertedB').checked;

    if (frequency == 'Choose a frequency!') {
        document.getElementById('result').value = '// Choose a frequency!';
        return;
    }

    // calculations
    if (customFrequency) {
        var period = 1000000 / customFrequency;
        if (period < 0.0625 * 4 || period > 64 * 65536) {
            document.getElementById('result').value = '// Frequency is out of range!\n';
            return;
        }
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
        var frequencyRegisterValue = Math.round(period / resolution) - 1;
    }

    var maxRegisterValue = 0;
    if (frequency < 5)
        maxRegisterValue = 255;
    else if (frequency < 10)
        maxRegisterValue = 511;
    else if (frequency < 15)
        maxRegisterValue = 1023;
    else
        maxRegisterValue = frequencyRegisterValue;

    // code assemble
    var resultCode = '#include "Arduino.h"\n'
        + '\nvoid setup() {\n'
        + '\tcli();\n'
        + '\n\t// PWM mode\n';

    switch (pwmMode) {
        case '0':
            if (frequency < 5) {
                resultCode += '\tTCCR1A = _BV(WGM10);\n'
                    + '\tTCCR1B = _BV(WGM12);\n';
            } else if (frequency >= 5 && frequency < 10) {
                resultCode += '\tTCCR1A = _BV(WGM11);\n'
                    + '\tTCCR1B = _BV(WGM12);\n';
            } else if (frequency >= 10 && frequency < 15) {
                resultCode += '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n'
                    + '\tTCCR1B = _BV(WGM12);\n';
            } else if (frequency == 15) {
                resultCode += '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n'
                    + '\tTCCR1B = _BV(WGM13) | _BV(WGM12);\n';
            } else {
                resultCode += '\tTCCR1A = _BV(WGM11);\n'
                    + '\tTCCR1B = _BV(WGM13) | _BV(WGM12);\n';
            }
            break;
        case '1':
            if (frequency < 5) {
                resultCode += '\tTCCR1A = _BV(WGM10);\n'
                    + '\tTCCR1B = 0x00;\n';
            } else if (frequency >= 5 && frequency < 10) {
                resultCode += '\tTCCR1A = _BV(WGM11);\n'
                    + '\tTCCR1B = 0x00;\n';
            } else if (frequency >= 10 && frequency < 15) {
                resultCode += '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n'
                    + '\tTCCR1B = 0x00;\n';
            } else if (frequency == 15) {
                resultCode += '\tTCCR1A = _BV(WGM11);\n'
                    + '\tTCCR1B = _BV(WGM13);\n';
            } else {
                resultCode += '\tTCCR1A = _BV(WGM11) | _BV(WGM10);\n'
                    + '\tTCCR1B = _BV(WGM13);\n';
            }
            break;
        case '2':
            if (frequency == 15) {
                resultCode += '\tTCCR1A = 0x00;\n'
                    + '\tTCCR1B = _BV(WGM13);\n';
            } else {
                resultCode += '\tTCCR1A = _BV(WGM10);\n'
                    + '\tTCCR1B = _BV(WGM13);\n';
            }
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
        resultCode += '\n\t// Custom frequency\n'
            + '\tOCR1A = 0x' + frequencyRegisterValue.toString(16) + ';\n';
    else if (frequency == 16)
        resultCode += '\n\t// Custom frequency\n'
            + '\tICR1 = 0x' + frequencyRegisterValue.toString(16) + ';\n';
            
    resultCode += '\n\tsei();\n'
        + '}\n'
        + '\nvoid loop() {\n'
        + '\t// setOutCmpRegA(value);\n'
        + '\t// setOutCmpRegB(value);\n'
        + '\t// setOutADutyCycle(value);\n'
        + '\t// setOutBDutyCycle(value);\n'
        + '}\n'
        + '\n// value between 0 and ' + maxRegisterValue + ' inclusively\n'
        + 'void setOutCmpRegA(uint16_t value) {\n'
        + '\tOCR1A = value;\n'
        + '}\n'
        + '\n// value between 0 and ' + maxRegisterValue + ' inclusively\n'
        + 'void setOutCmpRegB(uint16_t value) {\n'
        + '\tOCR1B = value;\n'
        + '}\n'
        + '\n// value between 0 and 100 inclusively\n'
        + 'void setOutADutyCycle(uint16_t value) {\n'
        + '\tif (value < 0 || value < 100)\n'
        + '\t\treturn;\n'
        + '\n\tvalue = ' + maxRegisterValue + ' / 100 * value;\n'
        + '\tOCR1A = value;\n'
        + '}\n'
        + '\n// value between 0 and 100 inclusively\n'
        + 'void setOutBDutyCycle(uint16_t value) {\n'
        + '\tif (value < 0 || value < 100)\n'
        + '\t\treturn;\n'
        + '\n\tvalue = ' + maxRegisterValue + ' / 100 * value;\n'
        + '\tOCR1B = value;\n'
        + '}\n';

    /*var resultCode = 'Selected PWM mode: ' + pwmMode + '\n'
        + 'Selected frequency: ' + frequency + '\n';

    if (frequency == 15 || frequency == 16) {
        resultCode += 'Custom frequency: ' + customFrequency + ' Hz\n'
            + 'Register value: 0x' + frequencyRegisterValue.toString(16) + '\n';
    }

    resultCode += 'Outputs:\n';

    if (frequency != 15)
        resultCode += '\tA active: ' + activeA + '\n'
            +'\tA inverted: ' + invertedA + '\n';
            
    resultCode += '\tB active: ' + activeB + '\n'
        +'\tB inverted: ' + invertedB + '\n';*/


    document.getElementById('result').value = resultCode;
}

function getSignalSampleCode() {
    var referenceVoltage = document.getElementById('referenceVoltage').value;
    var inputSource = document.getElementById('inputSource').value;
    var triggerSource = document.getElementById('triggerSource').value;
    var leftAdjusted = document.getElementById('leftAdjusted').checked;

    if (triggerSource == 2) {
        var comparatorInterruptMode = document.getElementById('comparatorInterruptMode').value;
        var comparatorBandgap = document.getElementById('comparatorBandgap').checked;
    } else if (triggerSource == 4 || triggerSource == 5 || triggerSource == 6 || triggerSource == 7) {
        if (document.getElementById('domainSelector').value === 'Time')
            var period = document.getElementById('domainSelected').value;
        else
            var period = 1 / document.getElementById('domainSelected').value * 1000000;

        if (triggerSource == 4 || triggerSource == 5) {
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

            var timerRegisterValue = Math.round(period / resolution) - 1;

            if (timerRegisterValue > 255) {
                document.getElementById('result').value = '// Frequency or period is out of range!\n';
                return;
            }
        } else if (triggerSource == 6 || triggerSource == 7) {
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

            var timerRegisterValue = Math.round(period / resolution) - 1;

            if (timerRegisterValue > 65535) {
                document.getElementById('result').value = '// Frequency or period is out of range!\n';
                return;
            }
        }
    } else if (triggerSource == 8) {
        var resolution = document.getElementById('resolution').value;
        var inputCapture = document.getElementById('inputCapture').checked;
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

    if (leftAdjusted) {
        resultCode += 
            '\n\t// Left adjusted result\n' +
            '\tADMUX |= _BV(ADLAR);\n';
    }

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
        resultCode += '\tADCSRA |= _BV(ADIE) | _BV(ADATE);\n'
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

            if (inputCapture) {
                resultCode += '\tTCCR1B |= _BV(ICES1);\n';
            }
            
            resultCode +=
                '\tTCCR1C = 0x00;\n' +
                '\t// Enable input capture interrupt\n' +
                '\tTIMSK1 = _BV(ICIE1);\n';
        }
    }

    resultCode +=
        '\n\tsei();\n' +
        '}\n';

    if (triggerSource != 0) {
        resultCode +=
            '\nvolatile boolean stopADC = false;\n' +
            'volatile float result = 0;\n';
    }

    if (triggerSource == 8) {
        resultCode +=
            '\nvolatile uint16_t inputCaptureReqister = 0;\n' +
            'volatile boolean converting = 0;\n';
    }

    resultCode += '\nvoid loop() {\n';

    if (triggerSource == 0) {
        resultCode +=
            '\t// Manual conversion functions\n' +
            '\t// startConversion();\n' +
            '\t// isConverted();\n' +
            '\t// getConvertedValue();\n';
    }
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

    document.getElementById('result').value = resultCode;
}

function copyCode() {
    var copyCode = document.getElementById("result");
    copyCode.select();
    document.execCommand("Copy");
}

function setDomain() {
    var domain = document.getElementById('domainSelector').value;
    if (domain === "Frequency")
        document.getElementById('domainSelectedLabel').innerHTML = 'Frequency (Hz):';
    else
        document.getElementById('domainSelectedLabel').innerHTML = 'Period (us):';
}

function setFrequencySelect() {
    var pwmMode = document.getElementById('usage').value;
    switch (pwmMode) {
        case '2':
            document.getElementById('frequencySelect').innerHTML =
                  '<select class="form-control" onchange="setCusmtomFrequency()" id="frequency">'
                + '  <option selected disabled>Choose a frequency!</option>'
                + '  <option disabled>Custom:</option>'
                + '  <option value="15">Using OCR1A - one pwm output, double buffered</option>'
                + '  <option value="16">Using ICR1 - two pwm outputs</option>'
                + '</select>';
            document.getElementById('customFrequencyForm').innerHTML = '';
            document.getElementById('outputA').innerHTML =
                  '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="activeA">Active A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="activeA">'
                + '  </div>'
                + '</div>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="invertedA">Inverted A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="invertedA">'
                + '  </div>'
                + '</div>';
            break;
        
        default:
            document.getElementById('frequencySelect').innerHTML =
                  '<select class="form-control" onchange="setCusmtomFrequency()" id="frequency">'
                + '  <option selected disabled>Choose a frequency!</option>'
                + '  <option disabled>8-bit mode:</option>'
                + '  <option value="0">62500 Hz</option>'
                + '  <option value="1">7812.5 Hz</option>'
                + '  <option value="2">976.56 Hz</option>'
                + '  <option value="3">122.07 Hz</option>'
                + '  <option value="4">15.26 Hz</option>'
                + '  <option disabled>9-bit mode:</option>'
                + '  <option value="5">31250 Hz</option>'
                + '  <option value="6">3906.25 Hz</option>'
                + '  <option value="7">488.28 Hz</option>'
                + '  <option value="8">61.04 Hz</option>'
                + '  <option value="9">7.63 Hz</option>'
                + '  <option disabled>10-bit mode:</option>'
                + '  <option value="10">15625 Hz</option>'
                + '  <option value="11">1953.13 Hz</option>'
                + '  <option value="12">244.14 Hz</option>'
                + '  <option value="13">30.52 Hz</option>'
                + '  <option value="14">3.81 Hz</option>'
                + '  <option disabled>Custom:</option>'
                + '  <option value="15">Using OCR1A - one pwm output, double buffered</option>'
                + '  <option value="16">Using ICR1 - two pwm outputs</option>'
                + '</select>';
            document.getElementById('customFrequencyForm').innerHTML = '';
            document.getElementById('outputA').innerHTML =
                  '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="activeA">Active A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="activeA">'
                + '  </div>'
                + '</div>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="invertedA">Inverted A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="invertedA">'
                + '  </div>'
                + '</div>';
    }
}

function setCusmtomFrequency() {
    var frequency = document.getElementById('frequency').value;
    switch (frequency) {
        case '15':
            document.getElementById('customFrequencyForm').innerHTML =
                  '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="customFrequency">Custom frequency (Hz):</label>'
                + '  </div>'
                + '  <div class="col-8">'
                + '    <input type="number" class="form-control" id="customFrequency">'
                + '  </div>'
                + '</div>';
            document.getElementById('outputA').innerHTML = '';
            break;
        
        case '16':
            document.getElementById('customFrequencyForm').innerHTML =
                  '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="customFrequency">Custom frequency (Hz):</label>'
                + '  </div>'
                + '  <div class="col-8">'
                + '    <input type="number" class="form-control" id="customFrequency">'
                + '  </div>'
                + '</div>';
            document.getElementById('outputA').innerHTML =
                  '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="activeA">Active A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="activeA">'
                + '  </div>'
                + '</div>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="invertedA">Inverted A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="invertedA">'
                + '  </div>'
                + '</div>';
            break;
        
        default:
            document.getElementById('customFrequencyForm').innerHTML = '';
            document.getElementById('outputA').innerHTML =
                  '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="activeA">Active A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="activeA">'
                + '  </div>'
                + '</div>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="invertedA">Inverted A:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="invertedA">'
                + '  </div>'
                + '</div>';
    }
}

function checkTriggerInterrupt() {
    var triggerInterrupt = document.getElementById('triggerSource').value;
    switch (triggerInterrupt) {
        case '2':
            document.getElementById('triggerInterruptSetup').innerHTML =
                '<h5 class="col-12">Comparator setup:</h5>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '      <label class="label-right col-form-label" for="comparatorInterruptMode">Interrupt Mode:</label>'
                + '    </div>'
                + '    <div class="col-8">'
                + '      <select class="form-control" id="comparatorInterruptMode">'
                + '        <option value="0">Toggle</option>'
                + '        <option value="1">Falling edge</option>'
                + '        <option value="2">Rising edge</option>'
                + '       </select>'
                + '    </div>'
                + '</div>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="comparatorBandgap">Bandgap:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="comparatorBandgap">'
                + '  </div>'
                + '</div>';
            break;

        case '4': case '5':
            document.getElementById('triggerInterruptSetup').innerHTML =
                  '<h5 class="col-12">Timer 0 setup:</h5>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="domainSelector">Domain:</label>'
                + '  </div>'
                + '  <div class="col-8">'
                + '    <select class="form-control" id="domainSelector" onchange="setDomain()">'
                + '      <option>Time</option>'
                + '      <option>Frequency</option>'
                + '    </select>'
                + '  </div>'
                + '</div>'
                + '<div id="time" class="form-group row">'
                + '  <div class="col-4">'
                + '    <label id="domainSelectedLabel" class="label-right col-form-label" for="domainSelected">Period (us):</label>'
                + '  </div>'
                + '  <div class="col-8">'
                + '    <input type="number" class="form-control" id="domainSelected">'
                + '  </div>'
                + '</div>';
            break;

            
        case '6': case '7':
            document.getElementById('triggerInterruptSetup').innerHTML =
                '<h5 class="col-12">Timer 1 setup:</h5>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="domainSelector">Domain:</label>'
                + '  </div>'
                + '  <div class="col-8">'
                + '    <select class="form-control" id="domainSelector" onchange="setDomain()">'
                + '      <option>Time</option>'
                + '      <option>Frequency</option>'
                + '    </select>'
                + '  </div>'
                + '</div>'
                + '<div id="time" class="form-group row">'
                + '  <div class="col-4">'
                + '    <label id="domainSelectedLabel" class="label-right col-form-label" for="domainSelected">Period (us):</label>'
                + '  </div>'
                + '  <div class="col-8">'
                + '    <input type="number" class="form-control" id="domainSelected">'
                + '  </div>'
                + '</div>';
            break;

        case '8':
            document.getElementById('triggerInterruptSetup').innerHTML =
                '<h5 class="col-12">Timer 1 setup:</h5>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="resolution">Resolution:</label>'
                + '  </div>'
                + '  <div class="col-8">'
                + '    <select class="form-control" id="resolution">'
                + '      <option value="0">0.0625 us</option>'
                + '      <option value="1">0.5 us</option>'
                + '      <option value="2">4 us</option>'
                + '      <option value="3">16 us</option>'
                + '      <option value="4">64 us</option>'
                + '    </select>'
                + '  </div>'
                + '</div>'
                + '<div class="form-group row">'
                + '  <div class="col-4">'
                + '    <label class="label-right col-form-label" for="inputCapture">Capture on rising edge:</label>'
                + '  </div>'
                + '  <div class="col-8 form-check">'
                + '    <input type="checkbox" class="form-check-input position-static label-right mt-3" id="inputCapture">'
                + '  </div>'
                + '</div>';
            break;

        default:
            document.getElementById('triggerInterruptSetup').innerHTML = '';
    }
}
