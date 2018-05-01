Vue.component('configurator-header', {
  template: '<header class="navbar col-md-12 bg-arduino header">' +
              '<a class="home-link" href="index.html">' +
                '<h1>Arduino Configurator</h1>' +
              '</a>' +
              '<a class="d-none d-md-block" href="https://www.arduino.cc/" target="_blank">' +
                '<img class="logo" src="images/arduino_logo.png">' +
              '</a>' +
            '</header>'
})

Vue.component('configurator-nav', {
  template: '<div class="col-12 col-md-2 col-xl-1 bg-arduino sidebar">' +
              '<nav class="nav flex-column text-center">' +
                '<template v-for="(module, key) in modules">' +
                  '<a class="sidebar-item" v-bind:href="\'#\' + key" data-toggle="collapse">{{ module.name }}</a>' +
                  '<div class="sub-menu collapse" v-bind:id="key">' +
                    '<a v-for="application in module.applications" class="sub-menu-item" v-bind:href="application.link">{{ application.name }}</a>' +
                  '</div>' +
                '</template>' +
              '</nav>' +
            '</div>',
  props: ['modules'] 
})

new Vue({
    el: '#configurator-app',
    data: {
      // Structure of navigarion
      'modules' : {
        'timer': {
          'name' : 'Timer',
          'applications' : {
            'timeMeasure' : {
              'name' : 'Time Measure',
              'link' : 'modules/timer/timeMeasure.html'
            },
            'periodicInterruptGeneration' : {
              'name' : 'Periodic Interrupt Generation',
              'link' : 'modules/timer/periodicInterruptGeneration.html'
            },
            'squareWaveGeneration' : {
              'name' : 'Square Wave Generation',
              'link' : 'modules/timer/squareWaveGeneration.html'
            },
            'pulseWidthModulation' : {
              'name' : 'Pulse Width Modulation',
              'link' : 'modules/timer/pulseWidthModulation.html'
            }
          }
        },
        'adc': {
          'name' : 'ADC',
          'applications' : {
            'signalSampler' : {
              'name' : 'Signal Sampler',
              'link' : 'modules/adc/signalSampler.html'
            },
            'oversampling' : {
              'name' : 'Oversampling',
              'link' : '#'
            },
            'tempertureMeasure' : {
              'name' : 'Temperature Measure',
              'link' : '#'
            }
          }
        }
      }
    }
  })
