Vue.component('config-app-header', {
    template: `
              <header class="navbar col-md-12 bg-arduino header">
                <a class="home-link" href="index.html">
                  <h1>Arduino Configurator</h1>
                </a>
                <a class="d-none d-md-block" href="https://www.arduino.cc/" target="_blank">
                  <img class="logo" src="images/arduino_logo.png">
                </a>
              </header>
              `
})

Vue.component('config-app-nav', {
  template: `
            <div class="col-12 col-md-2 col-xl-1 bg-arduino sidebar">
              <nav class="nav flex-column text-center">
                <a class="sidebar-item" href="#timerMenu" data-toggle="collapse">Timer</a>
                <div class="sub-menu collapse" id="timerMenu">
                  <a class="sub-menu-item" href="modules/timer/timeMeasure.html">Time Measure</a>
                  <a class="sub-menu-item" href="modules/timer/periodicInterruptGeneration.html">Periodic Interrupt Generation</a>
                  <a class="sub-menu-item" href="modules/timer/squareWaveGeneration.html">Square Wave Generation</a>
                  <a class="sub-menu-item" href="modules/timer/pulseWidthModulation.html">Pulse Width Modulation</a>
                </div>
                <a class="sidebar-item" href="#ADCMenu" data-toggle="collapse">ADC</a>
                <div class="sub-menu collapse" id="ADCMenu">
                  <a class="sub-menu-item" href="modules/adc/signalSampler.html">Signal Sampler</a>
                  <!-- <a class="sub-menu-item" href="#">Temperature Sensor</a> -->
                  <!-- <a class="sub-menu-item" href="#">Oversampling</a> -->
                </div>
              </nav>
            </div>
            `
})
